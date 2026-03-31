import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertOrgAccess, assertOrgAdmin } from "./helpers";

export const create = mutation({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    interviewerTypeId: v.optional(v.id("interviewerTypes")),
    resumeUrl: v.optional(v.string()),
    source: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const user = await assertOrgAdmin(ctx, args.actorUserId, args.organizationId);

    const existing = await ctx.db
      .query("candidates")
      .withIndex("by_email", (q) =>
        q.eq("organizationId", args.organizationId).eq("email", args.email)
      )
      .unique();

    if (existing) {
      throw new Error("Candidate with this email already exists in the organization");
    }

    const candidateId = await ctx.db.insert("candidates", {
      organizationId: args.organizationId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      interviewerTypeId: args.interviewerTypeId,
      resumeUrl: args.resumeUrl,
      source: args.source || "direct",
      referredBy: args.referredBy,
      notes: args.notes,
      tags: args.tags || [],
      status: "new",
      assignedTo: user._id,
      appliedAt: Date.now(),
      lastActivityAt: Date.now(),
      createdBy: user._id,
    });

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      candidateId,
      action: "candidate_created",
      entityType: "candidate",
      description: `Candidate "${args.name}" was added to the pipeline`,
      timestamp: Date.now(),
    });

    return candidateId;
  },
});

export const list = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    status: v.optional(v.string()),
    interviewerTypeId: v.optional(v.id("interviewerTypes")),
    assignedTo: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    let candidates = await ctx.db
      .query("candidates")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    if (args.status) {
      candidates = candidates.filter((candidate) => candidate.status === args.status);
    }
    if (args.interviewerTypeId) {
      candidates = candidates.filter(
        (candidate) => candidate.interviewerTypeId === args.interviewerTypeId
      );
    }
    if (args.assignedTo) {
      candidates = candidates.filter((candidate) => candidate.assignedTo === args.assignedTo);
    }

    candidates.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

    if (args.limit) {
      candidates = candidates.slice(0, args.limit);
    }

    return candidates;
  },
});

export const getPipelineOverview = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    const [candidates, benchEntries, activityLogs] = await Promise.all([
      ctx.db
        .query("candidates")
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
    ]);

    const statusOrder = [
      "new",
      "screening",
      "interviewing",
      "bench",
      "hired",
      "rejected",
      "withdrawn",
    ];

    return {
      statusCounts: statusOrder.map((status) => ({
        status,
        count: candidates.filter((candidate) => candidate.status === status).length,
      })),
      recentActivity: activityLogs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10),
      benchSummary: {
        total: benchEntries.filter((entry) => entry.isAvailable).length,
        highPriority: benchEntries.filter(
          (entry) => entry.isAvailable && entry.priority === "high"
        ).length,
        dueFollowUps: benchEntries.filter(
          (entry) => entry.isAvailable && entry.followUpDate && entry.followUpDate <= Date.now()
        ).length,
      },
    };
  },
});

export const update = mutation({
  args: {
    actorUserId: v.id("users"),
    id: v.id("candidates"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    interviewerTypeId: v.optional(v.id("interviewerTypes")),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate) throw new Error("Candidate not found");

    const user = await assertOrgAdmin(ctx, args.actorUserId, candidate.organizationId);
    const updates: Record<string, unknown> = {
      lastActivityAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.interviewerTypeId !== undefined) {
      updates.interviewerTypeId = args.interviewerTypeId;
    }
    if (args.status !== undefined) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;

    await ctx.db.patch(args.id, updates);

    if (args.status && args.status !== candidate.status) {
      await ctx.db.insert("activityLogs", {
        organizationId: candidate.organizationId,
        userId: user._id,
        candidateId: args.id,
        action: "candidate_status_changed",
        entityType: "candidate",
        description: `Candidate "${candidate.name}" moved from "${candidate.status}" to "${args.status}"`,
        timestamp: Date.now(),
      });
    }
  },
});

export const moveToBench = mutation({
  args: {
    actorUserId: v.id("users"),
    id: v.id("candidates"),
    benchReason: v.string(),
    detailedReason: v.optional(v.string()),
    priority: v.string(),
    followUpDate: v.optional(v.number()),
    skills: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate) throw new Error("Candidate not found");

    const user = await assertOrgAdmin(ctx, args.actorUserId, candidate.organizationId);

    await ctx.db.patch(args.id, {
      status: "bench",
      benchReason: args.benchReason,
      benchUntil: args.followUpDate,
      lastActivityAt: Date.now(),
    });

    const existingBenchEntry = await ctx.db
      .query("benchPool")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.id))
      .unique();

    if (existingBenchEntry) {
      await ctx.db.patch(existingBenchEntry._id, {
        benchReason: args.benchReason,
        detailedReason: args.detailedReason,
        priority: args.priority,
        followUpDate: args.followUpDate,
        skills: args.skills,
        isAvailable: true,
        nextAction: "Review for re-engagement",
      });
    } else {
      await ctx.db.insert("benchPool", {
        organizationId: candidate.organizationId,
        candidateId: args.id,
        benchReason: args.benchReason,
        detailedReason: args.detailedReason,
        priority: args.priority,
        followUpDate: args.followUpDate,
        skills: args.skills,
        addedAt: Date.now(),
        addedBy: user._id,
        isAvailable: true,
        nextAction: "Review for re-engagement",
      });
    }

    await ctx.db.insert("activityLogs", {
      organizationId: candidate.organizationId,
      userId: user._id,
      candidateId: args.id,
      action: "candidate_moved_to_bench",
      entityType: "candidate",
      description: `Candidate "${candidate.name}" moved to bench`,
      timestamp: Date.now(),
    });
  },
});

