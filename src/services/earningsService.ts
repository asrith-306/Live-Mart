// src/services/earningsService.ts
import { supabase } from '@/utils/supabaseClient';

export interface EarningsData {
  totalEarnings: number;
  totalOrders: number;
  pendingEarnings: number;
}

// ============ RETAILER EARNINGS (using RPC) ============
export const fetchRetailerEarnings = async (): Promise<EarningsData> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('Fetching retailer earnings for:', user.id);

  const { data, error } = await supabase.rpc('get_retailer_earnings', {
    p_retailer_id: user.id
  });

  if (error) {
    console.error('Error fetching retailer earnings:', error);
    throw error;
  }

  console.log('Retailer earnings result:', data);

  return {
    totalEarnings: Number(data?.totalEarnings) || 0,
    pendingEarnings: Number(data?.pendingEarnings) || 0,
    totalOrders: Number(data?.totalOrders) || 0
  };
};

// ============ WHOLESALER EARNINGS (using RPC) ============
export const fetchWholesalerEarnings = async (): Promise<EarningsData> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('Fetching wholesaler earnings for:', user.id);

  const { data, error } = await supabase.rpc('get_wholesaler_earnings', {
    p_wholesaler_id: user.id
  });

  if (error) {
    console.error('Error fetching wholesaler earnings:', error);
    throw error;
  }

  console.log('Wholesaler earnings result:', data);

  return {
    totalEarnings: Number(data?.totalEarnings) || 0,
    pendingEarnings: Number(data?.pendingEarnings) || 0,
    totalOrders: Number(data?.totalOrders) || 0
  };
};