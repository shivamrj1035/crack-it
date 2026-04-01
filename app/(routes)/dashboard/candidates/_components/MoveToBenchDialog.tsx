"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetails } from "@/app/Provider";
import { toast } from "sonner";
import { Loader2, Archive, ListChecks, Calendar, Star } from "lucide-react";

interface MoveToBenchDialogProps {
  candidate: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MoveToBenchDialog({ candidate, open, onOpenChange }: MoveToBenchDialogProps) {
  const [loading, setLoading] = useState(false);
  const { userDetails } = useUserDetails() as any;
  const moveToBench = useMutation(api.candidates.moveToBench);

  const [formData, setFormData] = useState({
    benchReason: "good_fit_future",
    detailedReason: "",
    priority: "medium",
    skills: candidate.tags?.join(", ") || "",
    followUpDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails) return;

    setLoading(true);
    try {
      await moveToBench({
        actorUserId: userDetails._id,
        id: candidate._id as any,
        benchReason: formData.benchReason,
        detailedReason: formData.detailedReason || undefined,
        priority: formData.priority as any,
        skills: formData.skills ? formData.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).getTime() : undefined,
      });

      toast.success("Candidate moved to talent bench!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error moving to bench:", error);
      toast.error("Failed to move candidate to bench.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border bg-card p-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="relative border-b border-border px-6 py-5 bg-gradient-to-r from-indigo-500/5 to-primary/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Archive className="h-4 w-4 text-indigo-500" />
              </div>
              Move {candidate.name} to Bench
            </DialogTitle>
            <DialogDescription>
              Add this candidate to your long-term talent pool for future opportunities.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Bench Reason</label>
              <select
                name="benchReason"
                className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                value={formData.benchReason}
                onChange={handleChange}
              >
                <option value="good_fit_future">Good fit for future</option>
                <option value="no_current_opening">No current opening</option>
                <option value="overqualified">Overqualified</option>
                <option value="salary_expectation">Salary expectation mismatch</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Priority</label>
              <div className="relative">
                <select
                  name="priority"
                  className="w-full h-10 rounded-xl border border-input bg-background px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="high">High Potential</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              Core Skills
            </label>
            <Input
              name="skills"
              placeholder="e.g. React, Node.js, AWS"
              className="rounded-xl"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Follow-up Date
            </label>
            <Input
              name="followUpDate"
              type="date"
              className="rounded-xl"
              value={formData.followUpDate}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">Detailed Evaluation</label>
            <textarea
              name="detailedReason"
              placeholder="Why should we consider them later? Key interview takeaways..."
              className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={formData.detailedReason}
              onChange={handleChange}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 text-sm font-semibold shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Moving to Bench...
                </>
              ) : (
                "Save to Talent Bench"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
