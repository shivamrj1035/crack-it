"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { ShieldCheck, ShieldAlert, Monitor, MousePointer2, Copy, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useUserDetails } from "@/app/Provider";

interface ProctoringSettingsProps {
  organization: any;
}

const ProctoringSettings = ({ organization }: ProctoringSettingsProps) => {
  const { userDetails } = useUserDetails() as any;
  const updateSettings = useMutation(api.organizations.updateSettings);
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState(organization.settings || {
    requireProctoring: true,
    allowTabSwitch: false,
    maxTabSwitches: 3,
    captureScreenshots: true,
    screenshotInterval: 60,
    requireFullscreen: true,
    autoSubmitOnViolation: false,
  });

  const handleToggle = (key: string) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateSettings({
        actorUserId: userDetails._id,
        organizationId: organization._id,
        settings: settings,
      });
      toast.success("Security settings updated successfully.");
    } catch (error) {
      toast.error("Failed to update security settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Security & Proctoring
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Configure cheating prevention and candidate monitoring features.</p>
        </div>
        <Button onClick={handleUpdate} disabled={loading} className="btn-gradient rounded-xl px-8 shadow-lg transition-transform active:scale-95">
          {loading ? "Saving..." : "Save Policy"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Global Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Enable AI Proctoring</h4>
              <p className="text-xs text-muted-foreground">Monitor candidate behavior using browser sensors and AI vision.</p>
            </div>
          </div>
          <Switch 
            checked={settings.requireProctoring} 
            onCheckedChange={() => handleToggle("requireProctoring")} 
          />
        </div>

        {/* Detailed Settings */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${!settings.requireProctoring ? "opacity-40 pointer-events-none" : ""}`}>
          
          <div className="rounded-2xl border border-border/50 bg-background/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Tab Monitoring</span>
              </div>
              <Switch 
                checked={!settings.allowTabSwitch} 
                onCheckedChange={() => handleToggle("allowTabSwitch")} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Max Tab Switches Allowed</span>
                <span className="font-bold text-primary">{settings.maxTabSwitches}</span>
              </div>
              <Slider 
                value={[settings.maxTabSwitches]} 
                onValueChange={([v]) => setSettings({...settings, maxTabSwitches: v})}
                max={10} 
                step={1} 
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Maximize className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-semibold block">Require Fullscreen</span>
                <p className="text-[10px] text-muted-foreground">Force interview to stay in fullscreen mode.</p>
              </div>
            </div>
            <Switch 
              checked={settings.requireFullscreen} 
              onCheckedChange={() => handleToggle("requireFullscreen")} 
            />
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-semibold block">Block Copy-Paste</span>
                <p className="text-[10px] text-muted-foreground">Disable clipboard actions during session.</p>
              </div>
            </div>
            <Switch checked={true} disabled /> {/* Hardcoded as part of basic proctoring for now */}
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-semibold block">Auto-Submit</span>
                <p className="text-[10px] text-muted-foreground">Submit interview automatically on major violation.</p>
              </div>
            </div>
            <Switch 
              checked={settings.autoSubmitOnViolation} 
              onCheckedChange={() => handleToggle("autoSubmitOnViolation")} 
            />
          </div>

        </div>
      </div>

      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 border-dashed">
        <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
          <MousePointer2 className="h-3 w-3" />
          Planned for Phase 2: AI Vision
        </h5>
        <ul className="text-[11px] text-muted-foreground/80 space-y-1 mt-1">
          <li>• Real-time head pose tracking via MediaPipe</li>
          <li>• Multiple persons detection in camera frame</li>
          <li>• Object detection (phones, books) during session</li>
          <li>• Randomized periodic screenshot capture</li>
        </ul>
      </div>
    </div>
  );
};

export default ProctoringSettings;
