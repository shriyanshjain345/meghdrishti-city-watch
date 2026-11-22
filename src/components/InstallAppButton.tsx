import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
    const safariStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone || safariStandalone);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setShowHelp(false);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) {
      setShowHelp((visible) => !visible);
      return;
    }
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      setShowHelp(true);
    } finally {
      setPromptEvent(null);
    }
  };

  if (installed) return null;

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={showHelp}
        onClick={install}
        className="h-8 rounded-full border border-border bg-background/60 px-3 text-xs font-semibold text-primary hover:bg-accent"
      >
        <Download aria-hidden="true" />
        Install App
      </Button>
      {showHelp && !promptEvent && (
        <div role="status" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground shadow-lg">
          Open your browser menu and choose “Install app” or “Add to Home Screen”.
        </div>
      )}
    </div>
  );
}