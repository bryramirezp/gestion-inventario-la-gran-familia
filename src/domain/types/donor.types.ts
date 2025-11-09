import { Database } from './common.types';

export type Donor = Database['public']['Tables']['donors']['Row'];
export type NewDonor = Database['public']['Tables']['donors']['Insert'];

export type DonorType = Database['public']['Tables']['donor_types']['Row'];

export interface DonorAnalysisData extends Donor {
  total_donations_count: number;
  total_value_donated: number;
  total_market_value: number;
  average_donation_value: number;
  last_donation_date: string | null;
  first_donation_date: string | null;
  top_donated_category: string | null;
  contribution_percentage: number;
  donation_frequency_days: number | null;
  relationship_duration_days: number | null;
  recent_donations_count: number;
  market_vs_actual_ratio: number;
  ranking_position: number;
}
