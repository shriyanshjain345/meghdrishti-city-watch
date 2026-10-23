// Documented Mumbai flood events. Every figure below is quoted from the linked
// sources; fields a source does not report stay null. Map coordinates are
// approximate neighbourhood centres, not exact incident points.
export type EventType = "flooding" | "collapse" | "landslide" | "wind";

export type FloodEvent = {
  id: string;
  date: string;
  title: string;
  /** Calendar days covered by the reported rainfall window (IST). */
  window: [string, string];
  types: EventType[];
  places: { name: string; lat: number; lng: number }[];
  rainfall: { mm: number; station: string; period: string }[];
  impact: string;
  deaths: string | null;
  sources: { label: string; url: string }[];
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  flooding: "Street flooding",
  collapse: "Wall / house collapse",
  landslide: "Landslide",
  wind: "Strong winds",
};

export const FLOOD_EVENTS: FloodEvent[] = [
  {
    id: "2005-07-26",
    date: "2005-07-26",
    title: "26 July 2005 deluge",
    window: ["2005-07-26", "2005-07-27"],
    types: ["flooding", "landslide"],
    places: [
      { name: "Santacruz (IMD observatory area)", lat: 19.085, lng: 72.855 },
      { name: "Colaba (IMD observatory area)", lat: 18.9067, lng: 72.8147 },
    ],
    rainfall: [
      { mm: 944, station: "IMD Santacruz", period: "24 h from 08:30 IST, 26 Jul" },
      { mm: 73.4, station: "IMD Colaba", period: "24 h, 26–27 Jul" },
    ],
    impact:
      "More than 419 people were killed by flash floods and landslides in the Mumbai municipal area and about 216 died of flood-related illness; over 100,000 establishments and 30,000 vehicles were damaged.",
    deaths: "419+ (municipal area) and ~216 from illness",
    sources: [
      { label: "NIDM — Urban Floods: Case Study of Mumbai", url: "https://nidm.gov.in/journal/PDF/Journal/Journal20092/Journal20092b.pdf" },
      { label: "Indian Express (IMD records)", url: "https://indianexpress.com/article/cities/mumbai/mumbai-2005-vs-2019-response-to-disasters-has-come-a-long-way-5811808/" },
      { label: "Times of India (Colaba 73.4 mm)", url: "https://timesofindia.indiatimes.com/city/mumbai/24-hour-downpour-in-city-is-2nd-heaviest-ever-recorded/articleshow/77403525.cms" },
    ],
  },
  {
    id: "2017-08-29",
    date: "2017-08-29",
    title: "29 August 2017 flood",
    window: ["2017-08-29", "2017-08-30"],
    types: ["flooding"],
    places: [
      { name: "Hindmata, Parel", lat: 19.0045, lng: 72.8418 },
      { name: "Dadar TT", lat: 19.0186, lng: 72.8467 },
    ],
    rainfall: [
      { mm: 331.4, station: "IMD Santacruz", period: "24 h, 29 Aug" },
      { mm: 315.8, station: "IMD Santacruz", period: "08:30–20:30 IST, 29 Aug" },
      { mm: 110, station: "IMD Colaba", period: "24 h, 29 Aug" },
    ],
    impact:
      "Heaviest day at Santacruz since 2005 and the wettest August day since 1997. Suburban trains stopped and water stood waist-deep at Hindmata.",
    deaths: "5 reported by 30 Aug",
    sources: [
      { label: "BusinessLine", url: "https://www.thehindubusinessline.com/news/national/mumbai-limps-back-to-normalcy-after-deluge/article9837083.ece" },
      { label: "Indian Express — 12-hour record", url: "https://indianexpress.com/article/cities/mumbai/mumbai-rains-highest-12-hour-rainfall-since-2005-4819995/" },
      { label: "Indian Express — Explained", url: "https://indianexpress.com/article/explained/behind-mumbai-flood-cruel-august-rainfall-monsoon-4819936/" },
    ],
  },
  {
    id: "2019-07-02",
    date: "2019-07-02",
    title: "1–2 July 2019 downpour & Malad wall collapse",
    window: ["2019-07-01", "2019-07-02"],
    types: ["flooding", "collapse"],
    places: [
      { name: "Pimpripada, Malad (East)", lat: 19.1875, lng: 72.87 },
      { name: "Malad subway", lat: 19.186, lng: 72.849 },
    ],
    rainfall: [
      { mm: 375.2, station: "IMD Santacruz", period: "24 h ending 08:30 IST, 2 Jul" },
      { mm: 479.56, station: "BMC gauge, Dindoshi", period: "24 h ending 08:00 IST, 2 Jul" },
      { mm: 137.88, station: "IMD Colaba", period: "24 h ending 08:30 IST, 2 Jul" },
    ],
    impact:
      "A reservoir wall in Malad (East) gave way onto hillside homes — 22 dead and 94 injured. Two men died in a car trapped in the flooded Malad subway.",
    deaths: "30 in Mumbai, incl. 22 at Malad",
    sources: [
      { label: "The Hindu", url: "https://www.thehindu.com/news/cities/mumbai/at-least-dozen-killed-in-mumbai-wall-collapse-after-overnight-rains/article28258147.ece" },
      { label: "Indian Express (BMC gauges)", url: "https://indianexpress.com/article/cities/mumbai/mumbai-rains-heavy-downpour-in-suburbs-dindoshi-receives-479-mm-rainfall-5810153/" },
      { label: "Times of India", url: "https://timesofindia.indiatimes.com/india/30-die-in-heaviest-mumbai-downpour-since-2005-deluge/articleshow/70048819.cms" },
    ],
  },
  {
    id: "2020-08-05",
    date: "2020-08-05",
    title: "5 August 2020 storm rain",
    window: ["2020-08-05", "2020-08-06"],
    types: ["flooding", "wind"],
    places: [
      { name: "Colaba (IMD observatory area)", lat: 18.9067, lng: 72.8147 },
      { name: "Marine Lines", lat: 18.944, lng: 72.8232 },
    ],
    rainfall: [
      { mm: 331.8, station: "IMD Colaba", period: "24 h, 08:00 5 Aug – 08:00 6 Aug" },
      { mm: 162.3, station: "IMD Santacruz", period: "24 h, 5–6 Aug" },
    ],
    impact:
      "Gusts up to 107 km/h at Colaba with very heavy rain; trees uprooted, south Mumbai streets flooded and public transport halted.",
    deaths: null,
    sources: [
      { label: "IMD press release, 5 Aug 2020", url: "https://internal.imd.gov.in/press_release/20200805_pr_881.pdf" },
      { label: "Times of India", url: "https://timesofindia.indiatimes.com/city/mumbai/24-hour-downpour-in-city-is-2nd-heaviest-ever-recorded/articleshow/77403525.cms" },
      { label: "Frontline", url: "https://frontline.thehindu.com/dispatches/heavy-winds-record-single-day-rainfall-batter-mumbai/article32284211.ece" },
    ],
  },
  {
    id: "2021-07-16",
    date: "2021-07-16",
    title: "16 July 2021 overnight downpour",
    window: ["2021-07-15", "2021-07-16"],
    types: ["flooding"],
    places: [
      { name: "Gandhi Market, Sion", lat: 19.029, lng: 72.8575 },
      { name: "Kurla subway", lat: 19.066, lng: 72.88 },
      { name: "Milan subway", lat: 19.0866, lng: 72.842 },
    ],
    rainfall: [
      { mm: 253, station: "IMD Santacruz", period: "24 h, 16 Jul (250 mm in 12 h to 08:30)" },
      { mm: 11, station: "IMD Colaba", period: "12 h to 08:30 IST, 16 Jul" },
    ],
    impact:
      "Rain coincided with a 3.6 m high tide; Hindmata, Sion, Kurla and Milan subways were waterlogged, the Mithi River reached its danger mark and 250 people were moved to a school.",
    deaths: null,
    sources: [{ label: "mid-day", url: "https://www.mid-day.com/mumbai/mumbai-news/article/mumbais-suburban-areas-get-highest-rainfall-of-the-season-23183252" }],
  },
  {
    id: "2021-07-18",
    date: "2021-07-18",
    title: "18 July 2021 Chembur & Vikhroli landslides",
    window: ["2021-07-17", "2021-07-18"],
    types: ["landslide", "collapse", "flooding"],
    places: [
      { name: "New Bharat Nagar, Chembur", lat: 19.0395, lng: 72.9105 },
      { name: "Surya Nagar, Vikhroli (W)", lat: 19.1115, lng: 72.9265 },
    ],
    rainfall: [
      { mm: 235, station: "IMD Santacruz", period: "24 h ending 08:30 IST, 18 Jul" },
      { mm: 226.82, station: "BMC gauge, Dahisar", period: "overnight 17–18 Jul" },
    ],
    impact:
      "Landslides brought down a wall onto homes at New Bharat Nagar, Chembur (19 dead) and shanties at Surya Nagar, Vikhroli (10 dead).",
    deaths: "At least 32",
    sources: [
      { label: "Indian Express", url: "https://indianexpress.com/article/cities/mumbai/32-killed-as-intense-rain-triggers-landslides-leaves-mumbai-flooded-7411134/" },
      { label: "The Hindu", url: "https://www.thehindu.com/news/cities/mumbai/heavy-rains-pummel-mumbai-local-train-services-suspended/article35390389.ece" },
      { label: "Wikipedia — 2021 Mumbai landslide", url: "https://en.wikipedia.org/wiki/2021_Mumbai_landslide" },
    ],
  },
  {
    id: "2025-08-19",
    date: "2025-08-19",
    title: "18–19 August 2025 heavy rain",
    window: ["2025-08-18", "2025-08-19"],
    types: ["flooding"],
    places: [
      { name: "Andheri subway", lat: 19.1197, lng: 72.8464 },
      { name: "Gandhi Market, Sion", lat: 19.029, lng: 72.8575 },
    ],
    rainfall: [
      { mm: 223, station: "IMD Santacruz", period: "24 h, 18–19 Aug morning" },
      { mm: 369, station: "BMC gauge, Chincholi", period: "24 h, 18–19 Aug" },
      { mm: 110, station: "IMD Colaba", period: "24 h, 18–19 Aug" },
    ],
    impact:
      "Fourth straight day of heavy rain: Andheri subway shut under about two feet of water, 2.5–3 ft of water at Gandhi Market (Sion), government offices closed.",
    deaths: null,
    sources: [
      { label: "Indian Express — 300 mm in 24 h", url: "https://indianexpress.com/article/cities/mumbai/heavy-rain-mumbai-over-300mm-24-hours-10198184/" },
      { label: "Indian Express — subways closed", url: "https://indianexpress.com/article/cities/mumbai/heavy-rain-cripples-mumbai-traffic-goes-haywire-as-subways-roads-closed-10197631/" },
      { label: "mid-day", url: "https://www.mid-day.com/mumbai/mumbai-news/article/mumbai-rains-city-continues-to-battle-downpour-on-tuesday-santacruz-records-highest-rainfall-in-6-hours-23590168" },
    ],
  },
];
