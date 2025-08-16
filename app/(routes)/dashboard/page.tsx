"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import React, { useState } from "react";
import EmptyState from "./EmptyState";
import InterviewDialog from "./InterviewDialog";

const page = () => {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState<any[]>([]);
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12 md:px-10 lg:px-16 xl:px-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left section */}
        <div>
          <h2 className="text-sm sm:text-base text-gray-500">My Dashboard</h2>
          <h1 className="text-xl sm:text-2xl font-bold">
            Welcome, {user?.fullName}
          </h1>
        </div>

        {/* Right section */}
        <InterviewDialog />
      </div>

      {/* Empty state */}
      {interviewList.length === 0 && <EmptyState />}
    </div>
  );
};

export default page;
