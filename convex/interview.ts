import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveInterviewQuestions = mutation({
    args: { 
      interviewQuestions: v.any(), 
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
});

export const getInterviewQuestions = query({
    args: { 
        interviewRecordId: v.id('interviewSessionTable'),

    },
    handler: async (ctx, args) => {
        const result = await ctx.db.query("interviewSessionTable")
            .filter(q => q.eq(q.field("_id"), args.interviewRecordId))
            .first(); // Fetch a single record
        if (!result) {
            throw new Error("No interview record found for the provided ID.");
        }
        return result; // Return the found record
    }
});

export const updateInterviewFeedback = mutation({
    args: { 
        interviewRecordId: v.id('interviewSessionTable'),
        feedback: v.any(), // Optional feedback field
     },
    handler: async (ctx, args) => {
        const result = await ctx.db.patch(args.interviewRecordId, {
            feedback: args.feedback || null, // Update feedback if provided
            status: "completed" // Update status to completed
        });
        return result; // Return the found record
    }
});

export const getInterviewList = query({
    args: { 
        userId: v.id('userTable'),

    },
    handler: async (ctx, args) => {
        const result = await ctx.db.query("interviewSessionTable")
            .filter(q => q.eq(q.field("userId"), args.userId))
            .order('desc') 
            .collect(); // Fetch a single record
        if (!result) {
            throw new Error("No interview record found for the provided ID.");
        }
        return result; // Return the found record
    }
});