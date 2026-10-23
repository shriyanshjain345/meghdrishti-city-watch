type P = { t: string; rainChance: number; risk: number };

export default function TrendChart({ data, active, onPick }: { data: P[]; active: number; onPick: (i: number) => void }) {
  if (data.length < 2) return null;
  const W = 320, H = 130, pad = 18;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (data.length - 1);
  const y = (v: number) => H - pad - (v / 100) * (H - pad * 2);
  const line = (k: "rainChance" | "risk") => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[k])}`).join(" ");
  return (
    <div className="mt-4 rounded-lg bg-secondary/50 p-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <b>Rainfall & flood risk trend</b>
        <span className="flex gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-safe" />Rain chance</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded bg-critical" />Flood risk</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[25, 50, 75].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} className="stroke-border" strokeDasharray="3 3" />
        ))}
        <path d={`${line("rainChance")} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} className="fill-safe/15" />
        <path d={line("rainChance")} className="stroke-safe" fill="none" strokeWidth={2.5} />
        <path d={line("risk")} className="stroke-critical" fill="none" strokeWidth={2.5} />
        {data.map((d, i) => (
          <g key={i} onClick={() => onPick(i)} className="cursor-pointer">
            <rect x={x(i) - 14} y={0} width={28} height={H} className={i === active ? "fill-primary/15" : "fill-transparent"} />
            <circle cx={x(i)} cy={y(d.rainChance)} r={3.5} className="fill-safe" />
            <circle cx={x(i)} cy={y(d.risk)} r={3.5} className="fill-critical" />
            <text x={x(i)} y={H - 3} textAnchor="middle" className="fill-muted-foreground text-[9px]">{d.t}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
