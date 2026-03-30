import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use gemini-1.5-flash-latest for fast responses (free tier: 60 RPM, 1M TPM)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

interface InterviewQuestion {
  question: string;
  answer: string;
}

interface InterviewFeedback {
  feedback: string;
  suggestions: string;
  rating: number;
}

/**
 * Generate interview questions from resume content or job details
 */
export async function generateInterviewQuestions(
  resumeText: string | null,
  jobTitle: string = "",
  jobDescription: string = "",
  jobExperience: string = ""
): Promise<InterviewQuestion[]> {
  const prompt = buildQuestionPrompt(resumeText, jobTitle, jobDescription, jobExperience);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  const responseText = result.response.text();

  // Parse JSON from response
  try {
    const parsed = JSON.parse(responseText);
    return (parsed.questions || []).map((item: any) => ({
      question: item.question || "",
      answer: item.answer || "",
    }));
  } catch (err) {
    console.error("Failed to parse Gemini response:", responseText);
    throw new Error("Failed to parse AI response");
  }
}

/**
 * Generate feedback from interview conversation
 */
export async function generateInterviewFeedback(
  messages: Array<{ role: string; content: string }>
): Promise<InterviewFeedback> {
  const prompt = buildFeedbackPrompt(messages);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2048,
    },
  });

  const responseText = result.response.text();

  // Parse JSON from response
  try {
    const parsed = JSON.parse(responseText);
    return {
      feedback: parsed.feedback || "",
      suggestions: parsed.suggestions || "",
      rating: parsed.rating || 0,
    };
  } catch (err) {
    console.error("Failed to parse Gemini feedback response:", responseText);
    throw new Error("Failed to parse AI feedback");
  }
}

/**
 * Build prompt for question generation
 */
function buildQuestionPrompt(
  resumeText: string | null,
  jobTitle: string,
  jobDescription: string,
  jobExperience: string
): string {
  let prompt = `You are an expert technical interviewer with 15+ years of experience in software engineering and technical hiring.

Generate 10 relevant interview questions based on the provided information. Each question should:
1. Be specific and challenging but fair
2. Include a strong model answer that demonstrates best practices
3. Cover different aspects: technical skills, problem-solving, experience, and soft skills

`;

  if (resumeText) {
    prompt += `RESUME CONTENT:\n${resumeText}\n\n`;
  }

  if (jobTitle) {
    prompt += `JOB TITLE: ${jobTitle}\n`;
  }

  if (jobDescription) {
    prompt += `JOB DESCRIPTION: ${jobDescription}\n`;
  }

  if (jobExperience) {
    prompt += `EXPERIENCE LEVEL: ${jobExperience}\n`;
  }

  prompt += `\nRespond ONLY with a valid JSON object in this exact format (no markdown, no extra text):

{
  "questions": [
    {
      "question": "What is the difference between let, const, and var in JavaScript?",
      "answer": "let and const were introduced in ES6. let allows reassignment but not redeclaration, const prevents both reassignment and redeclaration, while var is function-scoped and allows both."
    },
    {
      "question": "Explain how closures work in JavaScript.",
      "answer": "A closure is a function that has access to variables in its outer (enclosing) lexical scope even after the outer function has returned. They allow for data encapsulation and factory functions."
    }
  ]
}

Generate exactly 10 questions and answers.`;

  return prompt;
}

/**
 * Build prompt for feedback generation
 */
function buildFeedbackPrompt(
  messages: Array<{ role: string; content: string }>
): string {
  // Format the conversation for the AI
  const conversation = messages
    .map((msg) => {
      const role = msg.role === "user" ? "Candidate" : "Interviewer";
      return `${role}: ${msg.content}`;
    })
    .join("\n\n");

  return `You are an expert technical interviewer with 15+ years of experience in software engineering and technical hiring.

Analyze the following mock interview conversation and provide detailed feedback.

INTERVIEW CONVERSATION:
${conversation}

Provide your analysis in the following JSON format only (no markdown, no extra text):

{
  "feedback": "Overall assessment of the candidate's performance including strengths and areas for improvement...",
  "suggestions": "Specific actionable suggestions for how the candidate can improve their interview skills...",
  "rating": 7.5
}

The rating should be a number between 1 and 10, where 1 is very poor and 10 is excellent.

Be constructive, specific, and encouraging in your feedback.`;
}
