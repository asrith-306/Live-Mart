import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { createCustomerCalendarEvent, createRetailerCalendarEvent } from '../services/googleCalendarService';

interface Order {
  id: string;
  customer_id: string;
  total_price: number;
  delivery_address: string;
  phone: string;
  status: string;
  delivery_date?: string;
  created_at?: string;
}

interface RetailerDeliverySchedulerProps {
  order: Order;
  onScheduled: () => void;
}

export default function RetailerDeliveryScheduler({ order, onScheduled }: RetailerDeliverySchedulerProps) {
  const [loading, setLoading] = useState(false);

  // Calculate delivery date - 7 days from order creation
  const deliveryDate = new Date(order.created_at || Date.now());
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  deliveryDate.setHours(14, 0, 0, 0); // Default delivery time: 2:00 PM

  const handleSchedule = async () => {

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login');
        return;
      }

      // Get retailer's calendar token
      const { data: retailerToken } = await supabase
        .from('user_calendar_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      // Get customer details
      const { data: customerData } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', order.customer_id)
        .single();

      // Get customer's calendar token
      const { data: customerToken } = await supabase
        .from('user_calendar_tokens')
        .select('access_token')
        .eq('user_id', order.customer_id)
        .single();

      const eventData = {
        orderId: order.id,
        customerEmail: customerData?.email || 'customer@example.com',
        retailerEmail: user.email || 'retailer@example.com',
        deliveryDate: deliveryDate.toISOString(),
        deliveryAddress: order.delivery_address,
        orderTotal: order.total_price,
      };

      let customerEventId = null;
      let retailerEventId = null;

      // Create calendar event for customer (if they connected)
      if (customerToken?.access_token) {
        customerEventId = await createCustomerCalendarEvent(
          customerToken.access_token,
          eventData
        );
      }

      // Create calendar event for retailer (if connected)
      if (retailerToken?.access_token) {
        retailerEventId = await createRetailerCalendarEvent(
          retailerToken.access_token,
          eventData
        );
      }

      // Update order with delivery date and calendar event IDs
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_date: deliveryDate.toISOString(),
          assigned_retailer_id: user.id,
          customer_calendar_event_id: customerEventId,
          retailer_calendar_event_id: retailerEventId,
          status: 'confirmed',
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      alert('✅ Delivery scheduled successfully! Calendar reminders sent.');
      onScheduled();
    } catch (error) {
      console.error('Error scheduling delivery:', error);
      alert('Failed to schedule delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-bold text-lg mb-4">📅 Confirm Delivery Schedule</h3>
      
      <div className="space-y-4">
        {/* Auto-calculated Delivery Date Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2">📦 Scheduled Delivery Date</p>
          <p className="text-2xl font-bold text-blue-600">
            {deliveryDate.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            ⏰ Time: 2:00 PM - 4:00 PM
          </p>
          <p className="text-xs text-gray-600 mt-2">
            ✅ Standard 7-day delivery from order date
          </p>
        </div>

        <div className="bg-gray-50 rounded p-3 text-sm">
          <p><strong>Order:</strong> #{order.id.slice(0, 8)}</p>
          <p><strong>Amount:</strong> ₹{order.total_price}</p>
          <p><strong>Address:</strong> {order.delivery_address}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          <p><strong>Status:</strong> <span className="capitalize text-orange-600">{order.status}</span></p>
        </div>

        <button
          onClick={handleSchedule}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Confirming...' : '✅ Confirm & Send Calendar Reminders'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          📧 Both you and the customer will receive calendar reminders via email
        </p>
      </div>
    </div>
  );
}