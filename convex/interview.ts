import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const saveInterviewQuestions = mutation({
    args: { 
      interviewQuestions: v.any(), // Made optional
      resumeUrl: v.optional(v.string()), 
      userId: v.id("userTable"), 
      jobTitle: v.optional(v.string()), 
      jobExperience: v.optional(v.string()), 
      jobDescription: v.optional(v.string()) 
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert("interviewSessionTable", {
            interviewQuestions: args.interviewQuestions || null, 
            resumeUrl: args.resumeUrl || null,
            userId: args.userId,
            status: "draft",
            jobTitle: args.jobTitle || null,
            jobExperience: args.jobExperience || null,
            jobDescription: args.jobDescription || null,
        });
        return result; 
    }
})