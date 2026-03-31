import { v } from "convex/values";
import { query } from "./_generated/server";
import { assertOrgAccess } from "./helpers";

export const getOverview = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    const [candidates, interviews, benchEntries, activityLogs, notifications, integrations] =
      await Promise.all([
        ctx.db
          .query("candidates")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .collect(),
        ctx.db
          .query("interviews")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .collect(),
        ctx.db
          .query("benchPool")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .collect(),
        ctx.db
          .query("activityLogs")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .collect(),
        ctx.db
          .query("notificationLogs")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .collect(),
        ctx.db
          .query("atsIntegrations")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .collect(),
      ]);

    const statusCounts = candidates.reduce<Record<string, number>>((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {});

    const sourceCounts = candidates.reduce<Record<string, number>>((acc, candidate) => {
      const source = candidate.source || "unknown";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const completedInterviews = interviews.filter((item) => item.completedAt);
    const averageScore =
      completedInterviews.length > 0
        ? completedInterviews.reduce((sum, item) => sum + (item.overallScore || 0), 0) /
          completedInterviews.length
        : 0;
    const averageProctoringScore =
      completedInterviews.length > 0
        ? completedInterviews.reduce(
            (sum, item) => sum + (item.proctoringScore || 0),
            0
          ) / completedInterviews.length
        : 0;

    const followUpsDue = benchEntries.filter(
      (entry) => entry.isAvailable && entry.followUpDate && entry.followUpDate <= Date.now()
    ).length;

    return {
      totals: {
        candidates: candidates.length,
        interviewing: statusCounts.interviewing || 0,
        hired: statusCounts.hired || 0,
        rejected: statusCounts.rejected || 0,
        bench: statusCounts.bench || 0,
        activeBench: benchEntries.filter((entry) => entry.isAvailable).length,
        completedInterviews: completedInterviews.length,
        averageScore: Math.round(averageScore * 10) / 10,
        averageProctoringScore: Math.round(averageProctoringScore * 10) / 10,
        followUpsDue,
        queuedNotifications: notifications.filter((item) => item.status === "queued").length,
        activeIntegrations: integrations.filter((item) => item.status === "connected").length,
      },
      candidateStatusBreakdown: Object.entries(statusCounts).map(([label, value]) => ({
        label,
        value,
      })),
      sourceBreakdown: Object.entries(sourceCounts).map(([label, value]) => ({
        label,
        value,
      })),
      benchByPriority: ["high", "medium", "low"].map((priority) => ({
        label: priority,
        value: benchEntries.filter(
          (entry) => entry.priority === priority && entry.isAvailable
        ).length,
      })),
      notificationBreakdown: ["queued", "sent", "failed"].map((status) => ({
        label: status,
        value: notifications.filter((item) => item.status === status).length,
      })),
      recentActivity: activityLogs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 8),
      upcomingBenchFollowUps: benchEntries
        .filter((entry) => entry.isAvailable && entry.followUpDate)
        .sort((a, b) => (a.followUpDate || 0) - (b.followUpDate || 0))
        .slice(0, 8),
    };
  },
});
