"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Tag, 
  Calendar, 
  FileText, 
  ExternalLink,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CandidateProfileDialogProps {
  candidateId: string;
  children: React.ReactNode;
}

export default function CandidateProfileDialog({ candidateId, children }: CandidateProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userDetails } = useUserDetails() as any;
  
  const candidate = useQuery(api.candidates.getById, { 
    actorUserId: userDetails?._id, 
    id: candidateId as any 
  });
  
  const interviews = useQuery(api.interview.getByCandidateId, { 
    candidateId: candidateId as any 
  });

  const interviewerTypes = useQuery(
    api.interviewerTypes.list, 
    userDetails?.organizationId ? { organizationId: userDetails.organizationId } : "skip"
  );
  
  const updateCandidate = useMutation(api.candidates.update);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interviewerTypeId: "",
    notes: "",
    tags: "",
    status: "",
  });

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        interviewerTypeId: candidate.interviewerTypeId || "",
        notes: candidate.notes || "",
        tags: candidate.tags?.join(", ") || "",
        status: candidate.status || "",
      });
    }
  }, [candidate]);

  const handleSave = async () => {
    if (!userDetails || !candidate) return;

    setLoading(true);
    try {
      await updateCandidate({
        actorUserId: userDetails._id,
        id: candidateId as any,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        interviewerTypeId: formData.interviewerTypeId ? (formData.interviewerTypeId as any) : undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(t => t !== "") : [],
        status: formData.status,
      });

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!candidate && open) {
     return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </DialogContent>
        </Dialog>
     )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] border-border bg-card p-0 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="relative border-b border-border px-8 py-6 bg-gradient-to-r from-primary/5 to-accent/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary text-2xl font-bold shadow-inner">
                {candidate?.name?.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                    {isEditing ? (
                        <Input 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            className="text-2xl font-bold h-10 px-2 mt-1"
                        />
                    ) : (
                        candidate?.name
                    )}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1.5 capitalize">
                   <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                     {candidate?.status}
                   </Badge>
                   <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Applied {new Date(candidate?.appliedAt || Date.now()).toLocaleDateString()}
                   </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={loading} className="btn-gradient rounded-xl px-4">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl border-primary/20 text-primary hover:bg-primary/10">
                        Edit Profile
                    </Button>
                )}
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-8 py-6 scrollbar-thin">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="details" className="rounded-lg py-2">Candidate Details</TabsTrigger>
              <TabsTrigger value="interviews" className="rounded-lg py-2">
                Interview History
                {interviews && interviews.length > 0 && (
                    <span className="ml-2 bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {interviews.length}
                    </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-8 pb-4">
              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" /> Email Address
                    </label>
                    {isEditing ? (
                        <Input name="email" value={formData.email} onChange={handleChange} className="rounded-xl" />
                    ) : (
                        <p className="text-sm font-medium">{candidate?.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Phone Number
                    </label>
                    {isEditing ? (
                        <Input name="phone" value={formData.phone} onChange={handleChange} className="rounded-xl" placeholder="Not provided" />
                    ) : (
                        <p className="text-sm font-medium">{candidate?.phone || "Not provided"}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-3 w-3" /> Applying For
                    </label>
                    {isEditing ? (
                        <select
                            name="interviewerTypeId"
                            className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                            value={formData.interviewerTypeId}
                            onChange={handleChange}
                        >
                            <option value="">Select Role...</option>
                            {interviewerTypes?.map(type => (
                                <option key={type._id} value={type._id}>{type.name}</option>
                            ))}
                        </select>
                    ) : (
                        <p className="text-sm font-medium">
                            {interviewerTypes?.find(t => t._id === candidate?.interviewerTypeId)?.name || "General Selection"}
                        </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> Pipeline Status
                    </label>
                    {isEditing ? (
                        <select
                            name="status"
                            className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none capitalize"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            {["new", "screening", "interviewing", "bench", "hired", "rejected"].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    ) : (
                        <Badge className="capitalize">{candidate?.status}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Tag className="h-3 w-3" /> Skill Tags
                </label>
                {isEditing ? (
                    <Input name="tags" value={formData.tags} onChange={handleChange} className="rounded-xl" placeholder="React, Node.js, etc." />
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {candidate?.tags?.length ? (
                            candidate.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="rounded-lg bg-muted text-muted-foreground border-border">
                                    {tag}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground italic">No tags added</span>
                        )}
                    </div>
                )}
              </div>

              {/* Resume Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Resume / Documents
                </label>
                {candidate?.resumeUrl ? (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30 group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Candidate Resume.pdf</p>
                                <p className="text-[10px] text-muted-foreground uppercase">PDF Document</p>
                            </div>
                        </div>
                        <a 
                            href={candidate.resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                            View File <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                ) : (
                    <div className="p-8 rounded-xl border-2 border-dashed border-border bg-muted/10 text-center">
                        <p className="text-sm text-muted-foreground italic">No resume has been uploaded yet</p>
                    </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Internal Evaluation Notes
                </label>
                {isEditing ? (
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange as any}
                        className="w-full min-h-[120px] rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Add recruitment notes here..."
                    />
                ) : (
                    <div className="p-4 rounded-xl border border-border bg-muted/20 min-h-[100px]">
                        {candidate?.notes ? (
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{candidate.notes}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No internal notes added for this candidate</p>
                        )}
                    </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="interviews">
               {!interviews || interviews.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 text-center">
                       <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                           <Calendar className="h-8 w-8 text-muted-foreground" />
                       </div>
                       <h3 className="text-lg font-semibold">No Interview History</h3>
                       <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                           This candidate hasn't participated in any organization interviews yet.
                       </p>
                   </div>
               ) : (
                   <div className="space-y-4">
                       {interviews.map((interview) => (
                           <div key={interview._id} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all group">
                               <div className="flex items-start justify-between">
                                   <div className="flex items-center gap-4">
                                       <div className={`h-10 w-10 rounded-full flex items-center justify-center ${interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                           {interview.status === 'completed' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                       </div>
                                       <div>
                                           <h4 className="font-bold text-sm">
                                               {interviewerTypes?.find(t => t._id === interview.interviewerTypeId)?.name || "Mock Interview"}
                                           </h4>
                                           <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                               <Calendar className="h-3 w-3" />
                                               {new Date(interview._creationTime).toLocaleDateString()} at {new Date(interview._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                           </p>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       {interview.status === 'completed' ? (
                                           <div className="flex flex-col items-end gap-1">
                                               <span className="text-lg font-black text-primary">{interview.overallScore || 'N/A'}<span className="text-[10px] text-muted-foreground">/100</span></span>
                                               <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 border-emerald-500/30 text-emerald-500">Result Ready</Badge>
                                           </div>
                                       ) : (
                                           <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter">In Progress</Badge>
                                       )}
                                   </div>
                               </div>
                               
                               {interview.feedback?.summary && (
                                   <p className="mt-4 text-xs text-muted-foreground line-clamp-2 italic leading-relaxed border-l-2 border-primary/20 pl-3">
                                       "{interview.feedback.summary}"
                                   </p>
                               )}
                           </div>
                       ))}
                   </div>
               )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
