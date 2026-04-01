"use client";

import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { InterviewData } from "../interview/[interviewId]/start/page";
import Link from "next/link";
import {
  ArrowRight,
  X,
  ExternalLink,
  CheckCircle,
  Clock,
  Star,
  MessageSquare,
  Lightbulb,
  AlertCircle,
  User,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ResumeUpload from "./ResumeUpload";

type Props = {
  interviewInfo: InterviewData;
  index?: number;
};

const InterviewCard = ({ interviewInfo, index = 0 }: Props) => {
  const [active, setActive] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const updateCandidateResume = useMutation(api.candidates.updateCandidateResume);
  const deleteInterview = useMutation(api.interview.deleteInterview);
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => setActive(false));

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a PDF file first.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await axios.post("/api/upload-resume", formData);
      if (res.data.resumeUrl) {
        await updateCandidateResume({
          candidateId: interviewInfo.candidateId as any,
          resumeUrl: res.data.resumeUrl
        });
        toast.success("Resume uploaded successfully! Preparing your interview...");
        window.location.reload(); 
      }
    } catch (e) {
      toast.error("Failed to upload resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const isCompleted = interviewInfo.status === "completed";
  const rating =
    interviewInfo.feedback && typeof interviewInfo.feedback === "object"
      ? interviewInfo.feedback.rating
      : null;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Expanded detail modal */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              layoutId={`card-${interviewInfo._id}`}
              ref={ref}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between p-6 border-b border-border">
                <motion.div layoutId={`title-${interviewInfo._id}`}>
                  <h3 className="text-lg font-semibold text-foreground">
                    {interviewInfo.jobTitle || "Resume-Based Interview"}
                  </h3>
                  {isCompleted && rating && (
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.round((rating as number) / 2)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {String(rating)}/10
                      </span>
                    </div>
                  )}
                </motion.div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to permanently delete this interview? This action cannot be undone.")) {
                        try {
                          await deleteInterview({ interviewRecordId: interviewInfo._id as any });
                          toast.success("Interview deleted permanently.");
                          window.location.reload();
                        } catch (err) {
                          toast.error("Failed to delete interview.");
                        }
                      }
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-500/20 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all bg-red-500/5"
                    title="Delete Interview"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActive(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="space-y-4 p-6">
                {/* Description */}
                {interviewInfo.jobDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {interviewInfo.jobDescription}
                  </p>
                )}

                {/* Resume URL */}
                {interviewInfo.resumeUrl && (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                    <ExternalLink className="h-4 w-4 shrink-0 text-primary" />
                    <a
                      href={interviewInfo.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}

                {/* Feedback section */}
                {isCompleted && interviewInfo.feedback && (
                  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      AI Evaluation
                    </h4>

                    {typeof interviewInfo.feedback === "object" && (
                      <div className="space-y-2.5">
                        {interviewInfo.feedback.feedback && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                              Feedback
                            </p>
                            <p className="text-sm text-foreground">
                              {String(interviewInfo.feedback.feedback)}
                            </p>
                          </div>
                        )}
                        {interviewInfo.feedback.suggestions && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" /> Suggestions
                            </p>
                            <p className="text-sm text-foreground">
                              {String(interviewInfo.feedback.suggestions)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Resume Upload Box if Missing */}
                {!interviewInfo.candidateResumeUrl && interviewInfo.isOrganization && !isCompleted && (
                  <div className="rounded-xl border border-dashed border-orange-500/50 bg-orange-500/5 p-4">
                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                       <AlertCircle className="h-4 w-4" />
                       Resume Required
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                       This organization requires you to upload your resume before starting the interview.
                    </p>
                    <ResumeUpload setFiles={setFile} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {!interviewInfo.candidateResumeUrl && interviewInfo.isOrganization && !isCompleted ? (
                    <button 
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="btn-gradient w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Uploading..." : "Upload Resume & Continue"}
                    </button>
                  ) : (
                    <Link href={`/interview/${interviewInfo._id}/start`} className="flex-1">
                      <button className="btn-gradient w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold">
                        {isCompleted ? "Retake Interview" : "Start Interview"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => setActive(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        layoutId={`card-${interviewInfo._id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -4, scale: 1.01 }}
        onClick={() => setActive(true)}
        className="group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] hover:shadow-xl hover:shadow-primary/5"
      >
        {/* Status badge */}
        <div className="mb-3 flex items-center justify-between">
          <motion.div
            layoutId={`status-${interviewInfo._id}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isCompleted ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {isCompleted ? "Completed" : "Draft"}
          </motion.div>

          {rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-muted-foreground">
                {String(rating)}/10
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <motion.h3
          layoutId={`title-${interviewInfo._id}`}
          className="mb-1 text-foreground font-bold group-hover:text-primary transition-colors"
        >
          {interviewInfo.jobTitle || "Resume-Based Interview"}
        </motion.h3>

        {/* Organization Details */}
        {interviewInfo.isOrganization && (
          <div className="flex flex-col gap-1.5 mb-3">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/80 uppercase tracking-tight">
                <span className="bg-primary/10 px-1.5 py-0.5 rounded">{interviewInfo.organizationName}</span>
             </div>
             <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <User className="h-3 w-3" />
                  {interviewInfo.hrName || "HR Manager"}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3" />
                  {interviewInfo.maxDuration || 30} Mins
                </span>
             </div>
          </div>
        )}

        {/* Description */}
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {interviewInfo.jobDescription ||
            (interviewInfo.isOrganization 
              ? "Official interview scheduled by your potential employer." 
              : "AI-generated interview questions based on your resume.")}
        </p>

        {/* CTA */}
        <Link
          href={`/interview/${interviewInfo._id}/start`}
          onClick={(e) => e.stopPropagation()}
          className="mt-auto"
        >
          <button className="btn-gradient group/btn w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold">
            {isCompleted ? "Retake" : "Start Interview"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </Link>
      </motion.div>
    </>
  );
};

export default InterviewCard;
