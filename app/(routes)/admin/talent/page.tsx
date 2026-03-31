"use client";

import { useContext, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { UserDetailsContext } from "@/context/UserDetailsContext";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["new", "screening", "interviewing", "hired", "rejected", "withdrawn"];
const BENCH_PRIORITIES = ["high", "medium", "low"];

function formatDate(timestamp?: number) {
  if (!timestamp) return "Not scheduled";
  return new Date(timestamp).toLocaleDateString();
}

export default function TalentPipelinePage() {
  const { userDetails } = useContext(UserDetailsContext);
  const actorUserId = userDetails?.appUserId;
  const organizationId = userDetails?.organizationId;

  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "direct",
    tags: "",
    notes: "",
    interviewerTypeId: "",
  });
  const [candidateDrafts, setCandidateDrafts] = useState<
    Record<string, { notes: string; tags: string }>
  >({});
  const [benchForms, setBenchForms] = useState<Record<string, { reason: string; priority: string; followUpDate: string; skills: string }>>({});
  const [reengagementDrafts, setReengagementDrafts] = useState<Record<string, string>>({});

  const candidateArgs =
    actorUserId && organizationId
      ? { actorUserId, organizationId }
      : "skip";

  const candidates = useQuery(api.candidates.list, candidateArgs as any);
  const benchCandidates = useQuery(api.candidates.getBenchCandidates, candidateArgs as any);
  const pipelineOverview = useQuery(api.candidates.getPipelineOverview, candidateArgs as any);
  const interviewerTypes = useQuery(
    api.interviewerTypes.list,
    actorUserId && organizationId
      ? { actorUserId, organizationId }
      : "skip"
  );

  const createCandidate = useMutation(api.candidates.create);
  const updateCandidate = useMutation(api.candidates.update);
  const moveToBench = useMutation(api.candidates.moveToBench);
  const reactivateFromBench = useMutation(api.candidates.reactivateFromBench);
  const queueReengagement = useMutation(api.candidates.queueReengagement);

  const sortedCandidates = useMemo(
    () => [...(candidates || [])].sort((a, b) => b.lastActivityAt - a.lastActivityAt),
    [candidates]
  );

  const handleCreateCandidate = async () => {
    if (!actorUserId || !organizationId) return;
    if (!candidateForm.name || !candidateForm.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      await createCandidate({
        actorUserId,
        organizationId,
        name: candidateForm.name,
        email: candidateForm.email,
        phone: candidateForm.phone || undefined,
        source: candidateForm.source || undefined,
        notes: candidateForm.notes || undefined,
        tags: candidateForm.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        interviewerTypeId: (candidateForm.interviewerTypeId || undefined) as any,
      });
      setCandidateForm({
        name: "",
        email: "",
        phone: "",
        source: "direct",
        tags: "",
        notes: "",
        interviewerTypeId: "",
      });
      toast.success("Candidate added to pipeline");
    } catch (error) {
      toast.error("Failed to add candidate");
      console.error(error);
    }
  };

  const handleStatusChange = async (candidateId: any, status: string) => {
    if (!actorUserId) return;

    try {
      await updateCandidate({
        actorUserId,
        id: candidateId,
        status,
      });
      toast.success("Candidate status updated");
    } catch (error) {
      toast.error("Failed to update candidate");
      console.error(error);
    }
  };

  const handleCandidateSave = async (candidate: any) => {
    if (!actorUserId) return;
    const draft = candidateDrafts[candidate._id];

    try {
      await updateCandidate({
        actorUserId,
        id: candidate._id,
        notes: draft?.notes ?? candidate.notes,
        tags:
          draft?.tags
            ?.split(",")
            .map((item) => item.trim())
            .filter(Boolean) ?? candidate.tags,
      });
      toast.success("Candidate notes saved");
    } catch (error) {
      toast.error("Failed to save candidate");
      console.error(error);
    }
  };

  const handleMoveToBench = async (candidate: any) => {
    if (!actorUserId) return;

    const draft = benchForms[candidate._id] || {
      reason: "timing",
      priority: "medium",
      followUpDate: "",
      skills: candidate.tags?.join(", ") || "",
    };

    try {
      await moveToBench({
        actorUserId,
        id: candidate._id,
        benchReason: draft.reason,
        priority: draft.priority,
        followUpDate: draft.followUpDate
          ? new Date(draft.followUpDate).getTime()
          : undefined,
        skills: draft.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      toast.success("Candidate moved to bench");
    } catch (error) {
      toast.error("Failed to move candidate to bench");
      console.error(error);
    }
  };

  const handleReengage = async (benchId: any, candidateName: string) => {
    if (!actorUserId) return;

    const draft =
      reengagementDrafts[benchId] ||
      `Hi ${candidateName}, we have a new opportunity that matches your background and would like to reconnect.`;

    try {
      await queueReengagement({
        actorUserId,
        benchId,
        subject: `Reconnecting about a new role at your previous target company`,
        bodyPreview: draft,
      });
      toast.success("Re-engagement email queued");
    } catch (error) {
      toast.error("Failed to queue re-engagement");
      console.error(error);
    }
  };

  const handleReactivate = async (benchId: any) => {
    if (!actorUserId) return;

    try {
      await reactivateFromBench({
        actorUserId,
        benchId,
        newStatus: "screening",
        notes: "Reactivated into active screening pipeline.",
      });
      toast.success("Candidate reactivated");
    } catch (error) {
      toast.error("Failed to reactivate candidate");
      console.error(error);
    }
  };

  if (!organizationId || !actorUserId) {
    return <div className="px-6 py-10 text-sm text-muted-foreground">Preparing your organization workspace.</div>;
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 md:px-10 lg:px-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Talent Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Manage active candidates, bench follow-ups, notes, tags, and re-engagement workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {pipelineOverview?.statusCounts?.map((item: any) => (
          <Card key={item.status}>
            <CardHeader className="pb-2">
              <CardDescription className="capitalize">{item.status}</CardDescription>
              <CardTitle className="text-3xl">{item.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Candidate</CardTitle>
          <CardDescription>Feed the pipeline with applicants from direct sourcing, referrals, or ATS imports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Candidate name"
            value={candidateForm.name}
            onChange={(e) => setCandidateForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Input
            placeholder="Email"
            value={candidateForm.email}
            onChange={(e) => setCandidateForm((current) => ({ ...current, email: e.target.value }))}
          />
          <Input
            placeholder="Phone"
            value={candidateForm.phone}
            onChange={(e) => setCandidateForm((current) => ({ ...current, phone: e.target.value }))}
          />
          <select
            className="border-input dark:bg-input/30 h-9 rounded-md border bg-transparent px-3 text-sm"
            value={candidateForm.source}
            onChange={(e) => setCandidateForm((current) => ({ ...current, source: e.target.value }))}
          >
            <option value="direct">Direct</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="lever">Lever</option>
          </select>
          <select
            className="border-input dark:bg-input/30 h-9 rounded-md border bg-transparent px-3 text-sm md:col-span-2"
            value={candidateForm.interviewerTypeId}
            onChange={(e) =>
              setCandidateForm((current) => ({
                ...current,
                interviewerTypeId: e.target.value,
              }))
            }
          >
            <option value="">Assign interviewer type later</option>
            {(interviewerTypes || []).map((item: any) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <Input
            className="md:col-span-2"
            placeholder="Tags separated by commas"
            value={candidateForm.tags}
            onChange={(e) => setCandidateForm((current) => ({ ...current, tags: e.target.value }))}
          />
          <Textarea
            className="md:col-span-2"
            placeholder="Internal notes"
            value={candidateForm.notes}
            onChange={(e) => setCandidateForm((current) => ({ ...current, notes: e.target.value }))}
          />
          <div className="md:col-span-2">
            <Button onClick={handleCreateCandidate}>Add Candidate</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Active Pipeline</TabsTrigger>
          <TabsTrigger value="bench">Bench Pool</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          {sortedCandidates.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No candidates yet. Add your first candidate above.
              </CardContent>
            </Card>
          )}

          {sortedCandidates.map((candidate: any) => (
            <Card key={candidate._id}>
              <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <CardTitle>{candidate.name}</CardTitle>
                  <CardDescription>{candidate.email}</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {candidate.status}
                    </Badge>
                    {(candidate.tags || []).map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 md:w-72">
                  <select
                    className="border-input dark:bg-input/30 h-9 rounded-md border bg-transparent px-3 text-sm capitalize"
                    value={candidate.status}
                    onChange={(e) => void handleStatusChange(candidate._id, e.target.value)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">
                    Last activity: {formatDate(candidate.lastActivityAt)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Textarea
                  value={candidateDrafts[candidate._id]?.notes ?? candidate.notes ?? ""}
                  onChange={(e) =>
                    setCandidateDrafts((current) => ({
                      ...current,
                      [candidate._id]: {
                        notes: e.target.value,
                        tags:
                          current[candidate._id]?.tags ??
                          (candidate.tags || []).join(", "),
                      },
                    }))
                  }
                  placeholder="Notes for the hiring team"
                />
                <Input
                  value={candidateDrafts[candidate._id]?.tags ?? (candidate.tags || []).join(", ")}
                  onChange={(e) =>
                    setCandidateDrafts((current) => ({
                      ...current,
                      [candidate._id]: {
                        notes: current[candidate._id]?.notes ?? candidate.notes ?? "",
                        tags: e.target.value,
                      },
                    }))
                  }
                  placeholder="Update tags"
                />
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                  <Input
                    placeholder="Bench reason"
                    value={benchForms[candidate._id]?.reason || ""}
                    onChange={(e) =>
                      setBenchForms((current) => ({
                        ...current,
                        [candidate._id]: {
                          reason: e.target.value,
                          priority: current[candidate._id]?.priority || "medium",
                          followUpDate: current[candidate._id]?.followUpDate || "",
                          skills: current[candidate._id]?.skills || (candidate.tags || []).join(", "),
                        },
                      }))
                    }
                  />
                  <select
                    className="border-input dark:bg-input/30 h-9 rounded-md border bg-transparent px-3 text-sm"
                    value={benchForms[candidate._id]?.priority || "medium"}
                    onChange={(e) =>
                      setBenchForms((current) => ({
                        ...current,
                        [candidate._id]: {
                          reason: current[candidate._id]?.reason || "timing",
                          priority: e.target.value,
                          followUpDate: current[candidate._id]?.followUpDate || "",
                          skills: current[candidate._id]?.skills || (candidate.tags || []).join(", "),
                        },
                      }))
                    }
                  >
                    {BENCH_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="date"
                    value={benchForms[candidate._id]?.followUpDate || ""}
                    onChange={(e) =>
                      setBenchForms((current) => ({
                        ...current,
                        [candidate._id]: {
                          reason: current[candidate._id]?.reason || "timing",
                          priority: current[candidate._id]?.priority || "medium",
                          followUpDate: e.target.value,
                          skills: current[candidate._id]?.skills || (candidate.tags || []).join(", "),
                        },
                      }))
                    }
                  />
                  <Button variant="outline" onClick={() => void handleCandidateSave(candidate)}>
                    Save Notes
                  </Button>
                  <Button onClick={() => void handleMoveToBench(candidate)}>Move to Bench</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bench" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Bench</CardDescription>
                <CardTitle>{pipelineOverview?.benchSummary?.total || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>High Priority</CardDescription>
                <CardTitle>{pipelineOverview?.benchSummary?.highPriority || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Follow-Ups Due</CardDescription>
                <CardTitle>{pipelineOverview?.benchSummary?.dueFollowUps || 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {(benchCandidates || []).map((entry: any) => (
            <Card key={entry._id}>
              <CardHeader>
                <CardTitle>{entry.candidate?.name}</CardTitle>
                <CardDescription>
                  {entry.candidate?.email} · Follow up {formatDate(entry.followUpDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="capitalize">{entry.priority}</Badge>
                  <Badge variant="outline">{entry.benchReason}</Badge>
                  {entry.skills?.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Textarea
                  placeholder="Re-engagement email preview"
                  value={
                    reengagementDrafts[entry._id] ||
                    `Hi ${entry.candidate?.name}, we have a new opening that fits your background.`
                  }
                  onChange={(e) =>
                    setReengagementDrafts((current) => ({
                      ...current,
                      [entry._id]: e.target.value,
                    }))
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void handleReengage(entry._id, entry.candidate?.name || "there")}>
                    Queue Re-Engagement
                  </Button>
                  <Button variant="outline" onClick={() => void handleReactivate(entry._id)}>
                    Reactivate to Screening
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {benchCandidates?.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No bench candidates yet. Move candidates into the bench when timing is the only blocker.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
