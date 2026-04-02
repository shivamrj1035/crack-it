import Groq from "groq-sdk";

// Use llama-3.1-8b-instant for fast, cost-effective responses
// Free tier: 100k tokens/day, 20 requests/min
const MODEL = "llama-3.1-8b-instant";

interface AIConfig {
  apiKey?: string;
  model?: string;
  provider?: string;
}

function getGroqClient(config?: AIConfig) {
  const apiKey = config?.apiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("AI provider API key is not set. Please configure BYOK in settings.");
  }

  return new Groq({ apiKey });
}

export async function getSystemDefault() {
  return {
    provider: "groq",
    apiKey: process.env.GROQ_API_KEY || "",
    model: MODEL,
  };
}

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
  jobExperience: string = "",
  config?: AIConfig,
  customSystemPrompt?: string
): Promise<InterviewQuestion[]> {
  const prompt = buildQuestionPrompt(resumeText, jobTitle, jobDescription, jobExperience);
  const groq = getGroqClient(config);
  const model = config?.model || MODEL;

  const messages: any[] = [
    { role: "system", content: customSystemPrompt || "You are an expert technical interviewer." },
    { role: "user", content: prompt }
  ];

  const completion = await groq.chat.completions.create({
    messages: messages,
    model: model,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const responseText = completion.choices[0]?.message?.content || "";

  // Parse JSON from response
  try {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                      responseText.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, responseText];
    const jsonText = jsonMatch[1] || responseText;
    const parsed = JSON.parse(jsonText.trim());

    return (parsed.questions || []).map((item: any) => ({
      question: item.question || "",
      answer: item.answer || "",
    }));
  } catch (err) {
    console.error("Failed to parse Groq response:", responseText);
    throw new Error("Failed to parse AI response");
  }
}

/**
 * Generate feedback from interview conversation
 */
export async function generateInterviewFeedback(
  messages: Array<{ role: string; content: string }>,
  config?: AIConfig
): Promise<InterviewFeedback> {
  const prompt = buildFeedbackPrompt(messages);
  const groq = getGroqClient(config);
  const model = config?.model || MODEL;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: model,
    temperature: 0.5,
    max_tokens: 2048,
  });

  const responseText = completion.choices[0]?.message?.content || "";

  // Parse JSON from response
  try {
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                      responseText.match(/```\n?([\s\S]*?)\n?```/) ||
                      [null, responseText];
    const jsonText = jsonMatch[1] || responseText;
    const parsed = JSON.parse(jsonText.trim());

    return {
      feedback: parsed.feedback || "",
      suggestions: parsed.suggestions || "",
      rating: parsed.rating || 0,
    };
  } catch (err) {
    console.error("Failed to parse Groq feedback response:", responseText);
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
  let prompt = `You are an expert technical interviewer with 15+ years of experience in software engineering and technical hiring. You will be conducting a live voice interview.

Generate 10 relevant interview questions based on the provided information. Each question should:
1. Be specific and challenging but fair.
2. Include a strong model answer that demonstrates best practices.
3. Be written in a highly conversational, spoken tone. 
4. PERFECTLY mimic human speech by using natural fillers (e.g., "Hmm", "Ah, I see", "Well then", "Okay, moving on to", "That's interesting, so"). Do not make every question start with a filler, but use them naturally to build rapport.
5. Keep the spoken question extremely concise and direct as it will be read aloud by an AI voice.

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
      "question": "Alright, let's start with the basics. Can you explain the difference between let, const, and var in JavaScript?",
      "answer": "let and const were introduced in ES6. let allows reassignment but not redeclaration, const prevents both reassignment and redeclaration, while var is function-scoped and allows both."
    },
    {
      "question": "Hmm, I see. What about closures? How would you describe how closures work in JavaScript?",
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
