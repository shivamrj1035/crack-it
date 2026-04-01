"use client";

import { useUserDetails } from "@/app/Provider";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Key, 
  ShieldCheck, 
  Bell,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import OrganizationInfo from "./OrganizationInfo";
import AIProviderList from "./AIProviderList";
import ProctoringSettings from "./ProctoringSettings";

const SettingsPage = () => {
  const { userDetails } = useUserDetails() as any;
  const [activeTab, setActiveTab] = useState("organization");

  const organization = useQuery(
    api.organizations.getMyOrganization, 
    userDetails?._id ? { actorUserId: userDetails._id } : "skip"
  );

  const tabs = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "ai-providers", label: "AI Providers (BYOK)", icon: Key },
    { id: "proctoring", label: "Security & Proctoring", icon: ShieldCheck },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <SettingsIcon className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Workspace Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your organization, AI configurations, and security preferences.</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Nav */}
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "" : "group-hover:scale-110 transition-transform"}`} />
                    {tab.label}
                  </div>
                  {activeTab === tab.id && <ChevronRight className="h-4 w-4 opacity-70" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-3xl border border-border/50 p-6 sm:p-8 shadow-xl"
            >
              {activeTab === "organization" && <OrganizationInfo organization={organization} />}
              {activeTab === "ai-providers" && <AIProviderList organizationId={organization._id} />}
              {activeTab === "proctoring" && <ProctoringSettings organization={organization} />}
              {activeTab === "notifications" && (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">Notification preferences and Slack integration are currently in development.</p>
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
