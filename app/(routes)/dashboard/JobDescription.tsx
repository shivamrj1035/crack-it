import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

function JobDescription({ onHandleInputChange }: any) {
  return (
    <div className="flex flex-col gap-4 m-2 border p-4 rounded-lg h-full">
      <div>
        <label>Job title</label>
        <Input
          placeholder="Ex. Fullstack python developer"
          onChange={(event) =>
            onHandleInputChange("jobTitle", event.target.value)
          }
        ></Input>
      </div>
      <div>
        <label>Job Description</label>
        <Textarea
          className="min-h-[150px]"
          placeholder="Enter or paste Job Description"
          onChange={(event) =>
            onHandleInputChange("jobDescription", event.target.value)
          }
        ></Textarea>
      </div>
      <div>
        <label>Years of experience</label>
        <Input
          placeholder="Ex. 1.2"
          onChange={(event) =>
            onHandleInputChange("jobExperience", event.target.value)
          }
        ></Input>
      </div>
    </div>
  );
}

export default JobDescription;
