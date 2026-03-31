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
} from "lucide-react";

type Props = {
  interviewInfo: InterviewData;
  index?: number;
};

const InterviewCard = ({ interviewInfo, index = 0 }: Props) => {
  const [active, setActive] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => setActive(false));

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
                <button
                  onClick={() => setActive(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
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

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Link href={`/interview/${interviewInfo._id}/start`} className="flex-1">
                    <button className="btn-gradient w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold">
                      {isCompleted ? "Retake Interview" : "Start Interview"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
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
          className="mb-1.5 font-semibold text-foreground leading-snug"
        >
          {interviewInfo.jobTitle || "Resume-Based Interview"}
        </motion.h3>

        {/* Description */}
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {interviewInfo.jobDescription ||
            "AI-generated interview questions based on your resume."}
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
