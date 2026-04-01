"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserDetails } from "@/app/Provider";
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Target, 
  Inbox, 
  Activity, 
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const { userDetails } = useUserDetails() as any;
  
  const analytics = useQuery(
    api.analytics.getOverview, 
    userDetails?._id && userDetails?.organizationId 
      ? { actorUserId: userDetails._id, organizationId: userDetails.organizationId } 
      : "skip"
  );

  if (!analytics) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading enterprise insights...</p>
        </div>
      </div>
    );
  }

  const { totals, candidateStatusBreakdown, sourceBreakdown, recentActivity } = analytics;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Enterprise Analytics</h2>
          <p className="text-muted-foreground">Strategic overview of your recruitment performance and security metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-border/50">
            <Filter className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button className="btn-gradient rounded-xl px-5 shadow-lg shadow-primary/20">
            Download Report
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Totals Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Candidates" 
          value={totals.candidates} 
          icon={Users} 
          trend="+14%" 
          color="text-blue-500" 
        />
        <StatCard 
          title="Active Interviews" 
          value={totals.interviewing} 
          icon={Briefcase} 
          trend="+5%" 
          color="text-amber-500" 
        />
        <StatCard 
          title="Average Score" 
          value={`${totals.averageScore}/10`} 
          icon={Target} 
          trend="-2%" 
          color="text-purple-500" 
        />
        <StatCard 
          title="Proctoring Integrity" 
          value={`${totals.averageProctoringScore}%`} 
          icon={ShieldCheck} 
          trend="+0.5%" 
          color="text-emerald-500" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Candidate Pipeline Chart */}
        <div className="glass col-span-4 rounded-2xl p-6 border-border/50">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Inbox className="h-5 w-5 text-primary" />
                Pipeline Breakdown
              </h3>
              <p className="text-xs text-muted-foreground">Distribution of candidates across hiring stages</p>
            </div>
          </div>
          <div className="space-y-5">
            {candidateStatusBreakdown.map((item: any) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <span>{item.label.replace("_", " ")}</span>
                  <span>{Math.round((item.value / (totals.candidates || 1)) * 100)}% ({item.value})</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / (totals.candidates || 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Distribution */}
        <div className="glass col-span-3 rounded-2xl p-6 border-border/50">
           <div className="space-y-1 mb-8">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              Acquisition Sources
            </h3>
            <p className="text-xs text-muted-foreground">Where your best candidates are coming from</p>
          </div>
          <div className="space-y-6">
             {sourceBreakdown.map((item: any) => (
               <div key={item.label} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize">{item.label}</span>
                      <span className="text-sm text-muted-foreground font-medium">{item.value}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
          <div className="mt-8 pt-6 border-t border-border/50">
             <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 text-primary">
                <div className="flex items-center gap-3">
                   <AlertTriangle className="h-5 w-5" />
                   <div>
                      <p className="text-xs font-bold">Follow-ups Due</p>
                      <p className="text-[10px] opacity-80">Benchmarks for {totals.followUpsDue} bench candidates</p>
                   </div>
                </div>
                <ChevronRight className="h-4 w-4" />
             </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="glass rounded-2xl overflow-hidden border-border/50">
        <div className="p-6 border-b border-border/50 bg-muted/20">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Audit Trail & Activity
          </h3>
          <p className="text-xs text-muted-foreground">Verifiable history of all organization actions</p>
        </div>
        <div className="divide-y divide-border/50">
          {recentActivity.map((log: any) => (
            <div key={log._id} className="p-5 flex items-start justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{log.action.replace(/_/g, " ").toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{log.description}</p>
                </div>
              </div>
              <div className="text-[10px] font-medium text-muted-foreground flex flex-col items-end gap-1">
                <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-muted/10 text-center">
           <button className="text-xs font-bold text-primary hover:underline">View Full Audit Log</button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  color: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-6 border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg bg-background/50 border border-border/50 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <span className={`flex items-center text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend.startsWith('+') ? <TrendingUp className="mr-1 h-3 w-3" /> : <AlertTriangle className="mr-1 h-3 w-3" />}
          {trend}
        </span>
      </div>
    </motion.div>
  );
}
