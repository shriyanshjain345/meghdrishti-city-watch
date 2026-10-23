// Animated backdrop reflecting the current live weather condition.
export default function WeatherFx({ cond, mm }: { cond: string; mm: number }) {
  const c = cond.toLowerCase();
  const storm = /thunder|storm/.test(c);
  const rainy = storm || /rain|drizzle|shower/.test(c) || mm > 0.2;
  const cloudy = rainy || /cloud|overcast|haze|mist|fog/.test(c);
  const sunny = !rainy && /sun|clear/.test(c);
  const drops = rainy ? (storm || mm > 5 ? 70 : 35) : 0;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {sunny && <div className="fx-sun absolute -right-16 -top-16 h-56 w-56 rounded-full bg-warn/40 blur-3xl" />}
      {cloudy &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            className="fx-cloud absolute h-16 w-64 rounded-full bg-foreground/10 blur-2xl"
            style={{ top: `${10 + i * 22}%`, animationDuration: `${40 + i * 15}s`, animationDelay: `-${i * 12}s` }}
          />
        ))}
      {Array.from({ length: drops }, (_, i) => (
        <span
          key={i}
          className="fx-drop absolute -top-10 w-px bg-primary/50"
          style={{
            left: `${(i * 37) % 100}%`,
            height: `${14 + (i % 4) * 6}px`,
            animationDuration: `${0.6 + (i % 5) * 0.15}s`,
            animationDelay: `-${(i % 9) * 0.2}s`,
          }}
        />
      ))}
      {storm && <div className="fx-flash absolute inset-0 bg-foreground" />}
    </div>
  );
}
