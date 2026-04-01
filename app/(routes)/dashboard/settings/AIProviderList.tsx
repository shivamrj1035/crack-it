"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "motion/react";
import { 
  Key, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  AlertTriangle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BYOKDialog from "./BYOKDialog";
import { toast } from "sonner";

interface AIProviderListProps {
  organizationId: any;
}

const AIProviderList = ({ organizationId }: AIProviderListProps) => {
  const keys = useQuery(
    api.aiProviders.list, 
    organizationId ? { organizationId } : "skip"
  );
  const setDefault = useMutation(api.aiProviders.setDefault);
  const deleteKey = useMutation(api.aiProviders.deleteKey);

  const handleSetDefault = async (keyId: any) => {
    try {
      await setDefault({ organizationId, keyId });
      toast.success("Default provider updated.");
    } catch (error) {
      toast.error("Failed to update default provider.");
    }
  };

  const handleDelete = async (keyId: any) => {
    if (!confirm("Are you sure you want to delete this AI Provider? This will affect any active interviews using this key.")) return;
    try {
      await deleteKey({ organizationId, keyId });
      toast.success("AI Provider removed.");
    } catch (error) {
      toast.error("Failed to remove AI Provider.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            AI Provider Connections
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage Bring Your Own Key (BYOK) settings for the interview engine.</p>
        </div>
        <BYOKDialog organizationId={organizationId} />
      </div>

      {!keys ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-12 text-center bg-muted/10">
          <Key className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No custom AI providers yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
            Add your own API keys to escape platform limits and use specific models like GPT-4 or Claude 3.5.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {keys.map((key) => (
              <motion.div
                key={key._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${
                  key.isDefault 
                    ? "border-primary/30 bg-primary/5 shadow-md shadow-primary/5" 
                    : "border-border/50 bg-background/50 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                    key.isDefault ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                  }`}>
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground">{key.name}</h4>
                      {key.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-tight text-primary">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="capitalize">{key.provider}</span>
                      <span>•</span>
                      <code>{key.keyLastFour}</code>
                      <span>•</span>
                      <span className="font-mono text-[10px]">{key.preferredModel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!key.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSetDefault(key._id)}
                      className="text-primary hover:text-primary hover:bg-primary/10 rounded-lg h-8 px-3"
                    >
                      Make Primary
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(key._id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {key.isDefault && (
                  <div className="absolute top-4 right-4 pointer-events-none group-hover:opacity-0 transition-opacity">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {keys && keys.length > 0 && (
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 mt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-bold text-amber-500">Security Best Practice</h5>
              <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                Ensure your API keys have restricted scopes. For instance, creating a project-specific key for OpenAI with only "Chat" capabilities is recommended over using your master account key.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProviderList;
