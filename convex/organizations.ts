import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertOrgAccess, assertOrgAdmin, DEFAULT_ORG_SETTINGS } from "./helpers";

// ==================== ORGANIZATION MANAGEMENT ====================

export const create = mutation({
  args: {
    actorUserId: v.id("users"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.actorUserId);
    if (!user) throw new Error("User not found");

    // Check if slug is unique
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error("Organization slug already exists");
    }

    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      website: args.website,
      industry: args.industry,
      size: args.size,
      isActive: true,
      subscriptionTier: "free",
      subscriptionStatus: "active",
      settings: DEFAULT_ORG_SETTINGS,
      createdBy: user._id,
    });

    // Update user to be org admin
    await ctx.db.patch(user._id, {
      organizationId: orgId,
      role: "org_admin",
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      organizationId: orgId,
      userId: user._id,
      action: "organization_created",
      entityType: "organization",
      description: `Organization "${args.name}" was created`,
      timestamp: Date.now(),
    });

    return orgId;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getMyOrganization = query({
  args: { actorUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.actorUserId);
    if (!user?.organizationId) return null;

    return await ctx.db.get(user.organizationId);
  },
});

export const updateSettings = mutation({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    settings: v.object({
      requireProctoring: v.boolean(),
      allowTabSwitch: v.boolean(),
      maxTabSwitches: v.number(),
      captureScreenshots: v.boolean(),
      screenshotInterval: v.number(),
      requireFullscreen: v.boolean(),
      autoSubmitOnViolation: v.boolean(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await assertOrgAdmin(ctx, args.actorUserId, args.organizationId);

    await ctx.db.patch(args.organizationId, {
      settings: args.settings,
    });

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      action: "settings_updated",
      entityType: "organization",
      description: "Organization settings were updated",
      timestamp: Date.now(),
    });
  },
});

// ==================== STATISTICS ====================

export const getDashboardStats = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    totalCandidates: v.number(),
    activeInterviews: v.number(),
    completedInterviews: v.number(),
    benchCount: v.number(),
    recentCandidates: v.array(v.any()),
    upcomingInterviews: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    // Get candidate counts
    const candidates = await ctx.db
      .query("candidates")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const totalCandidates = candidates.length;
    const benchCount = candidates.filter((c) => c.status === "bench").length;

    // Get interview counts
    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const activeInterviews = interviews.filter(
      (i) => i.status === "in_progress" || i.status === "pending"
    ).length;
    const completedInterviews = interviews.filter(
      (i) => i.status === "completed"
    ).length;

    // Get recent candidates (last 5)
    const recentCandidates = candidates
      .sort((a, b) => b.appliedAt - a.appliedAt)
      .slice(0, 5);

    // Get upcoming interviews (next 5)
    const upcomingInterviews = interviews
      .filter((i) => i.scheduledAt && i.scheduledAt > Date.now())
      .sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0))
      .slice(0, 5);

    return {
      totalCandidates,
      activeInterviews,
      completedInterviews,
      benchCount,
      recentCandidates,
      upcomingInterviews,
    };
  },
});
