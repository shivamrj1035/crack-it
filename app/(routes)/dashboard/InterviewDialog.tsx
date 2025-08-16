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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumeUpload from "./ResumeUpload";
import JobDescription from "./JobDescription";
import axios from "axios";
import { Loader2Icon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserDetailsContext } from "@/context/UserDetailsContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const InterviewDialog = () => {
  const [formData, setFormData] = useState<any>();
  const [files, setFiles] = useState<File | null>();
  const [loading, setLoading] = useState(false);
  const { userDetails, setUserDetails } = useContext(UserDetailsContext);
  const saveInterviewQuestions = useMutation(
    api.interview.saveInterviewQuestions
  );
  const router = useRouter();
  const onSubmit = async () => {
    setLoading(true);
    const formData_ = new FormData();

    formData_.append("resume", files || "");
    formData_.append("jobTitle", formData?.jobTitle || "");
    formData_.append("jobExperience", formData?.jobExperience || "");
    formData_.append("jobDescription", formData?.jobDescription || "");

    try {
      const result = await axios.post(
        "/api/generate-interview-questions",
        formData_,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (result.status === 429) {
        toast.warning(
          "You have exceeded your request limit. Please try again later."
        );
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
      console.error("Error submitting form:", error);
    } finally {
      setFormData({}); // Reset formData
      setFiles(null); // Reset files
      setLoading(false);
    }
  };

  const onHandleInputChange = (field: string, value: string) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [field]: value,
    }));
  };
  return (
    <Dialog>
      <DialogTrigger>
        <Button size="lg" className="mt-2">
          + Create Interview
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Please submit following details</DialogTitle>
          <DialogDescription>
            <Tabs defaultValue="resume" className="w-full mt-5">
              <TabsList>
                <TabsTrigger value="resume">Upload Resume</TabsTrigger>
                <TabsTrigger value="jd">Job Description</TabsTrigger>
              </TabsList>
              <TabsContent value="resume">
                <ResumeUpload
                  setFiles={(file: File) => setFiles(file)}
                ></ResumeUpload>
              </TabsContent>
              <TabsContent value="jd">
                <JobDescription
                  onHandleInputChange={onHandleInputChange}
                ></JobDescription>
              </TabsContent>
            </Tabs>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-4">
          <DialogClose>
            <Button variant={"ghost"}>Cancel</Button>
          </DialogClose>
          <Button
            className="cursor-pointer"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading && <Loader2Icon className="animate-spin" />}Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDialog;
