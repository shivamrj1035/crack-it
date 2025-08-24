import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import InterviewDialog from "./InterviewDialog";
function EmptyState() {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 shadow-sm hover:shadow-md transition-shadow">
      {/* Illustration */}
      <Image
        src="/heromain.png"
        alt="No Interviews"
        width={230}
        height={230}
        className="opacity-80"
      />

      {/* Text */}
      <h2 className="mt-2 text-center text-lg font-medium text-gray-600">
        You haven’t created any interviews yet
      </h2>
      <p className="text-center text-sm text-gray-500 max-w-sm">
        Get started by creating your first AI-powered mock interview. Practice
        anytime, improve your answers, and land your dream job.
      </p>

      {/* CTA Button */}
      <InterviewDialog></InterviewDialog>
    </div>
  );
}
export default EmptyState;
