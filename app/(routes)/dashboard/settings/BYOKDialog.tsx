"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Plus, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BYOKDialogProps {
  organizationId: any;
}

const AI_PROVIDERS = [
  { id: "groq", name: "Groq", model: "llama-3.1-8b-instant" },
  { id: "openai", name: "OpenAI", model: "gpt-4o-mini" },
  { id: "anthropic", name: "Anthropic", model: "claude-3-5-sonnet-latest" },
  { id: "gemini", name: "Google Gemini", model: "gemini-1.5-flash" },
  { id: "ollama", name: "Ollama (Custom)", model: "llama3", baseUrl: "http://localhost:11434/v1" },
  { id: "kimi", name: "Kimi (Moonshot)", model: "moonshot-v1-8k", baseUrl: "https://api.moonshot.cn/v1" },
];

const BYOKDialog = ({ organizationId }: BYOKDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const addKey = useMutation(api.aiProviders.create);

  const [formData, setFormData] = useState({
    provider: "groq",
    name: "",
    apiKey: "",
    preferredModel: "",
    baseUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.apiKey) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await addKey({
        organizationId,
        provider: formData.provider,
        name: formData.name,
        apiKey: formData.apiKey,
        preferredModel: formData.preferredModel || AI_PROVIDERS.find(p => p.id === formData.provider)?.model,
        baseUrl: formData.baseUrl || AI_PROVIDERS.find(p => p.id === formData.provider)?.baseUrl || "",
      });
      toast.success("AI Provider key added successfully!");
      setOpen(false);
      setFormData({ provider: "groq", name: "", apiKey: "", preferredModel: "", baseUrl: "" });
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.data || error.message || "Failed to add AI Provider key.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gradient flex items-center gap-2 rounded-xl shadow-lg ring-offset-background transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="h-4 w-4" />
          Add AI Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass border-primary/20 p-0 overflow-hidden rounded-3xl max-h-[90vh] flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col h-full overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold font-outfit">Add AI Provider</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-xs">
              Configure your own API keys to power AI interviews for your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 p-6 py-2 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {AI_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, provider: p.id, baseUrl: p.baseUrl || "" })}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs transition-all ${
                      formData.provider === p.id
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                        : "border-border/50 bg-background/50 hover:bg-muted hover:border-border"
                    }`}
                  >
                    <div className={`h-2 w-2 rounded-full ${formData.provider === p.id ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Configuration Name</label>
              <Input
                placeholder="e.g. Production Groq Key"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl bg-background/50 border-border/50 focus:border-primary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">API Key</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder={`Enter your ${formData.provider} API key`}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="rounded-xl bg-background/50 border-border/50 focus:border-primary/50 pr-10"
                  required
                />
                <Key className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Keys are encrypted and only used as fallback when system limits are reached.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Base URL (Optional)</label>
              <Input
                placeholder={AI_PROVIDERS.find(p => p.id === formData.provider)?.baseUrl || "https://api.openai.com/v1"}
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="rounded-xl bg-background/50 border-border/50 focus:border-primary/50 text-xs px-4"
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">Required for local Ollama (e.g., http://localhost:11434/v1)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Preferred Model (Optional)</label>
              <Input
                placeholder={AI_PROVIDERS.find(p => p.id === formData.provider)?.model}
                value={formData.preferredModel}
                onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                className="rounded-xl bg-background/50 border-border/50 focus:border-primary/50 text-xs px-4"
              />
            </div>
          </div>

          <DialogFooter className="p-4 shrink-0 bg-muted/30 border-t border-border/30">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-gradient min-w-[120px]">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              ) : (
                "Save Connection"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BYOKDialog;

import { ShieldCheck } from "lucide-react";
