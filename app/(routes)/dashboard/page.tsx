"use client";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import React, { useContext, useEffect, useState } from "react";
import EmptyState from "./EmptyState";
import InterviewDialog from "./InterviewDialog";
import { useConvex } from "convex/react";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { api } from "@/convex/_generated/api";
import { InterviewData } from "../interview/[interviewId]/start/page"; // Ensure this type includes the optional feedback field
import InterviewCard from "./InterviewCard";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component

const page = () => {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState<InterviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const convex = useConvex();
  const { userDetails } = useContext(UserDetailsContext);

  useEffect(() => {
    getInterviewList();
  }, [userDetails]);

  const getInterviewList = async () => {
    setIsLoading(true); // Set loading to true before fetching data
    const result = await convex.query(api.interview.getInterviewList, {
      userId: userDetails._id,
    });
    setInterviewList(result);
    setIsLoading(false); // Set loading to false after data is fetched
  };

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
        <div>
          <InterviewDialog />{" "}
          {/* Ensure this does not render a <button> inside another <button> */}
        </div>
      </div>

      {/* Skeleton Loader */}
      {isLoading ? (
        <div className="grid mt-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="p-4 flex flex-col gap-4 rounded-xl shadow-md"
            >
              <Skeleton className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-4 w-full bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-10 w-full rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : interviewList.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid mt-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {interviewList.map((interview) => (
            <InterviewCard key={interview._id} interviewInfo={interview} />
          ))}
        </div>
      )}
    </div>
  );
};

export default page;
