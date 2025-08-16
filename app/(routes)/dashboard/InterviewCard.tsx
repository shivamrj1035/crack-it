"use client";

import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { InterviewData } from "../interview/[interviewId]/start/page"; // Ensure this type includes the optional feedback field
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  interviewInfo: InterviewData;
};

const InterviewCard = ({ interviewInfo }: Props) => {
  const [active, setActive] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref, () => setActive(false));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-[100]">
            <motion.div
              layoutId={`card-${interviewInfo._id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              <motion.div
                layoutId={`title-${interviewInfo._id}`}
                className="p-4"
              >
                <h3 className="font-medium text-neutral-700 dark:text-neutral-200 text-lg">
                  {interviewInfo.jobTitle || "Resume Based Interview"}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  {interviewInfo.jobDescription ||
                    "We have generated interview questions based on your resume."}
                </p>
              </motion.div>
              <motion.div
                layoutId={`content-${interviewInfo._id}`}
                className="p-4"
              >
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  {interviewInfo.resumeUrl
                    ? "Resume URL: " + interviewInfo.resumeUrl
                    : "Experience: " + (interviewInfo.jobExperience || "N/A")}
                </p>
                {interviewInfo.status === "completed" &&
                  interviewInfo.feedback && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-100 dark:bg-neutral-800">
                      <h4 className="font-bold text-neutral-700 dark:text-neutral-200">
                        Feedback:
                      </h4>
                      {typeof interviewInfo.feedback === "object" ? (
                        <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                          {interviewInfo.feedback.feedback && (
                            <p>
                              <strong>Feedback:</strong>{" "}
                              {String(interviewInfo.feedback.feedback)}
                            </p>
                          )}
                          {interviewInfo.feedback.rating && (
                            <p>
                              <strong>Rating:</strong>{" "}
                              {String(interviewInfo.feedback.rating)}
                            </p>
                          )}
                          {interviewInfo.feedback.suggestions && (
                            <p>
                              <strong>Suggestions:</strong>{" "}
                              {String(interviewInfo.feedback.suggestions)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                          {String(interviewInfo.feedback)} djksdajk
                        </p>
                      )}
                    </div>
                  )}

                <button
                  onClick={() => setActive(false)}
                  className="mt-4 px-4 py-2 text-sm rounded-full font-bold bg-green-500 text-white"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.div
        layoutId={`card-${interviewInfo._id}`}
        onClick={() => setActive(true)}
        className="p-4 flex flex-col hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer shadow-md"
      >
        <div className="flex flex-col gap-2">
          <motion.h3
            layoutId={`title-${interviewInfo._id}`}
            className="font-medium text-neutral-800 dark:text-neutral-200 text-lg"
          >
            {interviewInfo.jobTitle || "Resume Based Interview"}
          </motion.h3>
          <motion.p
            layoutId={`description-${interviewInfo._id}`}
            className="text-neutral-600 dark:text-neutral-400 text-sm"
          >
            {interviewInfo.jobDescription ||
              "We have generated interview questions based on your resume."}
          </motion.p>
          {interviewInfo.status && (
            <motion.div
              layoutId={`status-${interviewInfo._id}`}
              className={`px-2 py-1 text-xs text-center rounded-full font-bold ${
                interviewInfo.status === "completed"
                  ? "bg-green-400 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              {interviewInfo.status}
            </motion.div>
          )}
        </div>
        <Link href={`/interview/${interviewInfo._id}/start`}>
          <button className="mt-4 px-4 py-2 text-sm rounded-full w-full font-bold bg-blue-500 text-white">
            Start Interview →
          </button>
        </Link>
      </motion.div>
    </>
  );
};

export default InterviewCard;
