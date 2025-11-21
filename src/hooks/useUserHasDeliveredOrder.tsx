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
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            delivery_status,
            order_items (
              product_id
            )
          `)
          .eq('customer_id', user.id)
          .eq('delivery_status', 'delivered');

        if (error) {
          console.error('Error checking delivered order:', error);
          setHasDeliveredOrder(false);
          return;
        }

        // Check if any delivered order contains this product
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