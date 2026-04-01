import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

async function resolveNotificationUserId(
  ctx: any,
  userId: Id<"userTable"> | Id<"users">
) {
  const appUser = await ctx.db.get(userId as Id<"users">);
  if (appUser) {
    return appUser._id;
  }

  const legacyUser = await ctx.db.get(userId as Id<"userTable">);
  if (!legacyUser) {
    return null;
  }

  if (legacyUser.migratedTo) {
    return legacyUser.migratedTo;
  }

  const migratedUser = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("email"), legacyUser.email))
    .first();

  return migratedUser?._id ?? null;
}

export const getUserNotifications = query({
  args: {
    userId: v.union(v.id("userTable"), v.id("users")),
  },
  handler: async (ctx, args) => {
    const resolvedUserId = await resolveNotificationUserId(ctx, args.userId);
    if (!resolvedUserId) return [];

    const notifications = await ctx.db
      .query("inAppNotifications")
      .withIndex("by_user", (q) => q.eq("userId", resolvedUserId))
      .order("desc")
      .collect();

    return notifications;
  },
});

export const markAsRead = mutation({
  args: {
    notificationId: v.id("inAppNotifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {
    userId: v.union(v.id("userTable"), v.id("users")),
  },
  handler: async (ctx, args) => {
    const resolvedUserId = await resolveNotificationUserId(ctx, args.userId);
    if (!resolvedUserId) return;

    const unread = await ctx.db
      .query("inAppNotifications")
      .withIndex("by_unread", (q) =>
        q.eq("userId", resolvedUserId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
    );
  },
});
