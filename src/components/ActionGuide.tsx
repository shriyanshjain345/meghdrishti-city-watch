import { useState } from "react";
import kitImg from "@/assets/guide-kit.jpg";
import duringImg from "@/assets/guide-during.jpg";
import dontImg from "@/assets/guide-dont.jpg";
import afterImg from "@/assets/guide-after.jpg";

type Item = { icon: string; label: string; desc: string };
type Stage = { id: string; icon: string; title: string; sub: string; img: string; tone: string; items: Item[] };

const STAGES: Stage[] = [
  {
    id: "before", icon: "🎒", title: "Before Rain", sub: "What is needed", img: kitImg, tone: "border-safe text-safe",
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

export default function ActionGuide() {
  const [stageId, setStageId] = useState("before");
  const [itemIdx, setItemIdx] = useState(0);
  const stage = STAGES.find((s) => s.id === stageId)!;
  const item = stage.items[itemIdx] ?? stage.items[0]!;

  return (
    <div className="space-y-5">
      {/* Flowchart */}
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-2 sm:flex-row">
            <button
              onClick={() => { setStageId(s.id); setItemIdx(0); }}
              className={`w-full flex-1 rounded-xl border-2 p-3 text-left transition hover:scale-[1.03] ${
                s.id === stageId ? `${s.tone} bg-accent` : "border-border bg-secondary text-foreground"
              }`}
            >
              <div className="text-2xl">{s.icon}</div>
              <div className="text-sm font-bold">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </button>
            {i < STAGES.length - 1 && <span className="text-xl text-muted-foreground sm:rotate-0 rotate-90">➜</span>}
          </div>
        ))}
      </div>

      {/* Stage detail */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl">
          <img src={stage.img} alt={stage.title} loading="lazy" width={992} height={672} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-4">
            <p className={`text-lg font-bold ${stage.tone.split(" ")[1]}`}>{stage.icon} {stage.title}</p>
          </div>
        </div>

        <div>
          {/* mini flow of steps */}
          <div className="relative space-y-2 pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
            {stage.items.map((it, i) => (
              <button
                key={it.label}
                onClick={() => setItemIdx(i)}
                className={`relative flex w-full items-center gap-3 rounded-lg p-2.5 text-left text-sm transition ${
                  i === itemIdx ? "bg-accent font-semibold" : "bg-secondary hover:bg-accent/60"
                }`}
              >
                <span className={`absolute -left-[22px] h-3 w-3 rounded-full border-2 ${i === itemIdx ? stage.tone + " bg-current" : "border-border bg-background"}`} />
                <span className="text-xl">{it.icon}</span>
                {it.label}
              </button>
            ))}
          </div>
          <div className={`mt-4 rounded-xl border-l-4 bg-secondary p-4 ${stage.tone.split(" ")[0]}`}>
            <p className="font-semibold">{item.icon} {item.label}</p>
            <p className="mt-1 text-sm text-foreground/80">{item.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
