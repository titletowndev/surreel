import type { Chain } from "@/lib/types";

export type PlaceTheater = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  location: { latitude: number; longitude: number } | null;
};

export async function searchTheaters(q: string): Promise<PlaceTheater[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  try {
    const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.places) ? (data.places as PlaceTheater[]) : [];
  } catch {
    return [];
  }
}

export function inferChain(name: string): Chain {
  const n = name.toLowerCase();
  if (n.includes("amc")) return "AMC";
  if (n.includes("regal")) return "Regal";
  return "Other";
}
