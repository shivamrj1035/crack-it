import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Log a proctoring violation or event during an interview.
 */
export const logEvent = mutation({
  args: {
    interviewId: v.id("interviews"),
    organizationId: v.optional(v.id("organizations")),
    candidateId: v.optional(v.id("candidates")),
    eventType: v.optional(v.string()),
    type: v.optional(v.string()), // legacy alias
    severity: v.string(), // "LOW", "MEDIUM", "HIGH"
    description: v.optional(v.string()),
    details: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        tabTitle: v.optional(v.string()),
        tabUrl: v.optional(v.string()),
        faceCount: v.optional(v.number()),
        confidenceScore: v.optional(v.number()),
        inactiveDuration: v.optional(v.number()),
      })
    ),
    questionIndex: v.optional(v.number()),
    screenshotUrl: v.optional(v.string()),
    snapshotUrl: v.optional(v.string()), // URL to screenshot or capture
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId);

    if (!interview) {
      throw new Error("Interview not found.");
    }

    const eventType = args.eventType || args.type;
    if (!eventType) {
      throw new Error("eventType is required.");
    }

    const organizationId = args.organizationId || interview.organizationId;
    const candidateId = args.candidateId || interview.candidateId;

    if (!candidateId) {
      throw new Error("candidateId is required for proctoring logs.");
    }

    const logId = await ctx.db.insert("proctoringLogs", {
      organizationId,
      interviewId: args.interviewId,
      candidateId,
      eventType,
      severity: args.severity.toLowerCase(),
      description: args.description || args.details || `${eventType} detected`,
      timestamp: Date.now(),
      questionIndex: args.questionIndex,
      screenshotUrl: args.screenshotUrl || args.snapshotUrl,
      metadata: args.metadata,
      isResolved: false,
    });

    return logId;
  },
});

/**
 * Get all proctoring logs for a specific interview.
 */
export const getLogs = query({
  args: { interviewId: v.id("interviews") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proctoringLogs")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .order("desc")
      .collect();
  },
});
