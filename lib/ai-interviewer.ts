import { getSystemDefault } from "./groq";

// Types for specialized interviewers
export interface InterviewerConfig {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  skills: string[];
  difficulty: "junior" | "mid" | "senior" | "principal";
  questionCount: number;
  estimatedDuration: number;
  evaluationCriteria: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  expectedAnswer: string;
  category: "technical" | "behavioral" | "experience" | "problem_solving";
  difficulty: "easy" | "medium" | "hard";
  skillsAssessed: string[];
  followUpQuestions?: string[];
  timeEstimate: number; // minutes
}

export interface CandidateResponse {
  questionId: string;
  answer: string;
  audioTranscript?: string;
  timeSpent: number; // seconds
  confidence?: number;
}

export interface InterviewEvaluation {
  questionId: string;
  score: number; // 0-10
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  missingPoints: string[];
  followUpNeeded: boolean;
  suggestedFollowUp?: string;
}

export interface InterviewResult {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  culturalFitScore: number;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendation: "strong_hire" | "hire" | "consider" | "reject";
  skillAssessments: Record<string, number>;
}

// Specialized interviewer configurations
export const SPECIALIZED_INTERVIEWERS: Record<string, InterviewerConfig> = {
  "frontend-developer": {
    id: "frontend-developer",
    name: "Frontend Developer Interviewer",
    role: "Frontend Developer",
    systemPrompt: `You are an expert Frontend Developer interviewer with 10+ years of experience in React, Vue, Angular, and modern web technologies.

Your interviewing style:
- Start with fundamentals, then progress to complex scenarios
- Ask practical questions based on real-world problems
- Evaluate code quality, performance awareness, and best practices
- Be encouraging but thorough in your assessments

Key areas to assess:
1. HTML5 semantic markup and accessibility
2. CSS3, responsive design, and modern layouts (Flexbox, Grid)
3. JavaScript fundamentals and ES6+ features
4. React/Vue/Angular frameworks and patterns
5. State management (Redux, Context, Zustand, etc.)
6. Performance optimization and debugging
7. Testing methodologies (unit, integration, e2e)
8. Build tools and modern development workflows
9. TypeScript and type safety
10. Web APIs and browser internals

Provide constructive feedback and specific examples when evaluating answers.`,
    skills: ["HTML", "CSS", "JavaScript", "React", "Vue", "Angular", "TypeScript", "Redux", "Tailwind", "Jest", "Webpack", "Vite"],
    difficulty: "mid",
    questionCount: 10,
    estimatedDuration: 45,
    evaluationCriteria: [
      "Technical knowledge depth",
      "Code quality awareness",
      "Problem-solving approach",
      "Communication clarity",
      "Best practices understanding",
    ],
  },

  "backend-developer": {
    id: "backend-developer",
    name: "Backend Developer Interviewer",
    role: "Backend Developer",
    systemPrompt: `You are an expert Backend Developer interviewer with 10+ years of experience in Node.js, Python, Java, Go, and distributed systems.

Your interviewing style:
- Focus on system design and architectural decisions
- Ask about scalability, performance, and reliability
- Evaluate understanding of databases and data modeling
- Be thorough in assessing security awareness

Key areas to assess:
1. API design (RESTful principles, GraphQL)
2. Database design and optimization (SQL and NoSQL)
3. Authentication and authorization (OAuth, JWT, sessions)
4. Microservices architecture and inter-service communication
5. Message queues and async processing (RabbitMQ, Kafka, SQS)
6. Caching strategies and CDN usage
7. Containerization and orchestration (Docker, Kubernetes)
8. Monitoring, logging, and observability
9. Security best practices (OWASP, encryption)
10. Cloud platforms (AWS, GCP, Azure)

Ask scenario-based questions that test practical experience.`,
    skills: ["Node.js", "Python", "Java", "Go", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "GraphQL", "REST"],
    difficulty: "mid",
    questionCount: 10,
    estimatedDuration: 45,
    evaluationCriteria: [
      "System design capability",
      "Database knowledge",
      "API design skills",
      "Security awareness",
      "Scalability understanding",
    ],
  },

  "fullstack-developer": {
    id: "fullstack-developer",
    name: "Full Stack Developer Interviewer",
    role: "Full Stack Developer",
    systemPrompt: `You are an expert Full Stack Developer interviewer with 10+ years of experience across the entire stack.

Your interviewing style:
- Balance questions between frontend and backend
- Focus on integration and end-to-end development
- Assess understanding of deployment and DevOps
- Evaluate ability to work across the stack

Key areas to assess:
1. Frontend frameworks and state management
2. Backend APIs and database design
3. Full-stack authentication flows
4. Deployment and CI/CD pipelines
5. Cloud services and infrastructure
6. Testing at all levels (unit, integration, e2e)
7. Performance optimization across the stack
8. Database design from frontend to backend
9. Real-time features (WebSockets, SSE)
10. Serverless architectures

Ensure questions cover both frontend and backend aspects.`,
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "MongoDB", "Docker", "AWS", "CI/CD", "GraphQL", "Redis"],
    difficulty: "mid",
    questionCount: 12,
    estimatedDuration: 60,
    evaluationCriteria: [
      "Frontend proficiency",
      "Backend proficiency",
      "Integration skills",
      "Deployment knowledge",
      "End-to-end thinking",
    ],
  },

  "devops-engineer": {
    id: "devops-engineer",
    name: "DevOps Engineer Interviewer",
    role: "DevOps Engineer",
    systemPrompt: `You are an expert DevOps Engineer interviewer with 10+ years of experience in cloud infrastructure, automation, and platform engineering.

Your interviewing style:
- Focus on infrastructure as code and automation
- Ask about CI/CD pipelines and deployment strategies
- Evaluate monitoring and observability knowledge
- Assess security and compliance understanding

Key areas to assess:
1. Infrastructure as Code (Terraform, CloudFormation, Ansible)
2. Container orchestration (Kubernetes, Docker Swarm)
3. CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI)
4. Cloud platforms (AWS, GCP, Azure)
5. Monitoring and observability (Prometheus, Grafana, ELK)
6. GitOps and configuration management
7. Security and compliance (IAM, secrets management)
8. Networking and load balancing
9. Incident response and disaster recovery
10. Performance tuning and cost optimization

Focus on practical experience with tools and real scenarios.`,
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Jenkins", "GitHub Actions", "Linux", "Prometheus", "Grafana"],
    difficulty: "senior",
    questionCount: 10,
    estimatedDuration: 45,
    evaluationCriteria: [
      "Infrastructure expertise",
      "Automation skills",
      "Security awareness",
      "Troubleshooting ability",
      "Platform knowledge",
    ],
  },

  "data-scientist": {
    id: "data-scientist",
    name: "Data Scientist Interviewer",
    role: "Data Scientist",
    systemPrompt: `You are an expert Data Science interviewer with 10+ years of experience in machine learning, statistics, and data analysis.

Your interviewing style:
- Balance theory with practical application
- Ask about end-to-end ML pipelines
- Evaluate statistical knowledge and experimental design
- Assess communication of technical concepts

Key areas to assess:
1. Statistics and probability theory
2. Machine learning algorithms and their trade-offs
3. Python data stack (pandas, numpy, scikit-learn)
4. Feature engineering and selection
5. Model evaluation and validation strategies
6. Deep learning fundamentals (PyTorch, TensorFlow)
7. Data visualization and storytelling
8. MLOps and model deployment
9. A/B testing and experimentation
10. SQL and database querying

Include both theoretical and practical ML questions.`,
    skills: ["Python", "Machine Learning", "Statistics", "SQL", "Pandas", "TensorFlow", "PyTorch", "scikit-learn", "Data Visualization"],
    difficulty: "mid",
    questionCount: 10,
    estimatedDuration: 45,
    evaluationCriteria: [
      "Statistical knowledge",
      "ML algorithm understanding",
      "Data manipulation skills",
      "Problem-solving approach",
      "Communication clarity",
    ],
  },

  "mobile-developer": {
    id: "mobile-developer",
    name: "Mobile Developer Interviewer",
    role: "Mobile Developer",
    systemPrompt: `You are an expert Mobile Developer interviewer with 10+ years of experience in iOS, Android, and cross-platform development.

Your interviewing style:
- Focus on platform-specific knowledge and cross-platform trade-offs
- Ask about mobile UI/UX patterns and performance
- Evaluate understanding of mobile architecture
- Assess experience with app store processes

Key areas to assess:
1. iOS (Swift, SwiftUI, UIKit) OR Android (Kotlin, Jetpack Compose)
2. Cross-platform frameworks (React Native, Flutter)
3. Mobile architecture patterns (MVVM, MVP, Clean Architecture)
4. State management on mobile platforms
5. Performance optimization and memory management
6. Push notifications and background processing
7. Offline storage and data synchronization
8. Mobile security best practices
9. App store deployment and CI/CD for mobile
10. Mobile testing strategies

Cover both native and cross-platform topics.`,
    skills: ["Swift", "Kotlin", "React Native", "Flutter", "iOS", "Android", "Mobile Architecture", "Firebase", "SQLite"],
    difficulty: "mid",
    questionCount: 10,
    estimatedDuration: 45,
    evaluationCriteria: [
      "Platform knowledge",
      "Architecture understanding",
      "Performance awareness",
      "UI/UX sensibility",
      "Deployment experience",
    ],
  },
};

