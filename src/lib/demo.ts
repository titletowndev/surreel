/**
 * Demo dataset — loaded automatically when Supabase isn't configured, so a
 * fresh `npm run dev` shows a populated, lifelike dashboard instead of $0.00.
 * Mutations operate on this in-memory data (see state/data.tsx demo branch).
 */
import type {
  AmcStatePrice,
  MembershipCharge,
  MembershipProgram,
  Screening,
  Theater,
} from "@/lib/types";

const USER = "demo-user";

export const DEMO_THEATERS: Theater[] = [
  { id: "th-bc", user_id: USER, name: "AMC Boston Common 19", chain: "AMC", city: "Boston", state: "MA", created_at: "2026-01-01" },
  { id: "th-ar", user_id: USER, name: "AMC Assembly Row 12", chain: "AMC", city: "Somerville", state: "MA", created_at: "2026-01-01" },
  { id: "th-fn", user_id: USER, name: "Regal Fenway", chain: "Regal", city: "Boston", state: "MA", created_at: "2026-01-01" },
  { id: "th-cc", user_id: USER, name: "Coolidge Corner Theatre", chain: "Other", city: "Brookline", state: "MA", created_at: "2026-01-01" },
];

export const DEMO_PROGRAMS: MembershipProgram[] = [
  {
    id: "pg-alist",
    user_id: USER,
    name: "AMC A-List",
    use_historical_state_pricing: true,
    state: "MA",
    billing_day: 12,
    monthly_fee: 24.99,
    is_paused: false,
    start_date: "2026-01-12",
    created_at: "2026-01-12",
  },
];

export const DEMO_PRICE_TABLE: AmcStatePrice[] = [
  { state: "MA", effective_from: "2023-01-01", monthly_price: 24.99, tier: "C" },
  { state: "MA", effective_from: "2025-02-01", monthly_price: 25.99, tier: "C" },
  { state: "CA", effective_from: "2025-02-01", monthly_price: 25.99, tier: "C" },
  { state: "TX", effective_from: "2025-02-01", monthly_price: 23.99, tier: "B" },
];

// Monthly A-List charges Jan–Jun 2026 (billing day 12), $25.99 in MA.
export const DEMO_CHARGES: MembershipCharge[] = [
  { id: "ch-1", user_id: USER, program_id: "pg-alist", charge_date: "2026-01-12", amount: 25.99, source: "onboarding", created_at: "2026-01-12" },
  { id: "ch-2", user_id: USER, program_id: "pg-alist", charge_date: "2026-02-12", amount: 25.99, source: "auto", created_at: "2026-02-12" },
  { id: "ch-3", user_id: USER, program_id: "pg-alist", charge_date: "2026-03-12", amount: 25.99, source: "auto", created_at: "2026-03-12" },
  { id: "ch-4", user_id: USER, program_id: "pg-alist", charge_date: "2026-04-12", amount: 25.99, source: "auto", created_at: "2026-04-12" },
  { id: "ch-5", user_id: USER, program_id: "pg-alist", charge_date: "2026-05-12", amount: 25.99, source: "auto", created_at: "2026-05-12" },
  { id: "ch-6", user_id: USER, program_id: "pg-alist", charge_date: "2026-06-12", amount: 25.99, source: "auto", created_at: "2026-06-12" },
];

type Seed = {
  id: string;
  title: string;
  year: number;
  runtime: number;
  director: string;
  mpaa: string;
  genres: string[];
  theater: string;
  format: Screening["screen_format"];
  details?: string;
  is3d?: boolean;
  plf?: boolean;
  aud?: string;
  when: string; // ISO
  ticket: number;
  concessions?: number;
  misc?: number;
  extra?: number;
  extraCost?: number;
  rating?: number;
  upcoming?: boolean;
};

