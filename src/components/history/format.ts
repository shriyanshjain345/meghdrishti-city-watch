const dFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const dtFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Kolkata",
});

export const fmtDate = (iso: string) => dFmt.format(new Date(`${iso}T00:00:00Z`));
export const fmtStamp = (iso: string) => `${dtFmt.format(new Date(iso))} IST`;
export const fmtMm = (v: number, d = 0) => v.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