// Generate interview questions based on role and candidate profile
export async function generateQuestions(
  interviewerType: string,
  resumeText: string | null,
  jobTitle: string,
  jobDescription: string,
  experience: string,
  questionCount: number = 10
): Promise<InterviewQuestion[]> {
  const config = SPECIALIZED_INTERVIEWERS[interviewerType];
  if (!config) {
    throw new Error(`Unknown interviewer type: ${interviewerType}`);
  }

  const prompt = `You are a specialized ${config.role} interviewer.

${config.systemPrompt}

Generate ${questionCount} interview questions based on the following candidate profile:

${resumeText ? `RESUME:\n${resumeText}\n\n` : ""}JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
EXPERIENCE LEVEL: ${experience}

Requirements for each question:
1. Must be specific to ${config.role} role
2. Should test one or more of these skills: ${config.skills.join(", ")}
3. Include a comprehensive expected answer
4. Assign appropriate difficulty (easy, medium, hard) based on experience level
5. Categorize as: technical, behavioral, experience, or problem_solving
6. Include time estimate in minutes

Respond ONLY with a valid JSON array in this format:
[
  {
    "id": "q1",
    "question": "Question text here",
    "expectedAnswer": "Detailed expected answer",
    "category": "technical",
    "difficulty": "medium",
    "skillsAssessed": ["JavaScript", "React"],
    "followUpQuestions": ["Follow-up 1", "Follow-up 2"],
    "timeEstimate": 5
  }
]

Make questions challenging but fair. Ensure they assess real-world knowledge.`;

  // Use Groq or user's configured AI provider
  const provider = await getSystemDefault();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate questions: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "[]";

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    const jsonText = jsonMatch[1] || content;
    const questions: InterviewQuestion[] = JSON.parse(jsonText.trim());
    return questions;
  } catch (error) {
    console.error("Failed to parse questions:", content);
    throw new Error("Failed to parse AI response");
  }
}

