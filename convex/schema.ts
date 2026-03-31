import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// User Roles
export const UserRole = {
  SUPER_ADMIN: "super_admin", // Platform admin
  ORG_ADMIN: "org_admin", // Company admin
  HR_MANAGER: "hr_manager", // Can manage candidates
  INTERVIEWER: "interviewer", // Can conduct interviews
  CANDIDATE: "candidate", // Interviewee
} as const;

// Interview Status
export const InterviewStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REVIEWING: "reviewing",
  PASSED: "passed",
  FAILED: "failed",
  BENCHED: "benched",
} as const;

// Candidate Status in Pipeline
export const CandidateStatus = {
  NEW: "new",
  SCREENING: "screening",
  INTERVIEWING: "interviewing",
  BENCH: "bench",
  HIRED: "hired",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
} as const;

// AI Provider Types
export const AIProvider = {
  GROQ: "groq",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  OLLAMA: "ollama",
  CUSTOM: "custom",
} as const;

// Proctoring Event Types
export const ProctoringEventType = {
  TAB_SWITCH: "tab_switch",
  COPY_PASTE: "copy_paste",
  RIGHT_CLICK: "right_click",
  MULTIPLE_FACES: "multiple_faces",
  NO_FACE: "no_face",
  SCREENSHOT: "screenshot",
  INACTIVITY: "inactivity",
  FULLSCREEN_EXIT: "fullscreen_exit",
} as const;

