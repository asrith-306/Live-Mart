import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useUserHasDeliveredOrder(productId: string | undefined): boolean {
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);

  useEffect(() => {
    if (!productId) {
      setHasDeliveredOrder(false);
      return;
    }

    checkDeliveredOrder();
  }, [productId]);

  const checkDeliveredOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHasDeliveredOrder(false);
        return;
      }

      // Check if user has any delivered order containing this product
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_items!inner(product_id)
        `)
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .eq('order_items.product_id', productId)
        .limit(1);

      if (error) throw error;
      
      setHasDeliveredOrder(data && data.length > 0);
    } catch (error) {
      console.error('Error checking delivered order:', error);
      setHasDeliveredOrder(false);
    }
  };

  return hasDeliveredOrder;
}