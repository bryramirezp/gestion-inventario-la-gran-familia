import { Database } from './common.types';

export type Donor = Database['public']['Tables']['donors']['Row'];
export type NewDonor = Database['public']['Tables']['donors']['Insert'];

export type DonorType = Database['public']['Tables']['donor_types']['Row'];

export interface DonorAnalysisData extends Donor {
  total_donations_count: number;
  total_value_donated: number;
  average_donation_value: number;
  last_donation_date: string | null;
  top_donated_category: string | null;
  contribution_percentage: number;
}