export const getBenchCandidates = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    priority: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    let benchEntries = await ctx.db
      .query("benchPool")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    benchEntries = benchEntries.filter((entry) => entry.isAvailable);

    if (args.priority) {
      benchEntries = benchEntries.filter((entry) => entry.priority === args.priority);
    }

    if (args.skills?.length) {
      benchEntries = benchEntries.filter((entry) =>
        args.skills!.some((skill) => entry.skills.includes(skill))
      );
    }

    return await Promise.all(
      benchEntries.map(async (entry) => ({
        ...entry,
        candidate: await ctx.db.get(entry.candidateId),
      }))
    );
  },
});

export const updateBenchEntry = mutation({
  args: {
    actorUserId: v.id("users"),
    benchId: v.id("benchPool"),
    priority: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const benchEntry = await ctx.db.get(args.benchId);
    if (!benchEntry) throw new Error("Bench entry not found");

    await assertOrgAdmin(ctx, args.actorUserId, benchEntry.organizationId);

    const updates: Record<string, unknown> = {
      lastContactedAt: Date.now(),
    };

    if (args.priority !== undefined) updates.priority = args.priority;
    if (args.followUpDate !== undefined) updates.followUpDate = args.followUpDate;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.nextAction !== undefined) updates.nextAction = args.nextAction;
    if (args.isAvailable !== undefined) updates.isAvailable = args.isAvailable;

    await ctx.db.patch(args.benchId, updates);
  },
});

export const reactivateFromBench = mutation({
  args: {
    actorUserId: v.id("users"),
    benchId: v.id("benchPool"),
    newStatus: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const benchEntry = await ctx.db.get(args.benchId);
    if (!benchEntry) throw new Error("Bench entry not found");

    const user = await assertOrgAdmin(ctx, args.actorUserId, benchEntry.organizationId);
    const candidate = await ctx.db.get(benchEntry.candidateId);

    await ctx.db.patch(benchEntry.candidateId, {
      status: args.newStatus,
      lastActivityAt: Date.now(),
      notes:
        candidate?.notes && args.notes
          ? `${candidate.notes}\n\n${args.notes}`
          : args.notes || candidate?.notes,
    });

    await ctx.db.patch(args.benchId, {
      isAvailable: false,
      lastContactedAt: Date.now(),
    });

    await ctx.db.insert("activityLogs", {
      organizationId: benchEntry.organizationId,
      userId: user._id,
      candidateId: benchEntry.candidateId,
      action: "candidate_reactivated",
      entityType: "candidate",
      description: `Candidate reactivated from bench with status "${args.newStatus}"`,
      timestamp: Date.now(),
    });
  },
});

export const queueReengagement = mutation({
  args: {
    actorUserId: v.id("users"),
    benchId: v.id("benchPool"),
    subject: v.string(),
    bodyPreview: v.string(),
  },
  returns: v.id("notificationLogs"),
  handler: async (ctx, args) => {
    const benchEntry = await ctx.db.get(args.benchId);
    if (!benchEntry) throw new Error("Bench entry not found");

    const user = await assertOrgAdmin(ctx, args.actorUserId, benchEntry.organizationId);
    const candidate = await ctx.db.get(benchEntry.candidateId);

    if (!candidate) {
      throw new Error("Candidate not found");
    }

    await ctx.db.patch(args.benchId, {
      lastContactedAt: Date.now(),
      nextAction: "Awaiting candidate response",
    });

    const notificationId = await ctx.db.insert("notificationLogs", {
      organizationId: benchEntry.organizationId,
      candidateId: candidate._id,
      channel: "email",
      type: "reengagement",
      recipient: candidate.email,
      subject: args.subject,
      bodyPreview: args.bodyPreview,
      status: "queued",
      createdBy: user._id,
      createdAt: Date.now(),
      metadata: {
        source: "bench_workflow",
      },
    });

    await ctx.db.insert("activityLogs", {
      organizationId: benchEntry.organizationId,
      userId: user._id,
      candidateId: candidate._id,
      action: "candidate_reengagement_queued",
      entityType: "candidate",
      description: `Re-engagement email queued for "${candidate.name}"`,
      timestamp: Date.now(),
    });

    return notificationId;
  },
});
