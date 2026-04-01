"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetails } from "@/app/Provider";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail, Phone, Briefcase, Tag } from "lucide-react";

interface AddCandidateDialogProps {
  children?: React.ReactNode;
}

export default function AddCandidateDialog({ children }: AddCandidateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userDetails } = useUserDetails() as any;
  const createCandidate = useMutation(api.candidates.create);
  const interviewerTypes = useQuery(
    api.interviewerTypes.list, 
    userDetails?.organizationId ? { organizationId: userDetails.organizationId } : "skip"
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interviewerTypeId: "",
    notes: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails) return;

    setLoading(true);
    try {
      await createCandidate({
        actorUserId: userDetails._id,
        organizationId: userDetails.organizationId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        interviewerTypeId: formData.interviewerTypeId ? (formData.interviewerTypeId as any) : undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      });

      toast.success("Candidate added successfully!");
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        interviewerTypeId: "",
        notes: "",
        tags: "",
      });
    } catch (error) {
      console.error("Error creating candidate:", error);
      toast.error("Failed to add candidate. Email might already exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="btn-gradient rounded-xl px-5 shadow-lg shadow-primary/20">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-border bg-card p-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="relative border-b border-border px-6 py-5 bg-gradient-to-r from-primary/5 to-accent/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              Add New Candidate
            </DialogTitle>
            <DialogDescription>
              Enter candidate details to add them to your recruitment pipeline.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  name="name"
                  placeholder="John Doe"
                  required
                  className="rounded-xl pl-9"
                  value={formData.name}
                  onChange={handleChange}
                />
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  className="rounded-xl pl-9"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Input
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  className="rounded-xl pl-9"
                  value={formData.phone}
                  onChange={handleChange}
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold flex items-center gap-1.5">
                Applying For
              </label>
              <div className="relative">
                <select
                  name="interviewerTypeId"
                  className="w-full h-10 rounded-xl border border-input bg-background px-9 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none"
                  value={formData.interviewerTypeId}
                  onChange={handleChange}
                >
                  <option value="">Select Role...</option>
                  {interviewerTypes?.map(type => (
                    <option key={type._id} value={type._id}>{type.name}</option>
                  ))}
                </select>
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              Tags (comma separated)
            </label>
            <div className="relative">
              <Input
                name="tags"
                placeholder="React, senior, remote"
                className="rounded-xl pl-9"
                value={formData.tags}
                onChange={handleChange}
              />
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">Notes</label>
            <textarea
              name="notes"
              placeholder="Candidate background, referral details, etc."
              className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient rounded-xl py-6 text-sm font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Candidate...
                </>
              ) : (
                "Add to Pipeline"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
