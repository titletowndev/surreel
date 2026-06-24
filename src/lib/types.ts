/**
 * Database row types — mirror the SQL schema exactly. No `any` on data models.
 * Money fields are numeric dollars in the DB; the engine converts to cents.
 */

export type Chain = "AMC" | "Regal" | "Other";

export type ScreenFormat =
  | "Standard"
  | "IMAX"
  | "Dolby"
  | "RealD3D"
  | "PLF"
  | "ScreenX"
  | "Prime at AMC"
  | "Other";

export type ChargeSource = "auto" | "manual" | "onboarding";

export const ACQUISITIONS = [
  "membership",
  "voucher",
  "full_price",
  "comp",
  "other",
] as const;
export type Acquisition = (typeof ACQUISITIONS)[number];

export interface Theater {
  id: string;
  user_id: string;
  name: string;
  chain: Chain;
  city: string | null;
  state: string | null;
  created_at: string;
}

export interface MembershipProgram {
  id: string;
  user_id: string;
  name: string;
  use_historical_state_pricing: boolean;
  state: string | null;
  billing_day: number;
  monthly_fee: number;
  is_paused: boolean;
  start_date: string; // ISO date (yyyy-mm-dd)
  created_at: string;
}

export interface MembershipCharge {
  id: string;
  user_id: string;
  program_id: string;
  charge_date: string; // ISO date
  amount: number;
  source: ChargeSource;
  created_at: string;
}

export interface Screening {
  id: string;
  user_id: string;

  tmdb_id: number | null;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_year: number | null;
  runtime_min: number | null;
  director: string | null;
  mpaa_rating: string | null;
  genres: string[];

  theater_id: string | null;
  screen_format: ScreenFormat;
  format_details: string | null;
  is_3d: boolean;
  is_plf: boolean;
  membership_program_id: string | null;
  auditorium: string | null;
  seat: string | null;

  showtime: string; // ISO timestamptz
  is_upcoming: boolean;

  ticket_value: number;
  fees_saved: number;
  concessions_spend: number | null;
  misc_spend: number | null;
  additional_tickets: number;
  additional_tickets_cost: number | null;
  additional_tickets_value: number | null;

  amount_paid: number;
  acquisition: Acquisition | null;

  rating: number | null;
  tags: string[];
  notes: string | null;

  created_at: string;
}

export interface AmcStatePrice {
  state: string;
  effective_from: string;
  monthly_price: number;
  tier: string | null;
}

/** Insert payloads (DB fills id / user_id / created_at / defaults). */
export type ScreeningInput = Omit<Screening, "id" | "user_id" | "created_at">;
export type TheaterInput = Omit<Theater, "id" | "user_id" | "created_at">;
export type ProgramInput = Omit<MembershipProgram, "id" | "user_id" | "created_at">;
export type ChargeInput = Omit<MembershipCharge, "id" | "user_id" | "created_at">;

/** All US state codes used by the pricing table and theater entry. */
export const US_STATES: readonly string[] = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
];

export const SCREEN_FORMATS: readonly ScreenFormat[] = [
  "Standard","IMAX","Dolby","RealD3D","PLF","ScreenX","Prime at AMC","Other",
];

export const CHAINS: readonly Chain[] = ["AMC", "Regal", "Other"];
