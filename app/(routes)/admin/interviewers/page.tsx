"use client";

import { useContext, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  InterviewerCard,
  CreateInterviewerDialog,
  InterviewSession,
} from "@/components/interviewers";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { UserDetailsContext } from "@/context/UserDetailsContext";

export default function InterviewersPage() {
  const { userDetails } = useContext(UserDetailsContext);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeInterview, setActiveInterview] = useState<{
    interviewerType: string;
    questions: any[];
  } | null>(null);
  const archiveInterviewer = useMutation(api.interviewerTypes.deleteType);

  const interviewers = useQuery(
    api.interviewerTypes.list,
    userDetails?.appUserId && userDetails?.organizationId
      ? {
          actorUserId: userDetails.appUserId,
          organizationId: userDetails.organizationId,
        }
      : "skip"
  );

  const sortedInterviewers = useMemo(
    () =>
      [...(interviewers || [])].sort((a, b) =>
        a.isDefault === b.isDefault ? a.name.localeCompare(b.name) : a.isDefault ? -1 : 1
      ),
    [interviewers]
  );

  const handleStartInterview = async (interviewer: any) => {
    try {
      // Generate questions
      const response = await fetch("/api/interview/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerType: interviewer.slug,
          resumeText: null,
          jobTitle: interviewer.name,
          jobDescription: interviewer.description,
          experience: interviewer.difficulty,
          questionCount: interviewer.defaultQuestionCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      setActiveInterview({
        interviewerType: interviewer.slug,
        questions: data.questions,
      });
    } catch (error) {
      toast.error("Failed to start interview");
      console.error(error);
    }
  };

  const handleInterviewComplete = (results: any) => {
    setActiveInterview(null);
    toast.success("Interview completed successfully!");
  };

  const handleDelete = async (id: any) => {
    if (!userDetails?.appUserId) return;

    try {
      await archiveInterviewer({
        actorUserId: userDetails.appUserId,
        id,
      });
      toast.success("Interviewer archived");
    } catch (error) {
      toast.error("Failed to archive interviewer");
      console.error(error);
    }
  };

  if (activeInterview) {
    return (
      <InterviewSession
        interviewId="interview_123"
        interviewerType={activeInterview.interviewerType}
        questions={activeInterview.questions}
        onComplete={handleInterviewComplete}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Interviewers</h1>
          <p className="text-gray-600">
            Manage specialized AI interviewers for different roles
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Interviewer
        </Button>
      </div>

      {!userDetails?.organizationId ? (
        <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
          Preparing your organization workspace.
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedInterviewers?.map((interviewer) => (
          <InterviewerCard
            key={interviewer._id}
            interviewer={interviewer}
            onStartInterview={() => handleStartInterview(interviewer)}
            onDelete={() => handleDelete(interviewer._id)}
          />
        ))}
      </div>

      {sortedInterviewers?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No interviewers configured yet</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Interviewer
          </Button>
        </div>
      )}
        </>
      )}

      {userDetails?.appUserId && userDetails?.organizationId && (
        <CreateInterviewerDialog
          actorUserId={userDetails.appUserId}
          organizationId={userDetails.organizationId}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}
