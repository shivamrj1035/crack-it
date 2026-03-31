"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface CreateInterviewerDialogProps {
  actorUserId: Id<"users">;
  organizationId: Id<"organizations">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateInterviewerDialog({
  actorUserId,
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: CreateInterviewerDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [questionCount, setQuestionCount] = useState(10);
  const [estimatedDuration, setEstimatedDuration] = useState(45);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [criterionInput, setCriterionInput] = useState("");
  const [criteria, setCriteria] = useState<string[]>([
    "Technical knowledge depth",
    "Problem-solving approach",
    "Communication clarity",
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const createInterviewer = useMutation(api.interviewerTypes.create);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleAddCriterion = () => {
    if (criterionInput.trim() && !criteria.includes(criterionInput.trim())) {
      setCriteria([...criteria, criterionInput.trim()]);
      setCriterionInput("");
    }
  };

  const handleRemoveCriterion = (criterion: string) => {
    setCriteria(criteria.filter((c) => c !== criterion));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!name || !slug || !systemPrompt || skills.length === 0) {
        toast.error("Please fill in all required fields");
        return;
      }

      await createInterviewer({
        actorUserId,
        organizationId,
        name,
        slug,
        description,
        systemPrompt,
        skills,
        difficulty,
        defaultQuestionCount: questionCount,
        estimatedDuration,
        evaluationCriteria: criteria,
      });

      toast.success("Interviewer created successfully!");
      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create interviewer");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setSystemPrompt("");
    setDifficulty("mid");
    setQuestionCount(10);
    setEstimatedDuration(45);
    setSkills([]);
    setCriteria([
      "Technical knowledge depth",
      "Problem-solving approach",
      "Communication clarity",
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom AI Interviewer</DialogTitle>
          <DialogDescription>
            Configure a specialized AI interviewer for specific roles in your
            organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Senior React Developer"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="senior-react-developer"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role and what this interviewer will assess..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Interview Configuration</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="border-input dark:bg-input/30 flex h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid-Level</option>
                  <option value="senior">Senior</option>
                  <option value="principal">Principal</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionCount">Questions</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={5}
                  max={20}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  max={120}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>
                Skills Assessed <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g., React, Node.js)..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={handleAddSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="systemPrompt">
              System Prompt <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="systemPrompt"
              placeholder="Instructions for the AI interviewer..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Define the AI&apos;s role, personality, and key areas to assess.
            </p>
          </div>

          {/* Evaluation Criteria */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Evaluation Criteria</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {criteria.map((criterion) => (
                  <Badge key={criterion} variant="outline" className="gap-1">
                    {criterion}
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(criterion)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add evaluation criterion..."
                  value={criterionInput}
                  onChange={(e) => setCriterionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCriterion();
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={handleAddCriterion}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Interviewer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
