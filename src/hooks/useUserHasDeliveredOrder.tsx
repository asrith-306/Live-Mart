// src/hooks/useUserHasDeliveredOrder.tsx - DEBUG VERSION
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useUserHasDeliveredOrder(productId: string | undefined): boolean {
  const [hasDeliveredOrder, setHasDeliveredOrder] = useState(false);

  useEffect(() => {
    if (!productId) {
      console.log('❌ [useUserHasDeliveredOrder] No productId');
      setHasDeliveredOrder(false);
      return;
    }

    const checkDeliveredOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('❌ [useUserHasDeliveredOrder] No user logged in');
          setHasDeliveredOrder(false);
          return;
        }

        console.log('🔍 [useUserHasDeliveredOrder] User ID:', user.id);
        console.log('🔍 [useUserHasDeliveredOrder] Product ID:', productId);

        // Step 1: Get ALL orders for this user (to see what statuses exist)
        const { data: allOrders, error: allError } = await supabase
          .from('orders')
          .select(`
            id,
            delivery_status,
            customer_id,
            order_items (
              product_id
            )
          `)
          .eq('customer_id', user.id);

        if (allError) {
          console.error('❌ [useUserHasDeliveredOrder] Error fetching all orders:', allError);
        } else {
          console.log('📦 [useUserHasDeliveredOrder] ALL orders:', allOrders);
          console.log('📦 [useUserHasDeliveredOrder] All delivery statuses:', 
            allOrders?.map(o => `"${o.delivery_status}"`).join(', ')
          );
          
          // Check if any order contains this product
          const ordersWithProduct = allOrders?.filter(order => 
            order.order_items?.some((item: any) => item.product_id === productId)
          );
          console.log('🎯 [useUserHasDeliveredOrder] Orders containing this product:', ordersWithProduct);
        }

        // Step 2: Now try to get delivered orders
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

        console.log('✅ [useUserHasDeliveredOrder] Orders with status "delivered":', orders);

        if (error) {
          console.error('❌ [useUserHasDeliveredOrder] Error:', error);
          setHasDeliveredOrder(false);
          return;
        }

        const hasProduct = orders?.some(order => 
          order.order_items?.some((item: any) => item.product_id === productId)
        );
        
        console.log('🎯 [useUserHasDeliveredOrder] Final result - hasDeliveredOrder:', hasProduct);
        setHasDeliveredOrder(hasProduct || false);
      } catch (error) {
        console.error('❌ [useUserHasDeliveredOrder] Exception:', error);
        setHasDeliveredOrder(false);
      }
    };

    checkDeliveredOrder();
  }, [productId]);

  return hasDeliveredOrder;
}