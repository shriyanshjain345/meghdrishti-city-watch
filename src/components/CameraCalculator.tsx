import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Front-end preview only: no image analysis runs, and the reading shown is a labelled sample.
export default function CameraCalculator() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"aim" | "scan" | "done">("aim");
  const [cam, setCam] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => { stream = s; if (video.current) { video.current.srcObject = s; setCam(true); } })
      .catch(() => setCam(false));
    return () => { stream?.getTracks().forEach((t) => t.stop()); setCam(false); setPhase("aim"); };
  }, [open]);

  const scan = () => { setPhase("scan"); setTimeout(() => setPhase("done"), 2200); };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="glass-hi neon flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground"
      >
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">📷<span className="ping-ring absolute inset-0 rounded-full bg-primary/40" /></span>
        AQI Camera Calculator
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">Preview</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-hi neon w-full max-w-md overflow-hidden rounded-3xl"
            >
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-display font-bold">AQI Camera Calculator</p>
                  <p className="text-[11px] text-muted-foreground">Design preview · sky analysis not active yet</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border border-border bg-background/70 hover:text-primary">✕</button>
              </div>

              <div className="relative mx-4 aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-b from-accent via-secondary to-muted">
                <video ref={video} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover ${cam ? "" : "hidden"}`} />
                {!cam && <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">Point at the open sky · camera preview</div>}
                {/* Corner brackets */}
                {["left-4 top-4 border-l-2 border-t-2", "right-4 top-4 border-r-2 border-t-2", "left-4 bottom-4 border-l-2 border-b-2", "right-4 bottom-4 border-r-2 border-b-2"].map((c) => (
                  <span key={c} className={`absolute h-8 w-8 rounded-sm border-primary ${c}`} />
                ))}
                <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-primary/60">
                  {phase === "scan" && <div className="radar-sweep absolute inset-0 rounded-full" />}
                </div>
                {phase === "scan" && (
                  <motion.div initial={{ top: "0%" }} animate={{ top: "100%" }} transition={{ duration: 1.1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_16px_var(--primary)]" />
                )}
                <div className="glass absolute inset-x-3 top-3 flex justify-between rounded-xl px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-critical" />{cam ? "Camera on" : "No camera"}</span>
                  <span className="text-primary">{phase === "scan" ? "Analysing…" : phase === "done" ? "Complete" : "Ready"}</span>
                </div>
                <AnimatePresence>
                  {phase === "done" && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass absolute inset-x-3 bottom-3 rounded-2xl p-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sample reading</p>
                          <p className="font-display text-3xl font-bold text-warn">— <span className="text-sm text-muted-foreground">AQI</span></p>
                        </div>
                        <p className="max-w-[60%] text-right text-[11px] text-muted-foreground">Real AQI estimates will appear here once sky analysis is connected.</p>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-safe via-warn to-critical" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-2 p-4">
                <button onClick={scan} disabled={phase === "scan"} className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                  {phase === "scan" ? "Scanning…" : phase === "done" ? "Scan again" : "Capture & calculate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
