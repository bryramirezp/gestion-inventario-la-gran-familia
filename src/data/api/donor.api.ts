import { Donor, NewDonor, DonorType, DonorAnalysisData, Donation } from '@/domain/types';
import { supabase } from './client';
import { donationApi } from './donation.api';
import { productApi, categoryApi } from './product.api';

const baseDonorApi = {
  getAll: async (_token: string): Promise<Donor[]> => {
    const { data, error } = await supabase.from('donors').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },
  getById: async (token: string, id: number): Promise<Donor | undefined> => {
    const { data, error } = await supabase.from('donors').select('*').eq('donor_id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },
  create: async (token: string, newItem: NewDonor): Promise<Donor> => {
    const { data, error } = await supabase.from('donors').insert(newItem).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  update: async (
    token: string,
    id: number,
    updates: Partial<NewDonor>
  ): Promise<Donor | undefined> => {
    const { data, error } = await supabase
      .from('donors')
      .update(updates)
      .eq('donor_id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  delete: async (token: string, id: number): Promise<boolean> => {
    const { error } = await supabase.from('donors').delete().eq('donor_id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};

const getDonorAnalysisData = async (
  token: string,
  donors: Donor[],
  transactions: Donation[]
): Promise<DonorAnalysisData[]> => {
  const [products, categories] = await Promise.all([
    productApi.getAll(token),
    categoryApi.getAll(token),
  ]);

  const productMap = new Map(products.map((p) => [p.product_id, { category_id: p.category_id }]));
  const categoryMap = new Map(categories.map((c) => [c.category_id, c.category_name]));

  const grandTotalValue = transactions.reduce(
    (sum, t) => sum + (t.total_actual_value || 0),
    0
  );

  const analysis = donors.map((donor) => {
    const donorTransactions = transactions.filter((t) => t.donor_id === donor.donor_id);

    if (donorTransactions.length === 0) {
      return {
        ...donor,
        total_donations_count: 0,
        total_value_donated: 0,
        average_donation_value: 0,
        last_donation_date: null,
        top_donated_category: 'N/A',
        contribution_percentage: 0,
      };
    }

    const total_value_donated = donorTransactions.reduce(
      (sum, t) => sum + (t.total_actual_value || 0),
      0
    );

    const categoryCounts: Record<string, number> = {};
    donorTransactions.forEach((t) => {
      t.items.forEach((item) => {
        const productInfo = productMap.get(item.product_id);
        if (productInfo) {
          const categoryName = categoryMap.get(productInfo.category_id);
          if (categoryName) {
            categoryCounts[categoryName] =
              (categoryCounts[categoryName] || 0) + Number(item.current_quantity);
          }
        }
      });
    });

    return {
      ...donor,
      total_donations_count: donorTransactions.length,
      total_value_donated,
      average_donation_value: total_value_donated / donorTransactions.length,
      last_donation_date: donorTransactions.sort(
        (a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime()
      )[0].donation_date,
      contribution_percentage:
        grandTotalValue > 0 ? (total_value_donated / grandTotalValue) * 100 : 0,
      top_donated_category:
        Object.keys(categoryCounts).length > 0
          ? Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A',
    };
  });

  return analysis;
};

export const donorApi = {
  ...baseDonorApi,
  getAnalysis: async (token: string): Promise<DonorAnalysisData[]> => {
    const [donors, transactions] = await Promise.all([
      baseDonorApi.getAll(token),
      donationApi.getHistory(token),
    ]);
    const analysis = await getDonorAnalysisData(token, donors, transactions);
    return analysis;
  },
  getByIdWithDetails: async (
    token: string,
    id: number
  ): Promise<{ donor: Donor; analysis: DonorAnalysisData; donations: Donation[] } | null> => {
    const [donor, allDonors, allTransactions] = await Promise.all([
      baseDonorApi.getById(token, id),
      baseDonorApi.getAll(token),
      donationApi.getHistory(token),
    ]);

    if (!donor) return null;

    const analysisData = await getDonorAnalysisData(token, allDonors, allTransactions);
    const donorAnalysis = analysisData.find((d) => d.donor_id === id);
    const donorDonations = allTransactions.filter((t) => t.donor_id === id);

    return { donor, analysis: donorAnalysis!, donations: donorDonations };
  },
};

export const getDonorTypes = async (_token: string): Promise<DonorType[]> => {
  const { data, error } = await supabase.from('donor_types').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};
