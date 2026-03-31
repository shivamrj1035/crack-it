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
import { Badge } from "@/components/ui/badge";

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escapeCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers.join(",")]
    .concat(rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AnalyticsPage() {
  const { userDetails } = useContext(UserDetailsContext);
  const actorUserId = userDetails?.appUserId;
  const organizationId = userDetails?.organizationId;

  const [integrationForm, setIntegrationForm] = useState({
    provider: "greenhouse",
    name: "",
    apiKey: "",
    baseUrl: "",
    webhookUrl: "",
    syncDirection: "bidirectional",
    status: "connected",
  });
  const [notificationForm, setNotificationForm] = useState({
    channel: "email",
    recipient: "",
    subject: "",
    bodyPreview: "",
  });

  const analytics = useQuery(
    api.analytics.getOverview,
    actorUserId && organizationId ? { actorUserId, organizationId } : "skip"
  );
  const integrations = useQuery(
    api.integrations.listATS,
    actorUserId && organizationId ? { actorUserId, organizationId } : "skip"
  );
  const notifications = useQuery(
    api.integrations.listNotifications,
    actorUserId && organizationId ? { actorUserId, organizationId } : "skip"
  );

  const upsertATS = useMutation(api.integrations.upsertATS);
  const queueNotification = useMutation(api.integrations.queueNotification);

  const exportRows = useMemo(() => {
    if (!analytics) return [];

    return [
      analytics.totals,
      ...analytics.candidateStatusBreakdown.map((item: any) => ({
        metric: `status:${item.label}`,
        value: item.value,
      })),
      ...analytics.sourceBreakdown.map((item: any) => ({
        metric: `source:${item.label}`,
        value: item.value,
      })),
    ];
  }, [analytics]);

  const handleSaveIntegration = async () => {
    if (!actorUserId || !organizationId) return;
    if (!integrationForm.name) {
      toast.error("Integration name is required");
      return;
    }

    try {
      await upsertATS({
        actorUserId,
        organizationId,
        provider: integrationForm.provider,
        name: integrationForm.name,
        apiKey: integrationForm.apiKey || undefined,
        baseUrl: integrationForm.baseUrl || undefined,
        webhookUrl: integrationForm.webhookUrl || undefined,
        syncDirection: integrationForm.syncDirection,
        status: integrationForm.status,
      });
      setIntegrationForm({
        provider: "greenhouse",
        name: "",
        apiKey: "",
        baseUrl: "",
        webhookUrl: "",
        syncDirection: "bidirectional",
        status: "connected",
      });
      toast.success("ATS integration saved");
    } catch (error) {
      toast.error("Failed to save ATS integration");
      console.error(error);
    }
  };

  const handleQueueNotification = async () => {
    if (!actorUserId || !organizationId) return;
    if (!notificationForm.recipient || !notificationForm.bodyPreview) {
      toast.error("Recipient and message are required");
      return;
    }

    try {
      await queueNotification({
        actorUserId,
        organizationId,
        channel: notificationForm.channel,
        type: "manual_outreach",
        recipient: notificationForm.recipient,
        subject: notificationForm.subject || undefined,
        bodyPreview: notificationForm.bodyPreview,
        status: "queued",
      });
      setNotificationForm({
        channel: "email",
        recipient: "",
        subject: "",
        bodyPreview: "",
      });
      toast.success("Notification queued");
    } catch (error) {
      toast.error("Failed to queue notification");
      console.error(error);
    }
  };

  if (!actorUserId || !organizationId) {
    return <div className="px-6 py-10 text-sm text-muted-foreground">Preparing your organization workspace.</div>;
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 md:px-10 lg:px-16">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Analytics & Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Export reports, track hiring funnel health, and configure ATS or notification workflows.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            Print / PDF
          </Button>
          <Button onClick={() => downloadCsv("talent-analytics.csv", exportRows)}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Candidates</CardDescription>
            <CardTitle>{analytics?.totals?.candidates || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Interviews</CardDescription>
            <CardTitle>{analytics?.totals?.completedInterviews || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle>{analytics?.totals?.averageScore || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Queued Notifications</CardDescription>
            <CardTitle>{analytics?.totals?.queuedNotifications || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Integrations</CardDescription>
            <CardTitle>{analytics?.totals?.activeIntegrations || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Funnel Breakdown</CardTitle>
            <CardDescription>Status, source, and bench workload snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Candidate Status</h3>
                {analytics?.candidateStatusBreakdown?.map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="capitalize">{item.label}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Sources</h3>
                {analytics?.sourceBreakdown?.map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="capitalize">{item.label}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Bench Priority</h3>
                {analytics?.benchByPriority?.map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="capitalize">{item.label}</span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium">Recent Activity</h3>
              <div className="space-y-2">
                {analytics?.recentActivity?.map((item: any) => (
                  <div key={item._id} className="rounded-md border px-3 py-2 text-sm">
                    <div>{item.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export & Readiness</CardTitle>
            <CardDescription>Operational health for handoff, audits, and enterprise reporting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-md border px-3 py-2">
              Hired candidates: <strong>{analytics?.totals?.hired || 0}</strong>
            </div>
            <div className="rounded-md border px-3 py-2">
              Bench follow-ups due: <strong>{analytics?.totals?.followUpsDue || 0}</strong>
            </div>
            <div className="rounded-md border px-3 py-2">
              Average proctoring score: <strong>{analytics?.totals?.averageProctoringScore || 0}</strong>
            </div>
            <div className="rounded-md border px-3 py-2">
              Queue statuses:
              <div className="mt-2 flex flex-wrap gap-2">
                {analytics?.notificationBreakdown?.map((item: any) => (
                  <Badge key={item.label} variant="outline">
                    {item.label}: {item.value}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ATS Integrations</CardTitle>
            <CardDescription>Configure Greenhouse or Lever connections for import/export workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              value={integrationForm.provider}
              onChange={(e) =>
                setIntegrationForm((current) => ({ ...current, provider: e.target.value }))
              }
            >
              <option value="greenhouse">Greenhouse</option>
              <option value="lever">Lever</option>
            </select>
            <Input
              placeholder="Integration name"
              value={integrationForm.name}
              onChange={(e) =>
                setIntegrationForm((current) => ({ ...current, name: e.target.value }))
              }
            />
            <Input
              placeholder="Base URL"
              value={integrationForm.baseUrl}
              onChange={(e) =>
                setIntegrationForm((current) => ({ ...current, baseUrl: e.target.value }))
              }
            />
            <Input
              placeholder="Webhook URL"
              value={integrationForm.webhookUrl}
              onChange={(e) =>
                setIntegrationForm((current) => ({ ...current, webhookUrl: e.target.value }))
              }
            />
            <Input
              placeholder="API Key"
              value={integrationForm.apiKey}
              onChange={(e) =>
                setIntegrationForm((current) => ({ ...current, apiKey: e.target.value }))
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="border-input dark:bg-input/30 h-9 rounded-md border bg-transparent px-3 text-sm"
                value={integrationForm.syncDirection}
                onChange={(e) =>
                  setIntegrationForm((current) => ({
                    ...current,
                    syncDirection: e.target.value,
                  }))
                }
              >
                <option value="import">Import</option>
                <option value="export">Export</option>
                <option value="bidirectional">Bidirectional</option>
              </select>
              <select
                className="border-input dark:bg-input/30 h-9 rounded-md border bg-transparent px-3 text-sm"
                value={integrationForm.status}
                onChange={(e) =>
                  setIntegrationForm((current) => ({ ...current, status: e.target.value }))
                }
              >
                <option value="connected">Connected</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <Button onClick={handleSaveIntegration}>Save Integration</Button>

            <div className="space-y-2 pt-3">
              {(integrations || []).map((integration: any) => (
                <div key={integration._id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{integration.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {integration.provider} · {integration.syncDirection}
                      </div>
                    </div>
                    <Badge variant="outline">{integration.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Queue manual outreach and monitor notification delivery state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              value={notificationForm.channel}
              onChange={(e) =>
                setNotificationForm((current) => ({ ...current, channel: e.target.value }))
              }
            >
              <option value="email">Email</option>
              <option value="slack">Slack</option>
              <option value="webhook">Webhook</option>
            </select>
            <Input
              placeholder="Recipient"
              value={notificationForm.recipient}
              onChange={(e) =>
                setNotificationForm((current) => ({ ...current, recipient: e.target.value }))
              }
            />
            <Input
              placeholder="Subject"
              value={notificationForm.subject}
              onChange={(e) =>
                setNotificationForm((current) => ({ ...current, subject: e.target.value }))
              }
            />
            <Textarea
              placeholder="Message preview"
              value={notificationForm.bodyPreview}
              onChange={(e) =>
                setNotificationForm((current) => ({ ...current, bodyPreview: e.target.value }))
              }
            />
            <Button onClick={handleQueueNotification}>Queue Notification</Button>

            <div className="space-y-2 pt-3">
              {(notifications || [])
                .slice()
                .sort((a: any, b: any) => b.createdAt - a.createdAt)
                .slice(0, 8)
                .map((notification: any) => (
                  <div key={notification._id} className="rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{notification.recipient}</div>
                        <div className="text-xs text-muted-foreground">
                          {notification.subject || notification.type}
                        </div>
                      </div>
                      <Badge variant="outline">{notification.status}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
