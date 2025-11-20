// hooks/useUserHasDeliveredOrder.ts
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useUserHasDeliveredOrder(productId: string | undefined): boolean {
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);

  useEffect(() => {
    if (!productId) {
      setHasDeliveredOrder(false);
      return;
    }

    const checkDeliveredOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setHasDeliveredOrder(false);
          return;
        }

        // Check if user has any delivered order containing this product
        // Using a simpler query approach that works with Supabase
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_items (
              product_id
            )
          `)
          .eq('customer_id', user.id)
          .or('status.eq.delivered,delivery_status.eq.delivered');

        if (error) {
          console.error('Error checking delivered order:', error);
          setHasDeliveredOrder(false);
          return;
        }

        // Check if any order contains this product
        const hasProduct = orders?.some(order => 
          order.order_items?.some((item: any) => item.product_id === productId)
        );
        
        setHasDeliveredOrder(hasProduct || false);
      } catch (error) {
        console.error('Error checking delivered order:', error);
        setHasDeliveredOrder(false);
      }
    };

    checkDeliveredOrder();
  }, [productId]);

  return hasDeliveredOrder;
}