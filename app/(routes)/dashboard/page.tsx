"use client";
import { useUser } from "@clerk/nextjs";
import React, { useContext, useEffect, useState } from "react";
import EmptyState from "./EmptyState";
import InterviewDialog from "./InterviewDialog";
import { useConvex } from "convex/react";
import { useUserDetails } from "@/app/Provider";
import { api } from "@/convex/_generated/api";
import { InterviewData } from "../interview/[interviewId]/start/page";
import InterviewCard from "./InterviewCard";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SkeletonCard = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
  >
    <div className="flex items-center justify-between">
      <div className="shimmer h-5 w-20 rounded-full" />
      <div className="shimmer h-4 w-12 rounded-full" />
    </div>
    <div className="shimmer h-6 w-3/4 rounded-lg" />
    <div className="shimmer h-4 w-full rounded-lg" />
    <div className="shimmer h-4 w-2/3 rounded-lg" />
    <div className="shimmer mt-2 h-10 w-full rounded-xl" />
  </motion.div>
);

const DashboardPage = () => {
  const { user } = useUser();
  const [personalInterviews, setPersonalInterviews] = useState<InterviewData[]>([]);
  const [orgInterviews, setOrgInterviews] = useState<InterviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const convex = useConvex();
  const { userDetails } = useUserDetails() as any;

  useEffect(() => {
    if (userDetails?._id) {
      getInterviewList();
    }
  }, [userDetails]);

  const getInterviewList = async () => {
    if (!userDetails?._id) return;
    setIsLoading(true);
    const result = await convex.query(api.interview.getInterviewList, {
      userId: userDetails._id,
    });
    setPersonalInterviews((result as any).personal || []);
    setOrgInterviews((result as any).organization || []);
    setIsLoading(false);
  };

  const totalInterviews = personalInterviews.length + orgInterviews.length;
  const allInterviews = [...personalInterviews, ...orgInterviews];

  return (
    <div className="min-h-screen pb-10">
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
              >
                <Sparkles className="h-3 w-3" />
                AI Interview Platform
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-sm text-muted-foreground"
              >
                Welcome back
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-foreground sm:text-3xl"
              >
                {user?.fullName ?? "Dashboard"}
              </motion.h1>
            </div>

            {/* Stats row */}
            {!isLoading && totalInterviews > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 flex flex-wrap items-center justify-center xl:justify-end gap-3"
              >
                {[
                  { label: "Total Sessions", value: totalInterviews },
                  {
                    label: "Completed",
                    value: allInterviews.filter((i) => i.status === "completed").length,
                  },
                  {
                    label: "Pending",
                    value: allInterviews.filter((i) => i.status !== "completed").length,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="group flex flex-col bg-card/40 border border-border/50 rounded-xl px-5 py-2.5 backdrop-blur-sm shadow-sm transition-all hover:bg-card/70 hover:border-primary/20"
                  >
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80">{stat.label}</p>
                    <p className="mt-0.5 text-lg font-extrabold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <InterviewDialog />
            </motion.div>
          </div>

        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="personal" className="w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Your Interviews</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your company-scheduled and self-practice mock interviews.</p>
              </div>
              <TabsList className="bg-background border border-border">
                <TabsTrigger value="personal" className="data-[state=active]:bg-primary/10">
                  Personal Practice
                  <span className="ml-2 bg-primary/20 font-bold text-primary text-[10px] px-2 py-0.5 rounded-full">{personalInterviews.length}</span>
                </TabsTrigger>
                <TabsTrigger value="organization" className="data-[state=active]:bg-primary/10">
                  By Organizations
                  <span className="ml-2 bg-primary/20 font-bold text-primary text-[10px] px-2 py-0.5 rounded-full">{orgInterviews.length}</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="organization" className="focus-visible:outline-none">
              {orgInterviews.length === 0 ? (
                <EmptyState type="organization" />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {orgInterviews.map((interview, i) => (
                    <InterviewCard key={interview._id} interviewInfo={interview} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="personal" className="focus-visible:outline-none">
              {personalInterviews.length === 0 ? (
                <EmptyState type="personal" />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {personalInterviews.map((interview, i) => (
                    <InterviewCard key={interview._id} interviewInfo={interview} index={i} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>    </div>
  );
};

export default DashboardPage;