// A realistic season of theatrical visits across 2026 (evenings + weekends).
const SEED: Seed[] = [
  { id: "s1", title: "Dune: Part Three", year: 2026, runtime: 166, director: "Denis Villeneuve", mpaa: "PG-13", genres: ["Science Fiction", "Adventure"], theater: "th-bc", format: "IMAX", details: "Laser", plf: true, aud: "IMAX", when: "2026-01-16T19:30", ticket: 24.99, concessions: 18.5, rating: 9.4 },
  { id: "s2", title: "Mickey 18", year: 2026, runtime: 139, director: "Bong Joon-ho", mpaa: "R", genres: ["Science Fiction", "Comedy"], theater: "th-ar", format: "Dolby", details: "Atmos", plf: true, aud: "Dolby", when: "2026-01-23T20:00", ticket: 21.49, rating: 8.1 },
  { id: "s3", title: "The Bride", year: 2026, runtime: 121, director: "Maggie Gyllenhaal", mpaa: "R", genres: ["Horror", "Drama"], theater: "th-cc", format: "Standard", details: "35mm", aud: "1", when: "2026-01-30T21:15", ticket: 14.0, concessions: 9.0, rating: 7.8 },
  { id: "s4", title: "Avatar: Fire and Ash", year: 2025, runtime: 192, director: "James Cameron", mpaa: "PG-13", genres: ["Science Fiction", "Adventure"], theater: "th-bc", format: "RealD3D", is3d: true, aud: "8", when: "2026-02-07T18:00", ticket: 22.5, concessions: 22.0, extra: 1, extraCost: 22.5, rating: 8.6 },
  { id: "s5", title: "Project Hail Mary", year: 2026, runtime: 145, director: "Phil Lord, Chris Miller", mpaa: "PG-13", genres: ["Science Fiction", "Thriller"], theater: "th-bc", format: "IMAX", details: "Laser", plf: true, aud: "IMAX", when: "2026-02-14T20:30", ticket: 24.99, rating: 9.0 },
  { id: "s6", title: "The Cat in the Hat", year: 2026, runtime: 100, director: "Erica Rivinoja", mpaa: "PG", genres: ["Animation", "Comedy"], theater: "th-ar", format: "Standard", aud: "4", when: "2026-02-21T13:00", ticket: 15.49, concessions: 14.0, rating: 6.2 },
  { id: "s7", title: "28 Years Later: The Bone Temple", year: 2026, runtime: 131, director: "Nia DaCosta", mpaa: "R", genres: ["Horror", "Thriller"], theater: "th-fn", format: "Standard", aud: "6", when: "2026-02-27T22:00", ticket: 16.25, rating: 7.5 },
  { id: "s8", title: "Spider-Man: Brand New Day", year: 2026, runtime: 128, director: "Destin Daniel Cretton", mpaa: "PG-13", genres: ["Action", "Adventure"], theater: "th-bc", format: "Dolby", details: "Atmos", plf: true, aud: "Dolby", when: "2026-03-06T19:00", ticket: 21.49, concessions: 16.0, rating: 8.3 },
  { id: "s9", title: "The Odyssey", year: 2026, runtime: 175, director: "Christopher Nolan", mpaa: "PG-13", genres: ["Adventure", "Drama"], theater: "th-bc", format: "IMAX", details: "70mm", plf: true, aud: "IMAX", when: "2026-03-13T18:30", ticket: 26.99, concessions: 19.5, rating: 9.6 },
  { id: "s10", title: "Mortal Kombat II", year: 2025, runtime: 134, director: "Simon McQuoid", mpaa: "R", genres: ["Action", "Fantasy"], theater: "th-ar", format: "Standard", aud: "9", when: "2026-03-14T21:30", ticket: 15.49, rating: 6.9 },
  { id: "s11", title: "Tron: Ares", year: 2025, runtime: 119, director: "Joachim Rønning", mpaa: "PG-13", genres: ["Science Fiction", "Action"], theater: "th-bc", format: "RealD3D", is3d: true, aud: "8", when: "2026-03-20T20:00", ticket: 22.5, rating: 7.7 },
  { id: "s12", title: "The Drama", year: 2026, runtime: 110, director: "Kristoffer Borgli", mpaa: "R", genres: ["Drama", "Romance"], theater: "th-cc", format: "Standard", details: "35mm", aud: "2", when: "2026-03-27T19:45", ticket: 14.0, rating: 8.0 },
  { id: "s13", title: "Michael", year: 2026, runtime: 142, director: "Antoine Fuqua", mpaa: "PG-13", genres: ["Drama", "Music"], theater: "th-fn", format: "Standard", aud: "3", when: "2026-04-03T20:15", ticket: 16.25, concessions: 12.0, rating: 7.2 },
  { id: "s14", title: "Supergirl", year: 2026, runtime: 124, director: "Craig Gillespie", mpaa: "PG-13", genres: ["Action", "Adventure"], theater: "th-bc", format: "IMAX", details: "Laser", plf: true, aud: "IMAX", when: "2026-04-10T19:00", ticket: 24.99, rating: 8.4 },
  { id: "s15", title: "Practical Magic 2", year: 2026, runtime: 116, director: "Susanne Bier", mpaa: "PG-13", genres: ["Fantasy", "Comedy"], theater: "th-ar", format: "Standard", aud: "5", when: "2026-04-18T16:30", ticket: 15.49, concessions: 11.5, rating: 6.8 },
  { id: "s16", title: "The Mandalorian and Grogu", year: 2026, runtime: 130, director: "Jon Favreau", mpaa: "PG", genres: ["Science Fiction", "Adventure"], theater: "th-bc", format: "Dolby", details: "Atmos", plf: true, aud: "Dolby", when: "2026-04-24T18:45", ticket: 21.49, concessions: 20.0, extra: 2, extraCost: 42.98, rating: 8.8 },
  { id: "s17", title: "Verona", year: 2026, runtime: 108, director: "Greta Gerwig", mpaa: "PG-13", genres: ["Romance", "Drama"], theater: "th-cc", format: "Standard", details: "70mm", aud: "1", when: "2026-05-01T20:00", ticket: 15.0, rating: 9.1 },
  { id: "s18", title: "Street Fighter", year: 2026, runtime: 122, director: "Kitao Sakurai", mpaa: "PG-13", genres: ["Action", "Comedy"], theater: "th-fn", format: "Standard", aud: "7", when: "2026-05-08T22:15", ticket: 16.25, rating: 6.5 },
  { id: "s19", title: "Five Nights at Freddy's 2", year: 2025, runtime: 112, director: "Emma Tammi", mpaa: "PG-13", genres: ["Horror", "Mystery"], theater: "th-ar", format: "Standard", aud: "10", when: "2026-05-09T21:00", ticket: 15.49, concessions: 13.0, rating: 6.0 },
  { id: "s20", title: "Ella McCay", year: 2026, runtime: 118, director: "James L. Brooks", mpaa: "PG-13", genres: ["Comedy", "Drama"], theater: "th-bc", format: "Standard", aud: "11", when: "2026-05-15T19:30", ticket: 16.99, rating: 7.6 },
  { id: "s21", title: "The Super Mario Galaxy Movie", year: 2026, runtime: 99, director: "Aaron Horvath", mpaa: "PG", genres: ["Animation", "Adventure"], theater: "th-bc", format: "RealD3D", is3d: true, aud: "8", when: "2026-05-23T12:30", ticket: 22.5, concessions: 24.0, extra: 1, extraCost: 22.5, rating: 8.2 },
  { id: "s22", title: "Resident Evil", year: 2026, runtime: 127, director: "Zach Cregger", mpaa: "R", genres: ["Horror", "Action"], theater: "th-fn", format: "Standard", aud: "6", when: "2026-05-29T22:30", ticket: 16.25, rating: 7.9 },
  { id: "s23", title: "The Devil Wears Prada 2", year: 2026, runtime: 121, director: "David Frankel", mpaa: "PG-13", genres: ["Comedy", "Drama"], theater: "th-bc", format: "Dolby", details: "Atmos", plf: true, aud: "Dolby", when: "2026-06-05T19:15", ticket: 21.49, concessions: 17.0, rating: 8.0 },
  { id: "s24", title: "Toy Story 5", year: 2026, runtime: 105, director: "Andrew Stanton", mpaa: "G", genres: ["Animation", "Comedy"], theater: "th-ar", format: "IMAX", details: "Laser", plf: true, aud: "IMAX", when: "2026-06-13T11:00", ticket: 24.99, concessions: 21.0, extra: 2, extraCost: 49.98, rating: 8.9 },
  // Upcoming (planned)
  { id: "s25", title: "Shrek 5", year: 2026, runtime: 100, director: "Walt Dohrn", mpaa: "PG", genres: ["Animation", "Comedy"], theater: "th-bc", format: "Dolby", details: "Atmos", plf: true, aud: "Dolby", when: "2026-06-26T19:00", ticket: 21.49, upcoming: true },
  { id: "s26", title: "Wuthering Heights", year: 2026, runtime: 130, director: "Emerald Fennell", mpaa: "R", genres: ["Romance", "Drama"], theater: "th-cc", format: "Standard", details: "35mm", aud: "1", when: "2026-07-04T20:30", ticket: 15.0, upcoming: true },
];

