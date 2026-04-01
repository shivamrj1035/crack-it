import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

async function resolveInterviewUsers(
  ctx: any,
  userId: Id<"userTable"> | Id<"users">
) {
  const appUser = await ctx.db.get(userId as Id<"users">);

  if (appUser) {
    let legacyUser = await ctx.db
      .query("userTable")
      .filter((q: any) => q.eq(q.field("migratedTo"), appUser._id))
      .first();

    if (!legacyUser) {
      legacyUser = await ctx.db
        .query("userTable")
        .filter((q: any) => q.eq(q.field("email"), appUser.email))
        .first();
    }

    return { appUser, legacyUser };
  }

  const legacyUser = await ctx.db.get(userId as Id<"userTable">);
  const migratedUser = legacyUser?.migratedTo
    ? await ctx.db.get(legacyUser.migratedTo)
    : null;

  return { appUser: migratedUser, legacyUser };
}

export const saveInterviewQuestions = mutation({
    args: { 
      interviewQuestions: v.any(), 
      resumeUrl: v.optional(v.string()), 
      userId: v.union(v.id("userTable"), v.id("users")), 
      jobTitle: v.optional(v.string()), 
      jobExperience: v.optional(v.string()), 
      jobDescription: v.optional(v.string()),
      interviewerTypeId: v.optional(v.id("interviewerTypes"))
    },
    handler: async (ctx, args) => {
        const { appUser, legacyUser } = await resolveInterviewUsers(ctx, args.userId);

        let legacyUserId = legacyUser?._id;
        if (!legacyUserId && appUser) {
            legacyUserId = await ctx.db.insert("userTable", {
                name: appUser.name,
                imageUrl: appUser.imageUrl || "",
                email: appUser.email,
                migratedTo: appUser._id,
            });
        }

        if (!legacyUserId) {
            throw new Error("Unable to resolve a user record for interview creation.");
        }

        // 1. Insert into legacy table for compatibility
        const legacyId = await ctx.db.insert("interviewSessionTable", {
            interviewQuestions: args.interviewQuestions || null, 
            resumeUrl: args.resumeUrl || null,
            userId: legacyUserId,
            status: "draft",
            jobTitle: args.jobTitle || null,
            jobExperience: args.jobExperience || null,
            jobDescription: args.jobDescription || null,
        });
        
        // 2. Insert into enterprise table when the app user is available
        if (appUser?.organizationId) {
            const defaultInterviewerType = await ctx.db
                .query("interviewerTypes")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", appUser.organizationId))
                .filter((q: any) => q.eq(q.field("isDefault"), true))
                .first();

            const interviewerTypeId = args.interviewerTypeId || defaultInterviewerType?._id;

            if (interviewerTypeId) {
            await ctx.db.insert("interviews", {
                organizationId: appUser.organizationId,
                interviewerTypeId,
                createdBy: appUser._id,
                status: "pending",
                questions: (args.interviewQuestions || []).map((q: any) => ({
                    question: q.question,
                    expectedAnswer: q.answer,
                })),
                proctoringEnabled: true,
                startedAt: Date.now(),
            });
            }
        }

        return legacyId; 
    }
});

export const getInterviewQuestions = query({
    args: { 
        interviewRecordId: v.union(v.id("interviewSessionTable"), v.id("interviews")),
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.get(args.interviewRecordId);
        if (!result) {
            throw new Error("No interview record found for the provided ID.");
        }

        // Handle new enterprise interviews format
        if ("questions" in result) {
            return {
                _id: result._id,
                interviewQuestions: result.questions.map((q: any) => ({
                    question: q.question,
                    answer: q.expectedAnswer
                })),
                jobTitle: "Role Interview",
                status: result.status,
                startedAt: result.startedAt,
            };
        }

        // Handle legacy format
        return result;
    }
});

export const updateInterviewFeedback = mutation({
    args: { 
        interviewRecordId: v.union(v.id("interviewSessionTable"), v.id("interviews")),
        feedback: v.any(), // Optional feedback field
     },
    handler: async (ctx, args) => {
        const result = await ctx.db.patch(args.interviewRecordId as any, {
            feedback: args.feedback || null, // Update feedback if provided
            status: "completed" // Update status to completed
        });
        return result; // Return the found record
    }
});

export const getInterviewList = query({
    args: { 
        userId: v.union(v.id("userTable"), v.id("users")),

    },
    handler: async (ctx, args) => {
        const { appUser, legacyUser } = await resolveInterviewUsers(ctx, args.userId);

        // Fetch legacy sessions
        const legacySessions = legacyUser
            ? await ctx.db.query("interviewSessionTable")
                .filter(q => q.eq(q.field("userId"), legacyUser._id))
                .order('desc') 
                .collect()
            : [];

        // Fetch enterprise interviews where the user is the explicit candidate
        let enterpriseInterviews: any[] = [];
        
        if (appUser) {
            // Find all candidate records linked to this user's email
            const userCandidates = await ctx.db
                .query("candidates")
                .filter(q => q.eq(q.field("email"), appUser.email))
                .collect();
                
            // Get interviews assigned to these candidate profiles
            for (const candidate of userCandidates) {
                const orgInterviews = await ctx.db
                    .query("interviews")
                    .withIndex("by_candidate", q => q.eq("candidateId", candidate._id))
                    .collect();
                
                for (const interview of orgInterviews) {
                    const [org, hrUser, role] = await Promise.all([
                        ctx.db.get(interview.organizationId),
                        ctx.db.get(interview.createdBy),
                        ctx.db.get(interview.interviewerTypeId)
                    ]);

                    enterpriseInterviews.push({
                        ...interview,
                        organizationName: org?.name || "Organization",
                        hrName: hrUser?.name || "HR Manager",
                        roleName: role?.name || "Specialized Role",
                        maxDuration: interview.settings?.maxDuration || 30,
                        candidateResumeUrl: candidate.resumeUrl,
                        candidateId: candidate._id
                    });
                }
            }
        }

        // Map enterprise to legacy format for UI consistency
        const mappedEnterprise = enterpriseInterviews.map(i => ({
            _id: i._id,
            _creationTime: i._creationTime,
            status: i.status === "pending" ? "draft" : i.status,
            jobTitle: i.roleName,
            organizationName: i.organizationName,
            hrName: i.hrName,
            maxDuration: i.maxDuration,
            jobExperience: "N/A",
            interviewQuestions: i.questions,
            isOrganization: true,
            candidateResumeUrl: i.candidateResumeUrl,
            candidateId: i.candidateId,
            organizationId: i.organizationId
        }));

        return {
            personal: legacySessions.sort((a, b) => b._creationTime - a._creationTime),
            organization: mappedEnterprise.sort((a, b) => b._creationTime - a._creationTime)
        };
    }
});

export const deleteInterview = mutation({
    args: {
        interviewRecordId: v.union(v.id("interviewSessionTable"), v.id("interviews")),
    },
    handler: async (ctx, args) => {
        // We ensure the record exists before deleting
        const record = await ctx.db.get(args.interviewRecordId as any);
        if (!record) {
            throw new Error("Interview not found");
        }
        
        await ctx.db.delete(args.interviewRecordId as any);
    }
});

export const getByCandidateId = query({
    args: {
        candidateId: v.id("candidates"),
    },
    handler: async (ctx, args) => {
        const interviews = await ctx.db
            .query("interviews")
            .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
            .collect();
        return interviews;
    },
});
