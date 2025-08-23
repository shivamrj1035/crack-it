"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";

function Interview() {
  const { interviewId } = useParams();
  return (
    <div className="relative mx-auto my-10 flex max-w-4xl flex-col items-center justify-center border border-neutral-200 bg-neutral-100 p-6 shadow-md rounded-3xl dark:border-neutral-800 dark:bg-neutral-900">
      {/* Animated Borders */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <Image
          src="/AIinterview.png"
          alt="Interview Illustration"
          width={1000}
          height={1000}
          className="w-64 h-auto"
        />
        <h1 className="text-2xl font-bold text-center">
          Ready to Start Interview?
        </h1>
        <p className="text-gray-500 text-center">
          The interview will last 30 minutes. Are you ready to begin?
        </p>
        <Link href={`/interview/${interviewId}/start`}>
          <Button size="lg" className="mt-4 cursor-pointer">
            Start Interview →
          </Button>
        </Link>
      </motion.div>

      {/* Email Section */}
      {/* <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center mt-8 gap-4"
      >
        <p className="text-gray-500 text-center">
          Want to send the interview link to someone?
        </p>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            className="w-64"
          />
          <Button variant="outline">Send →</Button>
        </div>
      </motion.div> */}
    </div>
  );
}

export default Interview;
