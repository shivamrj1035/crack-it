import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userByClerkId } from "./user";

// Simple encryption helper (in production, use a proper encryption service)
// This is a placeholder - replace with actual encryption
const encryptKey = (key: string): string => {
  // TODO: Implement proper encryption using environment variable
  // For now, we just base64 encode with a prefix
  return `enc:${Buffer.from(key).toString("base64")}`;
};

const decryptKey = (encryptedKey: string): string => {
  if (encryptedKey.startsWith("enc:")) {
    return Buffer.from(encryptedKey.slice(4), "base64").toString("utf-8");
  }
  return encryptedKey;
};

const getLastFour = (key: string): string => {
  if (key.length <= 4) return key;
  return `...${key.slice(-4)}`;
};

// ==================== AI PROVIDER KEY MANAGEMENT ====================

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    provider: v.string(),
    name: v.string(),
    apiKey: v.string(),
    preferredModel: v.optional(v.string()),
    rateLimitPerMinute: v.optional(v.number()),
  },
  returns: v.id("aiProviderKeys"),
  handler: async (ctx, args) => {
    const user = await userByClerkId(ctx);
    if (!user) throw new Error("User not found");
    if (user.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Encrypt the API key
    const encryptedKey = encryptKey(args.apiKey);
    const keyLastFour = getLastFour(args.apiKey);

    // Check if this is the first key - make it default
    const existingKeys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const isDefault = existingKeys.length === 0;

    const keyId = await ctx.db.insert("aiProviderKeys", {
      organizationId: args.organizationId,
      provider: args.provider,
      name: args.name,
      encryptedKey,
      keyLastFour,
      isActive: true,
      isDefault,
      usageCount: 0,
      preferredModel: args.preferredModel,
      rateLimitPerMinute: args.rateLimitPerMinute,
      createdBy: user._id,
    });

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      action: "ai_provider_created",
      entityType: "aiProvider",
      description: `AI provider "${args.name}" (${args.provider}) was added`,
      timestamp: Date.now(),
    });

    return keyId;
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await userByClerkId(ctx);
    if (!user) throw new Error("User not found");
    if (user.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    const keys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    // Return without encrypted keys for security
    return keys.map((k) => ({
      _id: k._id,
      organizationId: k.organizationId,
      provider: k.provider,
      name: k.name,
      keyLastFour: k.keyLastFour,
      isActive: k.isActive,
      isDefault: k.isDefault,
      lastUsedAt: k.lastUsedAt,
      usageCount: k.usageCount,
      preferredModel: k.preferredModel,
      rateLimitPerMinute: k.rateLimitPerMinute,
    }));
  },
});

export const setDefault = mutation({
  args: {
    organizationId: v.id("organizations"),
    keyId: v.id("aiProviderKeys"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await userByClerkId(ctx);
    if (!user) throw new Error("User not found");
    if (user.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Remove default from all other keys
    const existingKeys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    for (const key of existingKeys) {
      if (key.isDefault && key._id !== args.keyId) {
        await ctx.db.patch(key._id, { isDefault: false });
      }
    }

    // Set new default
    await ctx.db.patch(args.keyId, { isDefault: true });
  },
});

export const deleteKey = mutation({
  args: {
    organizationId: v.id("organizations"),
    keyId: v.id("aiProviderKeys"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await userByClerkId(ctx);
    if (!user) throw new Error("User not found");
    if (user.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("Key not found");
    if (key.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // If deleting default, set another as default
    if (key.isDefault) {
      const otherKeys = await ctx.db
        .query("aiProviderKeys")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .collect();

      const otherActiveKey = otherKeys.find(
        (k) => k._id !== args.keyId && k.isActive
      );
      if (otherActiveKey) {
        await ctx.db.patch(otherActiveKey._id, { isDefault: true });
      }
    }

    await ctx.db.delete(args.keyId);

    await ctx.db.insert("activityLogs", {
      organizationId: args.organizationId,
      userId: user._id,
      action: "ai_provider_deleted",
      entityType: "aiProvider",
      description: `AI provider "${key.name}" was deleted`,
      timestamp: Date.now(),
    });
  },
});

// ==================== USAGE TRACKING ====================

export const incrementUsage = mutation({
  args: { keyId: v.id("aiProviderKeys") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = await ctx.db.get(args.keyId);
    if (!key) throw new Error("Key not found");

    await ctx.db.patch(args.keyId, {
      usageCount: key.usageCount + 1,
      lastUsedAt: Date.now(),
    });
  },
});

// ==================== GET DEFAULT KEY FOR INTERVIEW ====================

export const getDefaultKey = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Try to get default key
    const defaultKey = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_default", (q) =>
        q.eq("organizationId", args.organizationId).eq("isDefault", true)
      )
      .unique();

    if (defaultKey && defaultKey.isActive) {
      return {
        ...defaultKey,
        apiKey: decryptKey(defaultKey.encryptedKey),
      };
    }

    // Fallback to any active key
    const activeKeys = await ctx.db
      .query("aiProviderKeys")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const firstActive = activeKeys.find((k) => k.isActive);
    if (firstActive) {
      return {
        ...firstActive,
        apiKey: decryptKey(firstActive.encryptedKey),
      };
    }

    return null;
  },
});

// ==================== SYSTEM DEFAULT (Platform-wide) ====================

export const getSystemDefault = query({
  args: {},
  returns: v.object({
    provider: v.string(),
    apiKey: v.string(),
    model: v.string(),
  }),
  handler: async (ctx) => {
    // Return platform default Groq key
    // In production, this would come from environment variables
    return {
      provider: "groq",
      apiKey: process.env.GROQ_API_KEY || "",
      model: "llama-3.1-8b-instant",
    };
  },
});
