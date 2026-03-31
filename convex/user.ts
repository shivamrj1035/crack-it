import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { DEFAULT_ORG_SETTINGS, slugify } from "./helpers";

async function ensureLegacyUser(ctx: any, args: { name: string; imageUrl: string; email: string }) {
  const existingUser = await ctx.db
    .query("userTable")
    .filter((q: any) => q.eq(q.field("email"), args.email))
    .first();

  if (existingUser) {
    return existingUser;
  }

  const legacyId = await ctx.db.insert("userTable", {
    name: args.name,
    imageUrl: args.imageUrl,
    email: args.email,
  });

  return await ctx.db.get(legacyId);
}

async function ensureOrganizationForUser(ctx: any, appUser: any, name: string) {
  if (appUser.organizationId) {
    return appUser.organizationId;
  }

  const baseSlug = slugify(`${name}-workspace`) || "workspace";
  let slug = baseSlug;
  let suffix = 1;

  while (
    await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique()
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const organizationId = await ctx.db.insert("organizations", {
    name: `${name.split(" ")[0] || "My"} Workspace`,
    slug,
    description: "Auto-created organization workspace",
    isActive: true,
    subscriptionTier: "free",
    subscriptionStatus: "active",
    settings: DEFAULT_ORG_SETTINGS,
    createdBy: appUser._id,
  });

  await ctx.db.patch(appUser._id, { organizationId });

  await ctx.db.insert("activityLogs", {
    organizationId,
    userId: appUser._id,
    action: "organization_bootstrapped",
    entityType: "organization",
    description: "Starter organization was created during signup bootstrap",
    timestamp: Date.now(),
  });

  return organizationId;
}

export async function userByClerkId(ctx: any) {
  const identity = await ctx.auth?.getUserIdentity?.();
  const clerkId = identity?.subject;

  if (!clerkId) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();
}

export const createNewUser = mutation({
  args: {
    name: v.string(),
    imageUrl: v.string(),
    email: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity?.subject || args.clerkId;

    if (!clerkId) {
      throw new Error("Clerk authentication required");
    }

    const legacyUser = await ensureLegacyUser(ctx, args);

    let appUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!appUser) {
      const appUserId = await ctx.db.insert("users", {
        clerkId,
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        role: "org_admin",
        isActive: true,
        lastLoginAt: Date.now(),
      });
      appUser = await ctx.db.get(appUserId);
    } else {
      await ctx.db.patch(appUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        isActive: true,
        lastLoginAt: Date.now(),
      });
      appUser = await ctx.db.get(appUser._id);
    }

    if (!appUser) {
      throw new Error("Failed to bootstrap app user");
    }

    const organizationId = await ensureOrganizationForUser(ctx, appUser, args.name);
    const refreshedAppUser = await ctx.db.get(appUser._id);

    return {
      ...legacyUser,
      appUserId: refreshedAppUser?._id,
      organizationId,
      role: refreshedAppUser?.role,
      clerkId: args.clerkId,
    };
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});
