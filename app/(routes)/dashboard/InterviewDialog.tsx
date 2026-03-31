"use client";
import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumeUpload from "./ResumeUpload";
import JobDescription from "./JobDescription";
import axios from "axios";
import { Loader2, Plus, FileText, Briefcase } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";

const InterviewDialog = () => {
  const [formData, setFormData] = useState<any>();
  const [files, setFiles] = useState<File | null>();
  const [loading, setLoading] = useState(false);
  const { userDetails } = useContext(UserDetailsContext);
  const saveInterviewQuestions = useMutation(api.interview.saveInterviewQuestions);
  const router = useRouter();

  const onSubmit = async () => {
    setLoading(true);
    const formData_ = new FormData();
    formData_.append("resume", files || "");
    formData_.append("jobTitle", formData?.jobTitle || "");
    formData_.append("jobExperience", formData?.jobExperience || "");
    formData_.append("jobDescription", formData?.jobDescription || "");

    try {
      const result = await axios.post("/api/generate-interview-questions", formData_, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (result.status === 429) {
        toast.warning("You have exceeded your request limit. Please try again later.");
        return;
      }

      const interviewId = await saveInterviewQuestions({
        interviewQuestions: result?.data?.questions,
        resumeUrl: result.data.resumeUrl || "",
        userId: userDetails._id,
        jobTitle: formData?.jobTitle || "",
        jobExperience: formData?.jobExperience || "",
        jobDescription: formData?.jobDescription || "",
      });

      router.push(`/interview/${interviewId}`);
      toast.success("Interview created successfully!");
    } catch (error) {
      toast.error("Failed to create interview. Please try again.");
      console.error("Error submitting form:", error);
    } finally {
      setFormData({});
      setFiles(null);
      setLoading(false);
    }
  };

  const onHandleInputChange = (field: string, value: string) => {
    setFormData((prevData: any) => ({ ...prevData, [field]: value }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Interview
        </motion.button>
      </DialogTrigger>

      <DialogContent className="max-w-lg border-border bg-card p-0 shadow-2xl shadow-primary/10 overflow-hidden rounded-2xl">
        {/* Modal header with gradient accent */}
        <div className="relative border-b border-border px-6 py-5 bg-gradient-to-r from-primary/5 to-accent/10">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 to-transparent" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              Create New Interview
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Upload your resume or enter job details to generate tailored questions.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4">
          <Tabs defaultValue="resume" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60">
              <TabsTrigger value="resume" className="rounded-lg flex items-center gap-1.5 text-sm">
                <FileText className="h-3.5 w-3.5" />
                Upload Resume
              </TabsTrigger>
              <TabsTrigger value="jd" className="rounded-lg flex items-center gap-1.5 text-sm">
                <Briefcase className="h-3.5 w-3.5" />
                Job Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="resume" className="mt-4">
              <ResumeUpload setFiles={(file: File) => setFiles(file)} />
            </TabsContent>
            <TabsContent value="jd" className="mt-4">
              <JobDescription onHandleInputChange={onHandleInputChange} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <DialogFooter className="flex gap-3 border-t border-border px-6 py-4">
          <DialogClose asChild>
            <button className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              Cancel
            </button>
          </DialogClose>
          <motion.button
            onClick={onSubmit}
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Interview"
            )}
          </motion.button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDialog;
