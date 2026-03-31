import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertOrgAdmin, assertOrgAccess } from "./helpers";

const encryptValue = (value: string) => `enc:${Buffer.from(value).toString("base64")}`;

const lastFour = (value?: string) =>
  value && value.length > 4 ? `...${value.slice(-4)}` : value;

export const listATS = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    return await ctx.db
      .query("atsIntegrations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

export const upsertATS = mutation({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    integrationId: v.optional(v.id("atsIntegrations")),
    provider: v.string(),
    name: v.string(),
    apiKey: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    syncDirection: v.string(),
    status: v.string(),
    settings: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.id("atsIntegrations"),
  handler: async (ctx, args) => {
    const user = await assertOrgAdmin(ctx, args.actorUserId, args.organizationId);
    const payload = {
      organizationId: args.organizationId,
      provider: args.provider,
      name: args.name,
      encryptedApiKey: args.apiKey ? encryptValue(args.apiKey) : undefined,
      apiKeyLastFour: lastFour(args.apiKey),
      baseUrl: args.baseUrl,
      webhookUrl: args.webhookUrl,
      syncDirection: args.syncDirection,
      status: args.status,
      settings: args.settings,
      updatedAt: Date.now(),
      createdBy: user._id,
    };

    let integrationId = args.integrationId;

    if (integrationId) {
      await ctx.db.patch(integrationId, payload);
    } else {
      integrationId = await ctx.db.insert("atsIntegrations", payload);
    }

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      action: "ats_integration_saved",
      entityType: "integration",
      description: `${args.provider} integration "${args.name}" was saved`,
      timestamp: Date.now(),
    });

    return integrationId;
  },
});

export const queueNotification = mutation({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    candidateId: v.optional(v.id("candidates")),
    interviewId: v.optional(v.id("interviews")),
    channel: v.string(),
    type: v.string(),
    recipient: v.string(),
    subject: v.optional(v.string()),
    bodyPreview: v.string(),
    status: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.id("notificationLogs"),
  handler: async (ctx, args) => {
    const user = await assertOrgAdmin(ctx, args.actorUserId, args.organizationId);

    const notificationId = await ctx.db.insert("notificationLogs", {
      organizationId: args.organizationId,
      candidateId: args.candidateId,
      interviewId: args.interviewId,
      channel: args.channel,
      type: args.type,
      recipient: args.recipient,
      subject: args.subject,
      bodyPreview: args.bodyPreview,
      status: args.status || "queued",
      metadata: args.metadata,
      createdBy: user._id,
      createdAt: Date.now(),
      sentAt: args.status === "sent" ? Date.now() : undefined,
    });

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      candidateId: args.candidateId,
      interviewId: args.interviewId,
      action: "notification_queued",
      entityType: "notification",
      description: `${args.channel} notification queued for ${args.recipient}`,
      timestamp: Date.now(),
    });

    return notificationId;
  },
});

export const listNotifications = query({
  args: {
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.actorUserId, args.organizationId);

    return await ctx.db
      .query("notificationLogs")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});
