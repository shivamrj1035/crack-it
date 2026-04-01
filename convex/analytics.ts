import { v } from "convex/values";
import { query } from "./_generated/server";
import { assertOrgAccess } from "./helpers";

export const getOverview = query({
  args: {
    actorUserId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (!args.actorUserId || !args.organizationId) {
      return { 
        totals: { candidates: 0, interviewing: 0, hired: 0, rejected: 0, bench: 0, activeBench: 0, completedInterviews: 0, averageScore: 0, averageProctoringScore: 0, followUpsDue: 0, queuedNotifications: 0, activeIntegrations: 0 },
        candidateStatusBreakdown: [],
        sourceBreakdown: [],
        benchByPriority: [],
        notificationBreakdown: [],
        recentActivity: [],
        upcomingBenchFollowUps: []
      };
    }

    const orgId = args.organizationId;
    const actorId = args.actorUserId;

    await assertOrgAccess(ctx, actorId, orgId);

    const [candidates, interviews, benchEntries, activityLogs, notifications, integrations] =
      await Promise.all([
        ctx.db
          .query("candidates")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", orgId)
          )
          .collect(),
        ctx.db
          .query("interviews")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", orgId)
          )
          .collect(),
        ctx.db
          .query("benchPool")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", orgId)
          )
          .collect(),
        ctx.db
          .query("activityLogs")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", orgId)
          )
          .collect(),
        ctx.db
          .query("notificationLogs")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", orgId)
          )
          .collect(),
        ctx.db
          .query("atsIntegrations")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", orgId)
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
