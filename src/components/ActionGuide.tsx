import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import kitImg from "@/assets/guide-kit.jpg";
import duringImg from "@/assets/guide-during.jpg";
import dontImg from "@/assets/guide-dont.jpg";
import afterImg from "@/assets/guide-after.jpg";

type Item = { icon: string; label: string; desc: string };
type Stage = { id: string; icon: string; title: string; sub: string; img: string; tone: string; items: Item[] };

const STAGES: Stage[] = [
  {
    id: "before", icon: "🎒", title: "Before Rain", sub: "What is needed", img: kitImg, tone: "border-primary text-primary",
    items: [
      { icon: "🔦", label: "Torch & batteries", desc: "Power cuts are common during heavy rain. Keep a torch with spare batteries where everyone can find it in the dark." },
      { icon: "🔋", label: "Charged power bank", desc: "Keep phones and a power bank fully charged so you can stay in touch and check updates." },
      { icon: "💊", label: "Medicines (3 days)", desc: "Store at least 3 days of regular medicines and a basic first-aid kit in a waterproof box." },
      { icon: "📄", label: "Documents in zip bag", desc: "Aadhaar, insurance papers and cash in a sealed plastic bag — easy to grab and safe from water." },
      { icon: "📞", label: "Save helplines", desc: "112 Emergency · 1078 NDMA · your city corporation number. Write them on paper too." },
    ],
  },
  {
    id: "during", icon: "🏠", title: "Water Rising", sub: "What you can do", img: duringImg, tone: "border-primary text-primary",
    items: [
      { icon: "⬆️", label: "Move to higher floor", desc: "Go up with your kit, family and pets. Avoid ground floors and basements." },
      { icon: "⚡", label: "Switch off mains", desc: "If water enters the home, switch off the main electricity and gas supply — only if you are standing on a dry surface." },
      { icon: "🚰", label: "Store clean water", desc: "Fill bottles and buckets early; tap water can get contaminated once drains overflow." },
      { icon: "📻", label: "Follow official updates", desc: "Listen to local authority announcements and trusted news — ignore forwarded rumours." },
    ],
  },
  {
    id: "dont", icon: "🚫", title: "Never Do", sub: "What you can't do", img: dontImg, tone: "border-critical text-critical",
    items: [
      { icon: "🚗", label: "Drive into underpass", desc: "Just 30 cm of moving water can float a car. Underpasses fill fast and doors may not open." },
      { icon: "🚶", label: "Walk in moving water", desc: "15 cm of flowing water can knock an adult down. Open manholes are hidden under the surface." },
      { icon: "🔌", label: "Touch wet wiring", desc: "Stay away from fallen wires, electric poles and switchboards that are wet." },
      { icon: "🧒", label: "Let kids play in water", desc: "Flood water carries sewage, sharp debris and infection. Keep children indoors." },
    ],
  },
  {
    id: "after", icon: "🧹", title: "After Water Drops", sub: "Recover safely", img: afterImg, tone: "border-warn text-warn",
    items: [
      { icon: "🔥", label: "Boil drinking water", desc: "Boil water for at least 1 minute or use sealed bottles until supply is declared safe." },
      { icon: "🧤", label: "Clean with gloves", desc: "Wear gloves and boots while cleaning mud. Disinfect floors with bleach solution." },
      { icon: "🦟", label: "Remove standing water", desc: "Empty buckets, pots and coolers — stagnant water breeds dengue and malaria mosquitoes." },
      { icon: "📸", label: "Photograph damage", desc: "Take photos of damage before cleaning; they help with insurance and relief claims." },
    ],
  },
];

const spring = { type: "spring" as const, stiffness: 260, damping: 24 };

export default function ActionGuide() {
  const [stageId, setStageId] = useState("before");
  const [itemIdx, setItemIdx] = useState<number | null>(null);
  const stage = STAGES.find((s) => s.id === stageId)!;
  const item = itemIdx === null ? null : stage.items[itemIdx] ?? null;

  return (
    <div className="space-y-6">
      {/* Top deck: stage piles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAGES.map((s, i) => {
          const on = s.id === stageId;
          return (
            <button key={s.id} onClick={() => { setStageId(s.id); setItemIdx(null); }} className="relative h-36 text-left" aria-pressed={on}>
              {[2, 1].map((d) => (
                <span key={d} aria-hidden className="absolute inset-0 rounded-2xl border border-border bg-card" style={{ transform: `translate(${d * 4}px, ${d * 4}px) rotate(${d * (i % 2 ? -1.5 : 1.5)}deg)` }} />
              ))}
              <motion.div
                layout
                whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }}
                whileTap={{ scale: 0.96 }}
                animate={{ y: on ? -10 : 0, scale: on ? 1.03 : 1 }}
                transition={spring}
                className={`relative flex h-full flex-col justify-between rounded-2xl border-2 bg-background p-3 shadow-lg ${on ? s.tone : "border-border text-foreground"}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-xs font-bold text-muted-foreground">{i + 1}/4</span>
                </div>
                <div>
                  <div className="font-display text-base font-bold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.sub} · {s.items.length} cards</div>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      {/* Dealt hand */}
      <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <AnimatePresence mode="wait">
          <motion.div key={stage.id} initial={{ opacity: 0, rotateY: -25, x: -40 }} animate={{ opacity: 1, rotateY: 0, x: 0 }} exit={{ opacity: 0, rotateY: 25, x: 40 }} transition={spring} className="relative overflow-hidden rounded-2xl shadow-lg">
            <img src={stage.img} alt={stage.title} loading="lazy" width={992} height={672} className="live-img h-full max-h-80 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4">
              <p className={`font-display text-lg font-bold ${stage.tone.split(" ")[1]}`}>{stage.icon} {stage.title}</p>
              <p className="text-xs text-muted-foreground">Tap a card to flip it open</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div>
          <AnimatePresence mode="popLayout">
            <motion.div key={stage.id} className="flex flex-wrap gap-3">
              {stage.items.map((it, i) => {
                const on = i === itemIdx;
                return (
                  <motion.button
                    key={it.label}
                    layout
                    initial={{ opacity: 0, y: -60, rotate: -12, x: -30 }}
                    animate={{ opacity: 1, y: on ? -8 : 0, rotate: on ? 0 : (i - (stage.items.length - 1) / 2) * 3, x: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ ...spring, delay: i * 0.07 }}
                    whileHover={{ y: -8, rotate: 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setItemIdx(on ? null : i)}
                    className={`flex w-[calc(50%-0.4rem)] flex-col items-start gap-1 rounded-xl border-2 bg-background p-3 text-left shadow-md sm:w-[7.5rem] ${on ? stage.tone : "border-border"}`}
                  >
                    <span className="text-2xl">{it.icon}</span>
                    <span className="text-xs font-semibold leading-tight text-foreground">{it.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {item ? (
              <motion.div key={stage.id + item.label} initial={{ opacity: 0, y: 24, rotateX: -30 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -12 }} transition={spring} className={`mt-5 rounded-2xl border-l-4 bg-card p-4 shadow-lg ${stage.tone.split(" ")[0]}`}>
                <p className="font-display font-bold">{item.icon} {item.label}</p>
                <p className="mt-1 text-sm text-foreground/80">{item.desc}</p>
                {itemIdx! < stage.items.length - 1 && (
                  <button onClick={() => setItemIdx(itemIdx! + 1)} className="mt-3 text-xs font-semibold text-primary hover:underline">Next card →</button>
                )}
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                👆 Pick a card from the hand above to read what to do.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