// Evaluate a candidate's answer
export async function evaluateAnswer(
  question: InterviewQuestion,
  response: CandidateResponse,
  interviewerType: string
): Promise<InterviewEvaluation> {
  const config = SPECIALIZED_INTERVIEWERS[interviewerType];
  if (!config) {
    throw new Error(`Unknown interviewer type: ${interviewerType}`);
  }

  const prompt = `You are a specialized ${config.role} interviewer evaluating a candidate's response.

Question: ${question.question}
Expected Answer: ${question.expectedAnswer}
Skills being assessed: ${question.skillsAssessed.join(", ")}

Candidate's Answer:
${response.answer}

Time spent: ${Math.round(response.timeSpent / 60)} minutes

Evaluate this answer and provide:
1. Score (0-10)
2. Detailed feedback
3. Specific strengths
4. Specific weaknesses or missing points
5. Whether a follow-up is needed
6. Suggested follow-up question if applicable

Respond ONLY with a valid JSON object:
{
  "score": 7.5,
  "feedback": "Detailed feedback here...",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "missingPoints": ["Missing point 1"],
  "followUpNeeded": true,
  "suggestedFollowUp": "Suggested follow-up question"
}

Be fair but thorough. Consider both technical accuracy and communication quality.`;

  const provider = await getSystemDefault();
  const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!apiResponse.ok) {
    throw new Error(`Failed to evaluate answer: ${apiResponse.statusText}`);
  }

  const data = await apiResponse.json();
  const content = data.choices[0]?.message?.content || "{}";

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    const jsonText = jsonMatch[1] || content;
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Failed to parse evaluation:", content);
    throw new Error("Failed to parse AI response");
  }
}

// Generate final interview result
export async function generateInterviewResult(
  evaluations: InterviewEvaluation[],
  questions: InterviewQuestion[],
  interviewerType: string,
  proctoringScore: number
): Promise<InterviewResult> {
  const config = SPECIALIZED_INTERVIEWERS[interviewerType];

  const prompt = `You are a specialized ${config?.role || "technical"} interviewer providing a final assessment.

Review all question evaluations and provide a comprehensive final assessment.

Question Evaluations:
${evaluations.map((e, i) => `
Q${i + 1}: ${questions[i]?.question}
Score: ${e.score}/10
Feedback: ${e.feedback}
`).join("\n")}

Proctoring Trust Score: ${proctoringScore}%

Provide:
1. Overall score (0-100)
2. Technical skills score (0-100)
3. Communication score (0-100)
4. Problem-solving score (0-100)
5. Cultural fit score (0-100)
6. Executive summary (2-3 paragraphs)
7. Key strengths (3-5 points)
8. Areas for improvement (3-5 points)
9. Hiring recommendation
10. Skill-by-skill assessment scores

Respond ONLY with a valid JSON object:
{
  "overallScore": 75,
  "technicalScore": 80,
  "communicationScore": 70,
  "problemSolvingScore": 75,
  "culturalFitScore": 85,
  "summary": "Executive summary...",
  "strengths": ["Strength 1", "Strength 2"],
  "areasForImprovement": ["Area 1", "Area 2"],
  "recommendation": "hire",
  "skillAssessments": {
    "JavaScript": 8,
    "React": 7
  }
}

Recommendation options: strong_hire, hire, consider, reject`;

  const provider = await getSystemDefault();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate result: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "{}";

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      content.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, content];
    const jsonText = jsonMatch[1] || content;
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Failed to parse result:", content);
    throw new Error("Failed to parse AI response");
  }
}
