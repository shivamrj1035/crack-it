"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import axios from "axios";
import { useRouter } from "next/navigation"; // Correct import for the app directory

declare global {
  interface Window {
    SpeechRecognition: typeof window.SpeechRecognition;
    webkitSpeechRecognition: typeof window.SpeechRecognition;
  }
}

export type InterviewData = {
  jobTitle: string | null;
  jobExperience: string | null;
  jobDescription: string | null;
  resumeUrl: string | null;
  interviewQuestions: {
    question: string;
    answer: string;
    userAnswer?: string;
  }[];
  _id: string;
  status: string;
  feedback?: any | null; // Mark feedback as optional
};

type ChatMessage = {
  sender: string;
  message: string;
};

type SpeechRecognition = {
  start: () => void;
  stop: () => void;
  lang: string;
  interimResults: boolean;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
};

function StartInterview() {
  const { interviewId } = useParams();
  const convex = useConvex();
  const [interviewData, setInterviewData] = useState<InterviewData | null>(
    null
  );
  const [transcription, setTranscription] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<
    { from: "bot" | "user"; text: string }[]
  >([]); // Store the entire conversation
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
  const [hasHeardQuestion, setHasHeardQuestion] = useState(false); // Track if the user has heard the question
  const [overAllInterviewProgress, setOverAllInterviewProgress] =
    useState<InterviewData | null>(null); // Track overall progress
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isMicOn, setIsMicOn] = useState(true); // State to control microphone
  const [isCameraOn, setIsCameraOn] = useState(true); // State to control camera
  const updateFeedback = useMutation(api.interview.updateInterviewFeedback);
  const toggleMic = () => {
    setIsMicOn((prev) => !prev);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
    }
  };
  const router = useRouter();

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
    }
  };

  const motivationalMessages = [
    "Welldone, moving to next question!",
    "Great job! Keep it up!",
    "You're doing amazing!",
    "Fantastic! Let's tackle the next one!",
    "Impressive! On to the next question!",
  ];
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(motivationalMessages[0]);

  useEffect(() => {
    getInterviewQuestions();
    initializeCamera();
    initializeSpeechRecognition();
  }, [interviewId]);

  useEffect(() => {
    // Load interview state from localStorage on component mount
    const savedState = localStorage.getItem(`interviewState-${interviewId}`);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setInterviewData(parsedState.interviewData);
      setCurrentQuestionIndex(parsedState.currentQuestionIndex);
      setChatHistory(parsedState.chatHistory);
    }
  }, [interviewId]);

  useEffect(() => {
    // Save interview state to localStorage whenever it changes
    if (interviewData) {
      const stateToSave = {
        interviewData,
        currentQuestionIndex,
        chatHistory,
      };
      localStorage.setItem(
        `interviewState-${interviewId}`,
        JSON.stringify(stateToSave)
      );
    }
  }, [interviewData, currentQuestionIndex, chatHistory]);

  const getInterviewQuestions = async () => {
    try {
      const response = await convex.query(api.interview.getInterviewQuestions, {
        // @ts-ignore
        interviewRecordId: interviewId,
      });
      setInterviewData(response);
    } catch (error) {
      console.error("Error fetching interview questions:", error);
      toast.error("Failed to load interview questions.");
    }
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream as MediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera or microphone:", error);
      toast.error("Unable to access camera or microphone.");
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscription(transcript);
        setUserAnswer(transcript); // Display the transcription in the text box
        setIsListening(false);
      };
      recognition.onerror = (error: any) => {
        console.error("Speech recognition error:", error);

        // Provide more specific error messages based on the error type
        const errorMessage =
          error.error === "no-speech"
            ? "No speech detected. Please try again."
            : error.error === "audio-capture"
              ? "Microphone not accessible. Please check your microphone settings."
              : error.error === "not-allowed"
                ? "Permission to use microphone denied. Please allow microphone access."
                : error.error === "network"
                  ? "Speech recognition service unavailable. Try refreshing the page or using Chrome."
                  : "An unknown error occurred during speech recognition.";

        toast.error(errorMessage);
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    } else {
      toast.error("Speech recognition is not supported in this browser.");
    }
  };

  const handleSpeak = () => {
    if (!interviewData) return;
    const question =
      interviewData.interviewQuestions[currentQuestionIndex]?.question;
    if (!question) return;

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "en-US";
    utterance.onstart = () => {
      setIsSpeaking(true);
      setHasHeardQuestion(false); // Reset hearing state
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setHasHeardQuestion(true); // Mark question as heard
    };
    window.speechSynthesis.speak(utterance);

    setChatHistory((prev) => [...prev, { sender: "AI", message: question }]);
    setConversation((prev) => [...prev, { from: "bot", text: question }]);
  };

  const handleListen = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendAnswer = () => {
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer before sending.");
      return;
    }

    // Append userAnswer to the current question
    if (interviewData) {
      const updatedQuestions = [...interviewData.interviewQuestions];
      updatedQuestions[currentQuestionIndex].userAnswer = userAnswer.trim();
      setInterviewData({
        ...interviewData,
        interviewQuestions: updatedQuestions,
      });
    }

    setChatHistory((prev) => [
      ...prev,
      { sender: "User", message: userAnswer.trim() },
    ]);
    setConversation((prev) => [
      ...prev,
      { from: "user", text: userAnswer.trim() },
    ]); // Add to conversation
    setUserAnswer(""); // Clear the text box after sending

    // Show animation and transition to the next question
    if (
      interviewData &&
      currentQuestionIndex < interviewData.interviewQuestions.length - 1
    ) {
      setCurrentMessage(
        motivationalMessages[
          Math.floor(Math.random() * motivationalMessages.length)
        ]
      );
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTranscription("");
        setHasHeardQuestion(false); // Reset hearing state for the next question
      }, 2000); // Animation duration
    } else {
      toast.success("Interview completed!");
      setOverAllInterviewProgress(interviewData); // Save overall progress

      // Call generateFeedback after completing the interview
      generateFeedback();
    }
  };

  const handleNextQuestion = () => {
    if (!userAnswer.trim()) {
      toast.error("Please answer the current question before proceeding.");
      return;
    }

    // Append userAnswer to the current question
    if (interviewData) {
      const updatedQuestions = [...interviewData.interviewQuestions];
      updatedQuestions[currentQuestionIndex].userAnswer = userAnswer.trim();
      setInterviewData({
        ...interviewData,
        interviewQuestions: updatedQuestions,
      });
    }

    if (
      interviewData &&
      currentQuestionIndex < interviewData.interviewQuestions.length - 1
    ) {
      // Show animation
      setCurrentMessage(
        motivationalMessages[
          Math.floor(Math.random() * motivationalMessages.length)
        ]
      );
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTranscription("");
        setUserAnswer(""); // Reset the answer field for the next question
        setHasHeardQuestion(false); // Reset hearing state for the next question
      }, 2000); // Animation duration
    } else {
      toast.success("Interview completed!");
      setOverAllInterviewProgress(interviewData); // Save overall progress
    }
  };

  const handleExitConversation = () => {
    toast.info("Exiting the conversation...");
    // navigate to /dashboard page
    window.location.href = "/dashboard"; // Redirect to dashboard
  };

  const handleSubmitInterview = () => {
    toast.success("Interview submitted successfully!");
    // Logic to submit the interview
  };

  // Generate feedback based on the user's performance
  const generateFeedback = async () => {
    toast.error("Generating feedback, please wait...");
    if (!interviewData) {
      toast.error("No interview data available for feedback generation.");
      return;
    }
    try {
      // Convert conversation to the required JSON string format
      const formattedConversation = JSON.stringify(conversation);

      const response = await axios.post("/api/interview-feedback", {
        messages: formattedConversation,
      });
      const feedback = response.data.feedback;

      // Save the feedback to the interview data
      const result = await updateFeedback({
        // @ts-ignore
        interviewRecordId: interviewId,
        feedback: {
          feedback: feedback.feedback,
          conversation: formattedConversation,
        },
      });
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast.error("Failed to generate feedback.");
    }
    toast.success("Feedback generated successfully!");

    router.replace(`/dashboard`);
  };
  return (
    <div className="relative mx-auto flex h-screen max-w-7xl flex-col items-center justify-center border border-neutral-200 bg-neutral-100 p-6 shadow-md rounded-3xl dark:border-neutral-800 dark:bg-neutral-900">
      {/* Full-page animation */}
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
        >
          <h1 className="text-4xl font-bold text-white text-center">
            {currentMessage}
          </h1>
        </motion.div>
      )}
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <h1 className="text-2xl font-bold text-center">AI Mock Interviewer</h1>
        <p className="text-gray-500 text-center">
          Answer the questions displayed on the screen. Speak clearly after the
          AI finishes speaking.
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4 mt-8 w-full h-full">
        {/* AI Chat Section */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center border rounded-lg p-4 bg-neutral-200 dark:bg-neutral-800"
        >
          <div
            className={`w-40 h-40 rounded-full ${
              isSpeaking
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"
                : "bg-blue-500"
            } flex items-center justify-center text-white text-lg`}
          >
            AI Bot
          </div>
          <p className="mt-4 text-center text-gray-500">
            {interviewData?.interviewQuestions[currentQuestionIndex]
              ?.question || "Loading..."}
          </p>
          <Button className="mt-4" onClick={handleSpeak} disabled={isSpeaking}>
            {isSpeaking ? "Speaking..." : "Speak Question"}
          </Button>
          <Button
            className="mt-4"
            onClick={handleListen}
            disabled={isSpeaking || isListening || !hasHeardQuestion}
          >
            {isListening ? "Listening..." : "Speak Answer"}
          </Button>
          <Button
            className="mt-4"
            onClick={handleNextQuestion}
            disabled={
              !interviewData ||
              currentQuestionIndex >=
                interviewData.interviewQuestions.length - 1 ||
              !userAnswer.trim()
            }
          >
            Next Question →
          </Button>
        </motion.div>

        {/* Camera Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center border rounded-lg p-4 bg-neutral-200 dark:bg-neutral-800"
        >
          {/* Progress Indicator */}
          <div className="flex gap-1 mb-4">
            {interviewData?.interviewQuestions.map((_, index) => (
              <div
                key={index}
                className={`w-4 h-4 border-2 rounded ${
                  index < currentQuestionIndex
                    ? "bg-green-500"
                    : index === currentQuestionIndex
                      ? "bg-blue-500"
                      : "bg-white"
                }`}
              ></div>
            ))}
          </div>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="rounded-lg w-full h-auto"
          ></video>
          <p className="mt-4 text-center text-gray-500">
            Your camera feed is displayed here.
          </p>
          {/* Mic and Camera Control Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform transform hover:scale-110 ${
                isMicOn ? "bg-green-500" : "bg-red-500"
              }`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"} // Tooltip
            >
              <img
                src={isMicOn ? "/unmute.png" : "/mute.png"}
                alt={isMicOn ? "Unmute" : "Mute"}
                className="w-6 h-6"
              />
            </button>
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform transform hover:scale-110 ${
                isCameraOn ? "bg-green-500" : "bg-red-500"
              }`}
              title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"} // Tooltip
            >
              <img
                src={isCameraOn ? "/cam-on.png" : "/cam-off.png"}
                alt={isCameraOn ? "Camera On" : "Camera Off"}
                className="w-6 h-6"
              />
            </button>
          </div>
        </motion.div>

        {/* Chat Section */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center border rounded-lg p-4 bg-neutral-200 dark:bg-neutral-800"
        >
          <div className="w-full h-64 overflow-y-auto border rounded-lg p-4 bg-white dark:bg-black">
            {chatHistory.map((chat, index) => (
              <p
                key={index}
                className={`text-sm ${
                  chat.sender === "AI" ? "text-blue-500" : "text-green-500"
                }`}
              >
                <strong>{chat.sender}:</strong> {chat.message}
              </p>
            ))}
          </div>
          <textarea
            className="mt-4 w-full p-2 border rounded-lg"
            placeholder="Your answer..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)} // Allow manual editing
          />
          <Button
            className="mt-4"
            onClick={handleSendAnswer}
            disabled={!userAnswer.trim()}
          >
            Send Answer
          </Button>
          <Button
            className="mt-4 bg-red-500 text-white"
            onClick={handleExitConversation}
          >
            Exit Conversation
          </Button>
          <Button
            className="mt-4 bg-green-500 text-white"
            onClick={handleSubmitInterview}
            disabled={
              !interviewData ||
              currentQuestionIndex < interviewData.interviewQuestions.length - 1
            }
          >
            Submit Interview
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default StartInterview;
