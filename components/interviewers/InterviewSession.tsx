"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InterviewSessionProps {
  interviewId: string;
  interviewerType: string;
  questions: Array<{
    id: string;
    question: string;
    expectedAnswer: string;
    category: string;
    difficulty: string;
    timeEstimate: number;
  }>;
  onComplete: (results: any) => void;
}

interface Answer {
  questionId: string;
  text: string;
  submittedAt: number;
  timeSpent: number;
}

interface Evaluation {
  questionId: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  followUpNeeded: boolean;
}

export function InterviewSession({
  interviewId,
  interviewerType,
  questions,
  onComplete,
}: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState<any | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  // Timer for current question
  useEffect(() => {
    setStartTime(Date.now());
    // Restore previous answer if exists
    const savedAnswer = answers[currentQuestion?.id];
    if (savedAnswer) {
      setCurrentAnswer(savedAnswer.text);
    } else {
      setCurrentAnswer("");
    }
  }, [currentIndex, currentQuestion?.id]);

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const evaluateCurrentAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error("Please provide an answer before submitting");
      return;
    }

    setIsEvaluating(true);

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "answer",
          question: currentQuestion,
          response: {
            questionId: currentQuestion.id,
            answer: currentAnswer,
            timeSpent,
          },
          interviewerType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate answer");
      }

      const data = await response.json();
      const evaluation = data.evaluation;

      // Save answer and evaluation
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          text: currentAnswer,
          submittedAt: Date.now(),
          timeSpent,
        },
      }));

      setEvaluations((prev) => ({
        ...prev,
        [currentQuestion.id]: evaluation,
      }));

      toast.success(`Score: ${evaluation.score}/10`);
    } catch (error) {
      toast.error("Failed to evaluate answer");
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = async () => {
    // If current question not evaluated, evaluate first
    if (!evaluations[currentQuestion.id] && currentAnswer.trim()) {
      await evaluateCurrentAnswer();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Complete interview
      await completeInterview();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const completeInterview = async () => {
    setIsSubmitting(true);

    try {
      const allEvaluations = Object.values(evaluations);
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "final",
          evaluations: allEvaluations,
          questions,
          interviewerType,
          proctoringScore: 100, // TODO: Get from proctoring system
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate final results");
      }

      const data = await response.json();
      setFinalResults(data.result);
      setIsCompleted(true);
      onComplete(data.result);
    } catch (error) {
      toast.error("Failed to complete interview");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-100 text-blue-800";
      case "behavioral":
        return "bg-green-100 text-green-800";
      case "experience":
        return "bg-purple-100 text-purple-800";
      case "problem_solving":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (isCompleted && finalResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <CardTitle>Interview Completed</CardTitle>
                <p className="text-gray-600">
                  Thank you for completing the interview
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600 mb-2">Overall Score</p>
              <div className="text-6xl font-bold text-blue-600">
                {finalResults.overallScore}%
              </div>
              <Badge
                className={cn(
                  "mt-2",
                  finalResults.recommendation === "strong_hire"
                    ? "bg-green-100 text-green-800"
                    : finalResults.recommendation === "hire"
                    ? "bg-blue-100 text-blue-800"
                    : finalResults.recommendation === "consider"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {finalResults.recommendation.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Technical Skills</p>
                <div className="text-2xl font-semibold">
                  {finalResults.technicalScore}%
                </div>
                <Progress
                  value={finalResults.technicalScore}
                  className="mt-2"
                />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Communication</p>
                <div className="text-2xl font-semibold">
                  {finalResults.communicationScore}%
                </div>
                <Progress
                  value={finalResults.communicationScore}
                  className="mt-2"
                />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Problem Solving</p>
                <div className="text-2xl font-semibold">
                  {finalResults.problemSolvingScore}%
                </div>
                <Progress
                  value={finalResults.problemSolvingScore}
                  className="mt-2"
                />
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Cultural Fit</p>
                <div className="text-2xl font-semibold">
                  {finalResults.culturalFitScore}%
                </div>
                <Progress
                  value={finalResults.culturalFitScore}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Summary</p>
              <p className="text-gray-600">{finalResults.summary}</p>
            </div>

            {/* Strengths */}
            <div>
              <p className="font-medium mb-2">Strengths</p>
              <ul className="list-disc list-inside space-y-1">
                {finalResults.strengths.map((strength: string, i: number) => (
                  <li key={i} className="text-green-700">{strength}</li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <p className="font-medium mb-2">Areas for Improvement</p>
              <ul className="list-disc list-inside space-y-1">
                {finalResults.areasForImprovement.map((area: string, i: number) => (
                  <li key={i} className="text-orange-700">{area}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getCategoryColor(currentQuestion.category)}>
                  {currentQuestion.category}
                </Badge>
                <span
                  className={cn(
                    "text-sm font-medium",
                    getDifficultyColor(currentQuestion.difficulty)
                  )}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{currentQuestion.timeEstimate} min</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Answer Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Answer</label>
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={8}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{currentAnswer.length} characters</span>
              <span>Minimum 50 characters recommended</span>
            </div>
          </div>

          {/* Evaluation Feedback */}
          {evaluations[currentQuestion.id] && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">AI Evaluation</span>
                </div>
                <div className="text-2xl font-bold">
                  {evaluations[currentQuestion.id].score}/10
                </div>
              </div>

              <p className="text-gray-600">
                {evaluations[currentQuestion.id].feedback}
              </p>

              {evaluations[currentQuestion.id].strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700">Strengths:</p>
                  <ul className="list-disc list-inside text-sm text-green-600">
                    {evaluations[currentQuestion.id].strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluations[currentQuestion.id].weaknesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-700">Areas to improve:</p>
                  <ul className="list-disc list-inside text-sm text-orange-600">
                    {evaluations[currentQuestion.id].weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isEvaluating}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {!evaluations[currentQuestion.id] && (
                <Button
                  onClick={evaluateCurrentAnswer}
                  disabled={
                    isEvaluating ||
                    currentAnswer.length < 20 ||
                    !!evaluations[currentQuestion.id]
                  }
                  variant="secondary"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit & Evaluate
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={isEvaluating || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finishing...
                  </>
                ) : currentIndex === questions.length - 1 ? (
                  "Complete Interview"
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