function toScreening(s: Seed): Screening {
  return {
    id: s.id,
    user_id: USER,
    tmdb_id: null,
    title: s.title,
    poster_path: null,
    backdrop_path: null,
    release_year: s.year,
    runtime_min: s.runtime,
    director: s.director,
    mpaa_rating: s.mpaa,
    genres: s.genres,
    theater_id: s.theater,
    screen_format: s.format,
    format_details: s.details ?? null,
    is_3d: Boolean(s.is3d),
    is_plf: Boolean(s.plf),
    membership_program_id: s.upcoming ? "pg-alist" : "pg-alist",
    auditorium: s.aud ?? null,
    seat: null,
    showtime: new Date(s.when).toISOString(),
    is_upcoming: Boolean(s.upcoming),
    ticket_value: s.ticket,
    fees_saved: 2.99,
    concessions_spend: s.concessions ?? null,
    misc_spend: s.misc ?? null,
    additional_tickets: s.extra ?? 0,
    additional_tickets_cost: s.extraCost ?? null,
    amount_paid: 0,
    acquisition: "membership",
    rating: s.rating ?? null,
    tags: [],
    notes: null,
    created_at: new Date(s.when).toISOString(),
  };
}

export function buildDemoData() {
  return {
    theaters: DEMO_THEATERS,
    programs: DEMO_PROGRAMS,
    charges: DEMO_CHARGES,
    priceTable: DEMO_PRICE_TABLE,
    screenings: SEED.map(toScreening).sort((a, b) => b.showtime.localeCompare(a.showtime)),
  };
}
