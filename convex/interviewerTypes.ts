import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertOrgAccess, assertOrgAdmin } from "./helpers";

export const DEFAULT_INTERVIEWERS = [
  {
    name: "Frontend Developer",
    slug: "frontend-developer",
    description:
      "Technical assessment for frontend positions covering HTML, CSS, JavaScript, React, and modern frameworks.",
    icon: "code-2",
    color: "#3b82f6",
    systemPrompt:
      "You are an expert frontend interviewer. Assess practical knowledge of modern UI engineering, system design tradeoffs, accessibility, performance, testing, and communication.",
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Accessibility"],
    difficulty: "mid",
    defaultQuestionCount: 10,
    estimatedDuration: 45,
  },
  {
    name: "Backend Developer",
    slug: "backend-developer",
    description:
      "Technical assessment for backend positions covering APIs, databases, distributed systems, and reliability.",
    icon: "server",
    color: "#22c55e",
    systemPrompt:
      "You are an expert backend interviewer. Assess API design, data modeling, debugging, scalability, reliability, and secure engineering decisions.",
    skills: ["Node.js", "Python", "SQL", "System Design", "Caching", "Security"],
    difficulty: "mid",
    defaultQuestionCount: 10,
    estimatedDuration: 45,
  },
  {
    name: "DevOps Engineer",
    slug: "devops-engineer",
    description:
      "Assessment for DevOps roles covering cloud platforms, automation, observability, and operational readiness.",
    icon: "cloud",
    color: "#f59e0b",
    systemPrompt:
      "You are an expert DevOps interviewer. Assess infrastructure automation, incident response, CI/CD, cloud architecture, and platform reliability.",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Observability", "CI/CD"],
    difficulty: "senior",
    defaultQuestionCount: 10,
    estimatedDuration: 50,
  },
];

async function seedDefaultInterviewerTypes(ctx: any, organizationId: any, userId: any) {
  for (const template of DEFAULT_INTERVIEWERS) {
    const existing = await ctx.db
      .query("interviewerTypes")
      .withIndex("by_slug", (q: any) =>
        q.eq("organizationId", organizationId).eq("slug", template.slug)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("interviewerTypes", {
        organizationId,
        ...template,
        evaluationCriteria: [
          "Technical knowledge depth",
          "Problem-solving approach",
          "Communication clarity",
          "Delivery under constraints",
        ],
        isActive: true,
        isDefault: true,
        createdBy: userId,
      });
    }
  }
}

export const createDefaultTypes = mutation({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await assertOrgAdmin(ctx, args.actorUserId, args.organizationId);
    await seedDefaultInterviewerTypes(ctx, args.organizationId, user._id);
  },
});

export const list = query({
  args: {
    actorUserId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (!args.organizationId) {
      return [];
    }

    if (args.actorUserId) {
      await assertOrgAccess(ctx, args.actorUserId, args.organizationId);
    }

    const types = await ctx.db
      .query("interviewerTypes")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId!)
      )
      .collect();

    return types.filter((item) => item.isActive);
  },
});

export const getById = query({
  args: {
    actorUserId: v.optional(v.id("users")),
    id: v.id("interviewerTypes"),
  },
  handler: async (ctx, args) => {
    const interviewerType = await ctx.db.get(args.id);

    if (!interviewerType) {
      return null;
    }

    if (args.actorUserId) {
      await assertOrgAccess(ctx, args.actorUserId, interviewerType.organizationId);
    }

    return interviewerType;
  },
});

export const create = mutation({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    systemPrompt: v.string(),
    skills: v.array(v.string()),
    difficulty: v.string(),
    defaultQuestionCount: v.number(),
    estimatedDuration: v.number(),
    evaluationCriteria: v.array(v.string()),
  },
  returns: v.id("interviewerTypes"),
  handler: async (ctx, args) => {
    const user = await assertOrgAdmin(ctx, args.actorUserId, args.organizationId);

    const existing = await ctx.db
      .query("interviewerTypes")
      .withIndex("by_slug", (q) =>
        q.eq("organizationId", args.organizationId).eq("slug", args.slug)
      )
      .unique();

    if (existing) {
      throw new Error("Interviewer type with this slug already exists");
    }

    const typeId = await ctx.db.insert("interviewerTypes", {
      organizationId: args.organizationId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      systemPrompt: args.systemPrompt,
      skills: args.skills,
      difficulty: args.difficulty,
      defaultQuestionCount: args.defaultQuestionCount,
      estimatedDuration: args.estimatedDuration,
      evaluationCriteria: args.evaluationCriteria,
      icon: "user",
      color: "#0f766e",
      isActive: true,
      isDefault: false,
      createdBy: user._id,
    });

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      action: "interviewer_type_created",
      entityType: "interviewerType",
      description: `Custom interviewer "${args.name}" was created`,
      timestamp: Date.now(),
    });

    return typeId;
  },
});

export const update = mutation({
  args: {
    actorUserId: v.id("users"),
    id: v.id("interviewerTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    difficulty: v.optional(v.string()),
    defaultQuestionCount: v.optional(v.number()),
    estimatedDuration: v.optional(v.number()),
    evaluationCriteria: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const type = await ctx.db.get(args.id);

    if (!type) {
      throw new Error("Interviewer type not found");
    }

    await assertOrgAdmin(ctx, args.actorUserId, type.organizationId);

    const updates: Record<string, unknown> = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.systemPrompt !== undefined) updates.systemPrompt = args.systemPrompt;
    if (args.skills !== undefined) updates.skills = args.skills;
    if (args.difficulty !== undefined) updates.difficulty = args.difficulty;
    if (args.defaultQuestionCount !== undefined) {
      updates.defaultQuestionCount = args.defaultQuestionCount;
    }
    if (args.estimatedDuration !== undefined) {
      updates.estimatedDuration = args.estimatedDuration;
    }
    if (args.evaluationCriteria !== undefined) {
      updates.evaluationCriteria = args.evaluationCriteria;
    }
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);
  },
});

export const deleteType = mutation({
  args: {
    actorUserId: v.id("users"),
    id: v.id("interviewerTypes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const type = await ctx.db.get(args.id);

    if (!type) {
      throw new Error("Interviewer type not found");
    }

    const user = await assertOrgAdmin(ctx, args.actorUserId, type.organizationId);

    await ctx.db.patch(args.id, { isActive: false });

    await ctx.db.insert("activityLogs", {
      organizationId: type.organizationId,
      userId: user._id,
      action: "interviewer_type_deleted",
      entityType: "interviewerType",
      description: `Interviewer type "${type.name}" was archived`,
      timestamp: Date.now(),
    });
  },
});
