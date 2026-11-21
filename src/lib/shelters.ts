export type ShelterCandidate = {
  city: string;
  name: string;
  kind: "Railway station" | "Hospital";
  lat: number;
  lng: number;
};

// Approximate landmark coordinates only. These places are not confirmed as
// designated, elevated, open, or currently accessible relief shelters.
export const SHELTER_CANDIDATES: ShelterCandidate[] = [
  { city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Terminus", kind: "Railway station", lat: 18.9402, lng: 72.8356 },
  { city: "Mumbai", name: "King Edward Memorial Hospital", kind: "Hospital", lat: 19.0017, lng: 72.8424 },
  { city: "Mumbai", name: "Dadar Railway Station", kind: "Railway station", lat: 19.0183, lng: 72.8428 },
  { city: "Jaipur", name: "Jaipur Junction", kind: "Railway station", lat: 26.9196, lng: 75.7878 },
  { city: "Jaipur", name: "Sawai Man Singh Hospital", kind: "Hospital", lat: 26.9035, lng: 75.8078 },
  { city: "Jaipur", name: "Durgapura Railway Station", kind: "Railway station", lat: 26.8576, lng: 75.7897 },
  { city: "Delhi", name: "New Delhi Railway Station", kind: "Railway station", lat: 28.6431, lng: 77.2197 },
  { city: "Delhi", name: "AIIMS New Delhi", kind: "Hospital", lat: 28.5672, lng: 77.2100 },
  { city: "Delhi", name: "Safdarjung Hospital", kind: "Hospital", lat: 28.5687, lng: 77.2077 },
  { city: "Bengaluru", name: "KSR Bengaluru City Junction", kind: "Railway station", lat: 12.9767, lng: 77.5713 },
  { city: "Bengaluru", name: "Yeshwanthpur Junction", kind: "Railway station", lat: 13.0234, lng: 77.5502 },
  { city: "Bengaluru", name: "Victoria Hospital", kind: "Hospital", lat: 12.9637, lng: 77.5744 },
  { city: "Kolkata", name: "Howrah Junction", kind: "Railway station", lat: 22.5851, lng: 88.3427 },
  { city: "Kolkata", name: "Sealdah Railway Station", kind: "Railway station", lat: 22.5675, lng: 88.3694 },
  { city: "Kolkata", name: "R. G. Kar Medical College and Hospital", kind: "Hospital", lat: 22.6048, lng: 88.3730 },
  { city: "Chennai", name: "Chennai Central", kind: "Railway station", lat: 13.0827, lng: 80.2757 },
  { city: "Chennai", name: "Government General Hospital", kind: "Hospital", lat: 13.0822, lng: 80.2795 },
  { city: "Chennai", name: "Chennai Egmore Railway Station", kind: "Railway station", lat: 13.0783, lng: 80.2611 },
  { city: "Hyderabad", name: "Secunderabad Junction", kind: "Railway station", lat: 17.4339, lng: 78.5010 },
  { city: "Hyderabad", name: "Gandhi Hospital", kind: "Hospital", lat: 17.4136, lng: 78.4992 },
  { city: "Hyderabad", name: "Osmania General Hospital", kind: "Hospital", lat: 17.3714, lng: 78.4802 },
  { city: "Pune", name: "Pune Junction", kind: "Railway station", lat: 18.5289, lng: 73.8744 },
  { city: "Pune", name: "Sassoon General Hospital", kind: "Hospital", lat: 18.5288, lng: 73.8719 },
  { city: "Pune", name: "Deenanath Mangeshkar Hospital", kind: "Hospital", lat: 18.5071, lng: 73.8317 },
  { city: "Lucknow", name: "Lucknow Charbagh Railway Station", kind: "Railway station", lat: 26.8313, lng: 80.9211 },
  { city: "Lucknow", name: "King George's Medical University", kind: "Hospital", lat: 26.8719, lng: 80.9117 },
  { city: "Lucknow", name: "Sanjay Gandhi Postgraduate Institute", kind: "Hospital", lat: 26.7462, lng: 80.9423 },
  { city: "Guwahati", name: "Guwahati Railway Station", kind: "Railway station", lat: 26.1833, lng: 91.7440 },
  { city: "Guwahati", name: "Gauhati Medical College and Hospital", kind: "Hospital", lat: 26.1618, lng: 91.7701 },
  { city: "Guwahati", name: "Kamakhya Junction", kind: "Railway station", lat: 26.1612, lng: 91.6961 },
  { city: "Kochi", name: "Ernakulam Junction", kind: "Railway station", lat: 9.9679, lng: 76.2914 },
  { city: "Kochi", name: "Ernakulam General Hospital", kind: "Hospital", lat: 9.9821, lng: 76.2850 },
  { city: "Kochi", name: "Ernakulam Town Railway Station", kind: "Railway station", lat: 9.9890, lng: 76.2884 },
];

export function sheltersForCity(city: string): ShelterCandidate[] {
  return SHELTER_CANDIDATES.filter((candidate) => candidate.city === city);
}