export default defineSchema({
  // ==================== ORGANIZATION ====================
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly name
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.string()), // "1-10", "11-50", etc.
    isActive: v.boolean(),
    subscriptionTier: v.string(), // "free", "pro", "enterprise"
    subscriptionStatus: v.string(), // "active", "paused", "cancelled"
    // Organization settings
    settings: v.optional(
      v.object({
        requireProctoring: v.boolean(),
        allowTabSwitch: v.boolean(),
        maxTabSwitches: v.number(),
        captureScreenshots: v.boolean(),
        screenshotInterval: v.number(), // seconds
        requireFullscreen: v.boolean(),
        autoSubmitOnViolation: v.boolean(),
      })
    ),
    createdBy: v.id("users"),
  })
    .index("by_slug", ["slug"])
    .index("by_subscription", ["subscriptionStatus"]),

  // ==================== USERS ====================
  users: defineTable({
    // Clerk user ID
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    // Role-based access
    role: v.string(), // UserRole values
    // Organization (null for super admins who can access multiple)
    organizationId: v.optional(v.id("organizations")),
    // For candidates
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    timezone: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_organization", ["organizationId"])
    .index("by_role", ["role"]),

  // ==================== AI PROVIDER KEYS (BYOK) ====================
  aiProviderKeys: defineTable({
    organizationId: v.id("organizations"),
    provider: v.string(), // AIProvider values
    name: v.string(), // e.g., "Production Groq", "Backup OpenAI"
    // Encrypted API key
    encryptedKey: v.string(),
    // Key last 4 digits for display (e.g., "sk-...abcd")
    keyLastFour: v.string(),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    // Usage tracking
    lastUsedAt: v.optional(v.number()),
    usageCount: v.number(),
    // Rate limiting
    rateLimitPerMinute: v.optional(v.number()),
    // Model preferences for this key
    preferredModel: v.optional(v.string()), // e.g., "llama-3.1-8b-instant"
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_provider", ["organizationId", "provider"])
    .index("by_default", ["organizationId", "isDefault"]),

  // ==================== INTERVIEWER TYPES ====================
  interviewerTypes: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // e.g., "Frontend Developer"
    slug: v.string(), // e.g., "frontend-developer"
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    // AI configuration
    systemPrompt: v.string(),
    evaluationCriteria: v.optional(v.array(v.string())),
    // Interview structure
    defaultQuestionCount: v.number(),
    estimatedDuration: v.number(), // minutes
    // Skills being assessed
    skills: v.array(v.string()),
    // Difficulty levels
    difficulty: v.string(), // "junior", "mid", "senior", "principal"
    isActive: v.boolean(),
    isDefault: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_organization", ["organizationId"])
    .index("by_slug", ["organizationId", "slug"]),

  // ==================== CANDIDATES ====================
  candidates: defineTable({
    organizationId: v.id("organizations"),
    // Basic info
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    // Resume
    resumeUrl: v.optional(v.string()),
    resumeText: v.optional(v.string()), // Parsed text
    // Role applied for
    interviewerTypeId: v.optional(v.id("interviewerTypes")),
    // Pipeline status
    status: v.string(), // CandidateStatus values
    // Source tracking
    source: v.optional(v.string()), // "linkedin", "referral", "direct"
    referredBy: v.optional(v.string()),
    // Internal notes
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Bench specific
    benchReason: v.optional(v.string()),
    benchUntil: v.optional(v.number()),
    // Assigned to
    assignedTo: v.optional(v.id("users")), // HR manager
    // Timestamps
    appliedAt: v.number(),
    lastActivityAt: v.number(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["organizationId", "email"])
    .index("by_status", ["organizationId", "status"])
    .index("by_assigned", ["organizationId", "assignedTo"])
    .index("by_bench", ["organizationId", "status", "benchUntil"]),

  // ==================== INTERVIEWS ====================
  interviews: defineTable({
    organizationId: v.id("organizations"),
    candidateId: v.id("candidates"),
    interviewerTypeId: v.id("interviewerTypes"),
    // Who created/conducting
    createdBy: v.id("users"),
    conductedBy: v.optional(v.id("users")), // null = AI
    // Status
    status: v.string(), // InterviewStatus values
    // Questions
    questions: v.array(
      v.object({
        question: v.string(),
        answer: v.optional(v.string()),
        expectedAnswer: v.optional(v.string()),
        askedAt: v.optional(v.number()),
        answeredAt: v.optional(v.number()),
        score: v.optional(v.number()), // 0-10
        followUpQuestions: v.optional(v.array(v.string())),
      })
    ),
    // AI configuration used
    aiProviderKeyId: v.optional(v.id("aiProviderKeys")),
    // Results
    overallScore: v.optional(v.number()),
    feedback: v.optional(
      v.object({
        summary: v.string(),
        strengths: v.array(v.string()),
        weaknesses: v.array(v.string()),
        recommendations: v.string(),
        technicalScore: v.number(),
        communicationScore: v.number(),
        cultureFitScore: v.number(),
      })
    ),
    // Proctoring
    proctoringEnabled: v.boolean(),
    proctoringScore: v.optional(v.number()), // Trust score 0-100
    violationCount: v.optional(v.number()),
    // Timing
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // actual duration in seconds
    // Settings
    settings: v.optional(
      v.object({
        allowRetake: v.boolean(),
        maxDuration: v.number(), // minutes
        passingScore: v.number(),
      })
    ),
  })
    .index("by_organization", ["organizationId"])
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["organizationId", "status"])
    .index("by_scheduled", ["organizationId", "scheduledAt"]),

  // ==================== PROCTORING LOGS ====================
  proctoringLogs: defineTable({
    organizationId: v.id("organizations"),
    interviewId: v.id("interviews"),
    candidateId: v.id("candidates"),
    // Event details
    eventType: v.string(), // ProctoringEventType values
    severity: v.string(), // "low", "medium", "high", "critical"
    description: v.string(),
    // Context
    timestamp: v.number(),
    questionIndex: v.optional(v.number()), // Which question were they on
    // Evidence
    screenshotUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      tabTitle: v.optional(v.string()),
      tabUrl: v.optional(v.string()),
      faceCount: v.optional(v.number()),
      confidenceScore: v.optional(v.number()),
      inactiveDuration: v.optional(v.number()),
    })),
    // Resolution
    isResolved: v.boolean(),
    resolvedBy: v.optional(v.id("users")),
    resolutionNote: v.optional(v.string()),
  })
    .index("by_interview", ["interviewId"])
    .index("by_candidate", ["candidateId"])
    .index("by_organization", ["organizationId", "eventType"])
    .index("by_severity", ["organizationId", "severity"]),

  // ==================== BENCH POOL ====================
  benchPool: defineTable({
    organizationId: v.id("organizations"),
    candidateId: v.id("candidates"),
    // Why they're on the bench
    benchReason: v.string(), // "skills_gap", "position_filled", "timing", "budget"
    detailedReason: v.optional(v.string()),
    // Re-engagement
    priority: v.string(), // "low", "medium", "high"
    followUpDate: v.optional(v.number()),
    // Skills they have (for matching future roles)
    skills: v.array(v.string()),
    // Previous interview results
    lastInterviewScore: v.optional(v.number()),
    interviewFeedback: v.optional(v.string()),
    // Notes
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Activity
    addedAt: v.number(),
    addedBy: v.id("users"),
    lastContactedAt: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    isAvailable: v.boolean(), // Is candidate still available
  })
    .index("by_organization", ["organizationId"])
    .index("by_candidate", ["candidateId"])
    .index("by_priority", ["organizationId", "priority"])
    .index("by_follow_up", ["organizationId", "followUpDate"])
    .index("by_skills", ["organizationId", "skills"]),

  // ==================== INTERVIEW TEMPLATES ====================
  interviewTemplates: defineTable({
    organizationId: v.id("organizations"),
    interviewerTypeId: v.id("interviewerTypes"),
    name: v.string(),
    description: v.optional(v.string()),
    // Template content
    questions: v.array(
      v.object({
        question: v.string(),
        expectedAnswer: v.string(),
        category: v.string(), // "technical", "behavioral", "experience"
        difficulty: v.string(), // "easy", "medium", "hard"
        timeEstimate: v.number(), // minutes
      })
    ),
    // Configuration
    isDefault: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["interviewerTypeId"]),

  // ==================== ACTIVITY LOGS ====================
  activityLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    candidateId: v.optional(v.id("candidates")),
    interviewId: v.optional(v.id("interviews")),
    // Action details
    action: v.string(), // "candidate_created", "interview_started", "candidate_moved_to_bench"
    entityType: v.string(), // "candidate", "interview", "organization"
    description: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_candidate", ["candidateId"])
    .index("by_timestamp", ["organizationId", "timestamp"]),

  // ==================== ATS INTEGRATIONS ====================
  atsIntegrations: defineTable({
    organizationId: v.id("organizations"),
    provider: v.string(), // "greenhouse", "lever"
    name: v.string(),
    encryptedApiKey: v.optional(v.string()),
    apiKeyLastFour: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    syncDirection: v.string(), // "import", "export", "bidirectional"
    status: v.string(), // "connected", "needs_attention", "disabled"
    lastSyncAt: v.optional(v.number()),
    settings: v.optional(v.record(v.string(), v.string())),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_provider", ["organizationId", "provider"]),

  // ==================== NOTIFICATION LOGS ====================
  notificationLogs: defineTable({
    organizationId: v.id("organizations"),
    candidateId: v.optional(v.id("candidates")),
    interviewId: v.optional(v.id("interviews")),
    channel: v.string(), // "email", "slack", "webhook"
    type: v.string(), // "reengagement", "status_change", "report_ready"
    recipient: v.string(),
    subject: v.optional(v.string()),
    bodyPreview: v.string(),
    status: v.string(), // "queued", "sent", "failed"
    metadata: v.optional(v.record(v.string(), v.string())),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["organizationId", "status"]),

  // ==================== LEGACY TABLES (for migration) ====================
  userTable: defineTable({
    name: v.string(),
    imageUrl: v.string(),
    email: v.string(),
    // Migration flag
    migratedTo: v.optional(v.id("users")),
  }),

  interviewSessionTable: defineTable({
    interviewQuestions: v.any(),
    resumeUrl: v.union(v.string(), v.null()),
    userId: v.id("userTable"),
    status: v.string(),
    jobTitle: v.union(v.string(), v.null()),
    jobExperience: v.union(v.string(), v.null()),
    jobDescription: v.union(v.string(), v.null()),
    feedback: v.optional(v.any()),
    // Migration flag
    migratedTo: v.optional(v.id("interviews")),
  }),
});
