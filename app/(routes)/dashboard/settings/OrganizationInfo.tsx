"use client";

import { motion } from "motion/react";
import { Building2, Globe, Users, Calendar, Mail } from "lucide-react";

interface OrganizationInfoProps {
  organization: any;
}

const OrganizationInfo = ({ organization }: OrganizationInfoProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          General Information
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Basic details about your organization workspace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Organization Name</label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-foreground font-medium">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {organization.name}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Workspace Slug</label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-foreground font-medium">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {organization.slug}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Industry</label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-foreground font-medium">
            <span className="text-muted-foreground text-xs font-bold">IND</span>
            {organization.industry || "Not Specified"}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Organization Size</label>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-foreground font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            {organization.size || "Not Specified"}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border/50">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <Calendar className="h-3.5 w-3.5" />
            Tier: <span className="text-foreground font-semibold uppercase">{organization.subscriptionTier}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/50">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Status: <span className="text-emerald-500 font-semibold uppercase">{organization.subscriptionStatus}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 mt-4">
        <p className="text-xs text-primary/80 italic">
          Tip: Organization name and slug are currently determined during onboarding. Contact support to change these.
        </p>
      </div>
    </div>
  );
};

export default OrganizationInfo;

// Re-using the same ShieldCheck icon here for status.
import { ShieldCheck } from "lucide-react";
