"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetails } from "@/app/Provider";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Briefcase, 
  Mail, 
  MapPin,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import AddCandidateDialog from "./_components/AddCandidateDialog";
import MoveToBenchDialog from "./_components/MoveToBenchDialog";
import CandidateProfileDialog from "./_components/CandidateProfileDialog";
import { toast } from "sonner";

const PIPELINE_STAGES = [
  { id: "new", name: "New", icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "screening", name: "Screening", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "interviewing", name: "Interviewing", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "bench", name: "Bench", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "hired", name: "Hired", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "rejected", name: "Rejected", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
];

export default function CandidatesPage() {
  const { userDetails } = useUserDetails() as any;
  const [searchQuery, setSearchQuery] = useState("");
  
  const pipelineData = useQuery(
    api.candidates.getPipelineOverview, 
    userDetails?._id && userDetails?.organizationId 
      ? { actorUserId: userDetails._id, organizationId: userDetails.organizationId } 
      : "skip"
  );

  const allCandidates = useQuery(
    api.candidates.list, 
    userDetails?._id && userDetails?.organizationId 
      ? { actorUserId: userDetails._id, organizationId: userDetails.organizationId } 
      : "skip"
  );

  const filteredCandidates = allCandidates?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Talent Pipeline</h2>
          <p className="text-muted-foreground">Manage your candidates and hiring workflow across all roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <AddCandidateDialog />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border-border/50"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Candidates</p>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">{allCandidates?.length || 0}</h3>
            <span className="flex items-center text-xs font-medium text-emerald-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12%
            </span>
          </div>
        </motion.div>
        {/* Add more stats cards as needed */}
      </div>

      {/* Search & Main Pipeline */}
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
          {PIPELINE_STAGES.map((stage) => {
            const stageCandidates = filteredCandidates?.filter(c => c.status === stage.id) || [];
            
            return (
              <div key={stage.id} className="flex min-w-[320px] flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stage.bg}`}>
                      <stage.icon className={`h-4 w-4 ${stage.color}`} />
                    </div>
                    <span className="font-semibold text-sm">{stage.name}</span>
                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {stageCandidates.length}
                    </span>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-3 min-h-[500px] rounded-2xl border-2 border-dashed border-border/40 p-2 bg-muted/30">
                  <AnimatePresence>
                    {stageCandidates.map((candidate) => (
                      <CandidateCard key={candidate._id} candidate={candidate} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: any }) {
  const { userDetails } = useUserDetails() as any;
  const updateCandidate = useMutation(api.candidates.update);
  const deleteCandidate = useMutation(api.candidates.deleteCandidate);
  const [isUpdating, setIsUpdating] = useState(false);
  const [benchDialogOpen, setBenchDialogOpen] = useState(false);

  const nextStages: Record<string, string> = {
    "new": "screening",
    "screening": "interviewing",
    "interviewing": "bench",
  };

  const moveToNext = async () => {
    const nextStatus = nextStages[candidate.status];
    if (!nextStatus) return;

    if (nextStatus === "bench") {
      setBenchDialogOpen(true);
      return;
    }

    setIsUpdating(true);
    try {
      await updateCandidate({
        actorUserId: userDetails._id,
        id: candidate._id as any,
        status: nextStatus,
      });
      toast.success(`Moved to ${nextStatus}`);
    } catch (err) {
      toast.error("Failed to move candidate");
    } finally {
      setIsUpdating(false);
    }
  };

  const setStatus = async (status: string) => {
    setIsUpdating(true);
    try {
      await updateCandidate({
        actorUserId: userDetails._id,
        id: candidate._id as any,
        status: status,
      });
      toast.success(`Candidate marked as ${status}`);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30 ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-bold">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{candidate.name}</h4>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Mail className="h-3 w-3" />
              {candidate.email}
            </div>
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                if (window.confirm(`Are you sure you want to permanently delete candidate "${candidate.name}"?`)) {
                  setIsUpdating(true);
                  try {
                    await deleteCandidate({ actorUserId: userDetails._id, id: candidate._id });
                    toast.success("Candidate deleted.");
                  } catch (e) {
                    toast.error("Failed to delete candidate.");
                    setIsUpdating(false);
                  }
                }
              }}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Delete Candidate"
            >
              <Trash2 className="h-4 w-4" />
          </motion.button>
          
          {nextStages[candidate.status] && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={moveToNext}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
              title={`Move to ${nextStages[candidate.status]}`}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {candidate.tags?.slice(0, 3).map((tag: string) => (
          <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border mt-2 pt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(candidate.appliedAt).toLocaleDateString()}
        </div>
        
        <div className="flex items-center gap-2">
           {candidate.status !== "hired" && candidate.status !== "rejected" && (
             <div className="flex items-center gap-1">
                <button onClick={() => setStatus("hired")} className="text-emerald-500 hover:text-emerald-600 p-1" title="Hire">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setStatus("rejected")} className="text-red-500 hover:text-red-600 p-1" title="Reject">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
             </div>
           )}
          <CandidateProfileDialog candidateId={candidate._id}>
            <div className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer group/link ml-2">
              <span className="text-[10px] font-semibold">Profile</span>
              <ChevronRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
            </div>
          </CandidateProfileDialog>
        </div>
      </div>
      
      <MoveToBenchDialog 
        candidate={candidate} 
        open={benchDialogOpen} 
        onOpenChange={setBenchDialogOpen} 
      />
    </motion.div>
  );
}
