"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import axios from "axios";
import { useProctoring } from "@/app/hooks/useProctoring";
import { useUserDetails } from "@/app/Provider";
import VisionProctor from "./VisionProctor";
import {
  Plus,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Activity,
  Wifi,
  Clock,
  MessageSquare,
  ChevronRight,
  LogOut,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  AlertTriangle,
  Volume2,
  Bookmark,
  ChevronLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
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
  feedback?: any | null;
  isOrganization?: boolean;
  organizationName?: string;
  hrName?: string;
  maxDuration?: number;
  candidateResumeUrl?: string | null;
  candidateId?: string;
  organizationId?: string;
};

type ChatMessage = {
  sender: string;
  message: string;
};

const AIRobot = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full max-h-[28vh] min-h-[150px]">
      <motion.svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-[200px] xl:max-w-[240px] filter drop-shadow-[0_0_30px_rgba(99,102,241,0.2)]"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Robot Head Outer */}
        <rect x="50" y="40" width="100" height="90" rx="24" className="fill-slate-200 stroke-slate-300 dark:fill-[#0f172a] dark:stroke-[#1e293b]" strokeWidth="2" />
        {/* Glass Visor */}
        <rect x="60" y="55" width="80" height="30" rx="8" className="fill-slate-800 dark:fill-[#1e293b]" />
        <rect x="62" y="57" width="76" height="26" rx="6" className="fill-slate-900 dark:fill-[#020617]" opacity="0.8" />

        {/* Visor Reflection */}
        <rect x="65" y="59" width="30" height="2" rx="1" fill="white" opacity="0.1" />

        {/* Eyes / Scanning Light */}
        {isSpeaking ? (
          <motion.g>
            <motion.rect
              x="72" y="65" width="12" height="10" rx="3"
              fill="#6366f1"
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <motion.rect
              x="116" y="65" width="12" height="10" rx="3"
              fill="#6366f1"
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
            />
            {/* Mouth Audio Waveform */}
            <motion.path
              d="M 80 110 Q 100 120 120 110"
              stroke="#6366f1"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              animate={{
                d: [
                  "M 80 110 Q 100 120 120 110",
                  "M 80 110 Q 100 100 120 110",
                  "M 80 110 Q 100 115 120 110"
                ]
              }}
              transition={{ duration: 0.25, repeat: Infinity }}
            />
          </motion.g>
        ) : (
          <g opacity="0.6">
            <rect x="74" y="68" width="8" height="4" rx="2" className="fill-slate-400 dark:fill-[#334155]" />
            <rect x="118" y="68" width="8" height="4" rx="2" className="fill-slate-400 dark:fill-[#334155]" />
            <path d="M 85 110 Q 100 112 115 110" className="stroke-slate-400 dark:stroke-[#334155]" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* Neck Junction */}
        <rect x="85" y="130" width="30" height="10" className="fill-slate-300 dark:fill-[#1e293b]" />

        {/* Torso Base */}
        <path d="M 60 140 Q 100 135 140 140 L 150 180 Q 100 185 50 180 Z" className="fill-slate-200 stroke-slate-300 dark:fill-[#0f172a] dark:stroke-[#1e293b]" strokeWidth="2" />

        {/* Core Light */}
        <circle cx="100" cy="160" r="10" className="fill-slate-300 dark:fill-[#1e293b]" />
        {isSpeaking && (
          <motion.circle
            cx="100" cy="160" r="10"
            fill="#6366f1"
            animate={{ r: [8, 14, 8], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.svg>

      {/* Speaking Indicator Ring */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 border-2 border-primary/20 rounded-full blur-2xl -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function StartInterview() {
  const { interviewId } = useParams();
  const router = useRouter();
  const convex = useConvex();
  const { userDetails } = useUserDetails() as any;
  const updateFeedback = useMutation(api.interview.updateInterviewFeedback);

  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [orgSettings, setOrgSettings] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasHeardQuestion, setHasHeardQuestion] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("Initializing Secure Session...");
  const [conversation, setConversation] = useState<any[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [violationHighlight, setViolationHighlight] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState<string | null>(null);
  const [personCount, setPersonCount] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const motivationalMessages = [
    "Great answer! Keep going.",
    "You're doing fantastic!",
    "That was a thoughtful response.",
    "Keep up the momentum!",
    "You're making great progress.",
  ];

  const { reportViolation } = useProctoring({
    interviewId: interviewId as any,
    enabled: orgSettings?.requireProctoring ?? true,
    allowTabSwitch: orgSettings?.allowTabSwitch ?? false,
    requireFullscreen: orgSettings?.requireFullscreen ?? true,
    blockCopyPaste: true,
  });

  const handleReportViolation = (type: string, severity: string, details?: string) => {
    reportViolation(type, severity, details);
    if (severity === "HIGH") {
      setViolationHighlight(true);
      setLastViolationMsg(details || "Security alert triggered.");
      setTimeout(() => {
        setViolationHighlight(false);
        setLastViolationMsg(null);
      }, 5000);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem(`interviewState-${interviewId}`);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setInterviewData(parsedState.interviewData);
      setCurrentQuestionIndex(parsedState.currentQuestionIndex);
      setChatHistory(parsedState.chatHistory);
    }
    return () => stopAllMedia();
  }, [interviewId]);

  useEffect(() => {
    if (interviewId) {
      getInterviewQuestions();
      initializeSpeechRecognition();
    }
  }, [interviewId]);

  useEffect(() => {
    if (userDetails?.organizationId) {
      getOrgSettings();
    }
  }, [userDetails]);

  useEffect(() => {
    if (interviewData) {
      const stateToSave = {
        interviewData,
        currentQuestionIndex,
        chatHistory,
      };
      localStorage.setItem(`interviewState-${interviewId}`, JSON.stringify(stateToSave));
    }
  }, [interviewData, currentQuestionIndex, chatHistory, interviewId]);

  // Intelligent Auto-Play for subsequent questions
  useEffect(() => {
    if (interviewData && !showAnimation && !hasHeardQuestion && currentQuestionIndex > 0 && !isSpeaking) {
      const timer = setTimeout(() => {
        handleSpeak();
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, showAnimation]);

  const getOrgSettings = async () => {
    try {
      const org = await convex.query(api.organizations.getById, {
        organizationId: userDetails.organizationId,
      });
      if (org?.settings) setOrgSettings(org.settings);
    } catch (error) {
      console.error("Error fetching org settings:", error);
    }
  };

  const stopAllMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const getInterviewQuestions = async () => {
    try {
      const response = await convex.query(api.interview.getInterviewQuestions, {
        // @ts-ignore
        interviewRecordId: interviewId,
      });
      setInterviewData(response as InterviewData);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setTimeout(() => {
        setCurrentMessage("Session Link Established");
        setTimeout(() => setShowAnimation(false), 1500);
      }, 2000);
    } catch (error) {
      console.error("Error accessing camera or microphone:", error);
      toast.error("Unable to access camera or microphone.");
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
      }
      setIsCameraOn(false);
      toast.success("Security: Camera track destroyed.");
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (streamRef.current) {
          const newVideoTrack = videoStream.getVideoTracks()[0];
          streamRef.current.addTrack(newVideoTrack);
        } else {
          streamRef.current = videoStream;
        }
        if (videoRef.current) videoRef.current.srcObject = streamRef.current;
        setIsCameraOn(true);
        toast.success("Camera feed re-established.");
      } catch (error) {
        toast.error("Unable to access camera.");
      }
    }
  };

  const toggleMic = async () => {
    if (isMicOn) {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.stop());
      }
      setIsMicOn(false);
      toast.info("Microphone hardware disabled.");
    } else {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (streamRef.current) {
          const newAudioTrack = audioStream.getAudioTracks()[0];
          streamRef.current.addTrack(newAudioTrack);
        } else {
          streamRef.current = audioStream;
        }
        setIsMicOn(true);
        toast.info("Microphone hardware active.");
      } catch (error) {
        toast.error("Unable to access microphone.");
      }
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setUserAnswer((prev) => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscription(interimTranscript);
      };

      recognition.onerror = (error: any) => {
        console.error("Speech recognition error:", error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  };

  const handleSpeak = async () => {
    if (!interviewData) return;
    const question = interviewData.interviewQuestions[currentQuestionIndex]?.question;
    if (!question) return;

    window.speechSynthesis.cancel();
    setHasHeardQuestion(false);

    let playedViaApi = false;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: question,
          organizationId: userDetails?.organizationId 
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          setHasHeardQuestion(true);
          URL.revokeObjectURL(url);
        };
        
        await audio.play();
        playedViaApi = true;
      } else {
        console.warn("API TTS failed, falling back to browser TTS:", await response.text());
      }
    } catch (err) {
      console.error("Error calling TTS API, falling back to browser TTS:", err);
    }

    if (!playedViaApi) {
      // Fallback: Browser Native TTS
      const utterance = new SpeechSynthesisUtterance(question);
      
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Premium"));
      if (premiumVoice) utterance.voice = premiumVoice;
      
      utterance.rate = 0.95; 
      utterance.pitch = 0.95;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setHasHeardQuestion(true);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleListen = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast.error("Speech recognition not initialized.");
    }
  };

  const handleSendAnswer = () => {
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (interviewData) {
      const updatedQuestions = [...interviewData.interviewQuestions];
      updatedQuestions[currentQuestionIndex].userAnswer = userAnswer.trim();
      setInterviewData({ ...interviewData, interviewQuestions: updatedQuestions });
    }

    const currentQuestion = interviewData?.interviewQuestions[currentQuestionIndex]?.question;
    setChatHistory((prev) => [
      ...prev,
      { sender: "AI", message: currentQuestion || "" },
      { sender: "User", message: userAnswer.trim() }
    ]);
    setConversation((prev) => [
      ...prev,
      { from: "bot", text: currentQuestion },
      { from: "user", text: userAnswer.trim() }
    ]);

    setUserAnswer("");
    setTranscription("");

    if (interviewData && currentQuestionIndex < interviewData.interviewQuestions.length - 1) {
      setCurrentMessage(motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]);
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setHasHeardQuestion(false);
      }, 2000);
    } else {
      toast.success("Interview completed! Analyzing results...");
      generateFeedback();
    }
  };

  const generateFeedback = async () => {
    if (!interviewData) return;
    try {
      const formattedConversation = JSON.stringify(conversation);
      const response = await axios.post("/api/interview-feedback", {
        messages: formattedConversation,
      });
      const feedback = response.data.feedback;

      await updateFeedback({
        // @ts-ignore
        interviewRecordId: interviewId,
        feedback: {
          feedback: feedback.feedback,
          conversation: formattedConversation,
        },
      });
      toast.success("Final assessment generated.");
      router.replace(`/dashboard`);
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast.error("Feedback generation failed.");
    }
  };

  const handleExitConversation = () => {
    stopAllMedia();
    router.replace("/dashboard");
  };

  const sessionLog: { sender: string; message: string }[] = [];
  if (interviewData && interviewData.interviewQuestions) {
    interviewData.interviewQuestions.forEach((q, index) => {
      if (index <= currentQuestionIndex) {
        if (q.question) sessionLog.push({ sender: "AI", message: q.question });
        if (q.userAnswer) sessionLog.push({ sender: "User", message: q.userAnswer });
      }
    });
  }

  return (
    <div className={`relative h-screen w-full overflow-hidden bg-background font-sans transition-all duration-500 ${violationHighlight ? "ring-[16px] ring-rose-500/30 ring-inset" : ""}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />

      {/* 1. Monitoring Bar */}
      <div className="relative z-30 flex h-12 w-full items-center justify-between border-b border-border/30 bg-muted/20 px-8 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-6">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-2 px-3 py-1 font-black italic tracking-tighter">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE SECURITY
          </Badge>

          <div className="flex items-center gap-6 border-l border-border/50 pl-6 h-4">
            <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${personCount === 1 ? "text-emerald-500" : "text-rose-500 animate-pulse"}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              VISION_SYNC: {personCount === 1 ? "SECURE" : "VIOLATION"}
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/70">
              <Activity className="h-3.5 w-3.5" />
              BIO_DETECTION: ACTIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex h-1.5 w-32 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: "0%" }} animate={{ width: `${((currentQuestionIndex + 1) / (interviewData?.interviewQuestions.length || 1)) * 100}%` }} className="h-full bg-primary" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleExitConversation} className="text-rose-500 hover:bg-rose-500/5 font-bold text-[9px] uppercase tracking-widest px-4">
            Terminate Session
          </Button>
        </div>
      </div>

      {/* 2. Main 3-Grid Workspace */}
      <main className="relative flex h-[calc(100vh-48px)] overflow-hidden">

        {/* LEFT: AI INTERVIEWER */}
        <div className="w-1/3 flex flex-col items-center justify-between p-6 xl:p-8 border-r border-border/30 bg-muted/5 relative">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.2em] text-primary">Protocol Interface</span>
            </div>
            <AIRobot isSpeaking={isSpeaking} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentQuestionIndex}
            className="w-full p-5 xl:p-6 bg-background/80 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl relative overflow-hidden flex-shrink-0 flex flex-col gap-3"
          >
            <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full overflow-hidden">
              <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity }} className="h-full w-1/2 bg-primary" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] xl:text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-50">Transmitting Inquiry</span>
              <Button onClick={handleSpeak} disabled={isSpeaking} variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary">
                <Volume2 className="h-3 w-3 mr-1" /> Re-listen
              </Button>
            </div>
            <p className="text-sm xl:text-base font-semibold tracking-tight text-foreground leading-relaxed italic max-h-[15vh] overflow-y-auto custom-scrollbar pr-2">
              {interviewData?.interviewQuestions[currentQuestionIndex]?.question || "Synchronizing data stream..."}
            </p>
          </motion.div>
        </div>

        {/* MIDDLE: CANDIDATE HUB */}
        <div className="w-1/3 flex flex-col items-center justify-center p-6 xl:p-8 bg-background relative border-r border-border/30">
          <div className="w-full max-w-lg flex flex-col h-full justify-center space-y-4 xl:space-y-6">
            <div className={`relative w-full aspect-[4/3] rounded-[2rem] xl:rounded-[2.5rem] overflow-hidden border-4 xl:border-8 flex-shrink-0 transition-all duration-700 ${violationHighlight ? "border-rose-500 scale-[1.02] shadow-2xl" : "border-muted shadow-xl"}`}>
              <VisionProctor
                videoRef={videoRef}
                reportViolation={handleReportViolation}
                enabled={(orgSettings?.requireProctoring ?? true) && isCameraOn}
                onPersonCountChange={setPersonCount}
              />
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover transition-opacity duration-700 ${isCameraOn ? "opacity-100" : "opacity-10"}`}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 border border-white/5">
                  <VideoOff className="h-16 w-16 text-neutral-800" />
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none p-4 xl:p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="px-2 xl:px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${isCameraOn ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    <span className="text-[7px] xl:text-[8px] font-bold text-white uppercase font-mono tracking-widest">FEED_STABLE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button onClick={toggleMic} variant={isMicOn ? "outline" : "destructive"} size="icon" className="rounded-full shadow-sm h-10 w-10">
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button onClick={toggleCamera} variant={isCameraOn ? "outline" : "destructive"} size="icon" className="rounded-full shadow-sm h-10 w-10">
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} variant="outline" size="icon" className="rounded-full shadow-sm h-10 w-10">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm h-10 w-10">
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button onClick={() => setCurrentQuestionIndex(prev => Math.min((interviewData?.interviewQuestions.length || 1) - 1, prev + 1))} disabled={!interviewData || currentQuestionIndex === interviewData.interviewQuestions.length - 1} variant="outline" size="icon" className="rounded-full shadow-sm h-10 w-10">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Violation Alert Under Camera */}
            <div className="h-12 xl:h-14 flex flex-col justify-center flex-shrink-0">
              <AnimatePresence mode="wait">
                {lastViolationMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-3 xl:p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl xl:rounded-2xl flex items-center gap-3 text-rose-600 shadow-lg shadow-rose-500/5"
                  >
                    <AlertTriangle className="h-4 w-4 xl:h-5 xl:w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[8px] xl:text-[9px] font-black uppercase tracking-widest opacity-60">Security Violation</p>
                      <p className="text-[10px] xl:text-xs font-bold leading-none line-clamp-1">{lastViolationMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3 xl:gap-4 flex-1 justify-end pb-4">
              <AnimatePresence>
                {(transcription || userAnswer) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 xl:p-6 bg-muted/30 border border-border/50 rounded-xl xl:rounded-[2rem] text-xs xl:text-sm italic text-muted-foreground leading-relaxed shadow-inner overflow-y-auto max-h-[15vh]">
                    "{transcription || userAnswer}"
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 xl:gap-4 flex-shrink-0">
                <Button
                  onClick={handleListen}
                  disabled={isSpeaking || isListening || !hasHeardQuestion}
                  className={`flex-1 h-12 xl:h-14 rounded-full xl:rounded-[2rem] text-sm xl:text-base font-black tracking-tighter transition-all active:scale-95 ${isListening ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" : "btn-gradient shadow-xl"}`}
                >
                  {isListening ? "UPLINKING..." : "RECORD RESPONSE"}
                </Button>
                <Button onClick={handleSendAnswer} disabled={!interviewData || !userAnswer.trim()} variant="outline" className="h-12 w-12 xl:h-14 xl:w-14 rounded-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 transition-all hover:scale-105 shrink-0">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: SESSION LOG */}
        <aside className="w-1/3 flex flex-col bg-muted/5 relative">
          <div className="p-4 xl:p-6 border-b border-border/20 bg-background/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 xl:gap-3">
              <MessageSquare className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-primary" />
              <h3 className="text-[10px] xl:text-xs font-black uppercase tracking-[0.2em] text-foreground">Session Log</h3>
            </div>
            <span className="text-[9px] xl:text-[10px] font-mono text-muted-foreground opacity-50">SYNC_ID: #FF92</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 xl:p-8 flex flex-col gap-4 custom-scrollbar">
            {sessionLog.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 xl:space-y-4 opacity-10">
                <Activity className="h-10 w-10 xl:h-12 xl:w-12" />
                <p className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.3em]">Awaiting Data Input</p>
              </div>
            )}
            {sessionLog.map((chat, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                key={index}
                className={`flex flex-col w-full max-w-[85%] ${chat.sender === "AI" ? "self-start items-start" : "self-end items-end"}`}
              >
                <div className={`text-[7px] xl:text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 opacity-50 ${chat.sender === "AI" ? "ml-2" : "mr-2"}`}>
                  {chat.sender === "AI" ? "AGENT_PROTOCOL" : "CANDIDATE_RESPONSE"}
                </div>
                <div className={`p-4 xl:p-5 text-xs xl:text-sm leading-relaxed shadow-sm ${chat.sender === "AI"
                    ? "bg-background border border-border/50 rounded-2xl rounded-tl-sm text-foreground"
                    : "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                  }`}>
                  {chat.message}
                </div>
              </motion.div>
            ))}
          </div>
        </aside>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-3xl bg-background/60">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass p-12 rounded-[4rem] border-primary/20 text-center shadow-2xl relative overflow-hidden max-w-sm">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl mb-8 animate-bounce">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-black text-foreground mb-4 uppercase italic tracking-tighter">{currentMessage}</h1>
                <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5 }} className="h-full w-full bg-primary origin-left" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
