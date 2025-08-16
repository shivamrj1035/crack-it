import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Define schema here
    userTable : defineTable({
        name:v.string(),
        imageUrl : v.string(),
        email: v.string()
    }),
    interviewSessionTable : defineTable({
        interviewQuestions : v.any(),
        resumeUrl : v.union(v.string(),v.null()),
        userId: v.id("userTable"),
        status: v.string(),
        jobTitle: v.union(v.string(),v.null()),
        jobExperience: v.union(v.string(),v.null()),
        jobDescription: v.union(v.string(),v.null()),
    })
})