import { supabase } from '../utils/supabaseClient';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface CalendarEvent {
  orderId: string;
  customerEmail: string;
  retailerEmail: string;
  deliveryDate: string;
  deliveryAddress: string;
  orderTotal: number;
  customerName?: string;
}

// Get user's calendar token from database
async function getCalendarToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_calendar_tokens')
    .select('access_token, token_expiry')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('No calendar token found:', error);
    return null;
  }

  // Check if token is expired
  if (data.token_expiry && new Date(data.token_expiry) < new Date()) {
    console.error('Token expired');
    return null;
  }

  return data.access_token;
}

// Save calendar token to database
export async function saveCalendarToken(userId: string, accessToken: string, expiresIn: number) {
  const expiryDate = new Date();
  expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);

  const { error } = await supabase
    .from('user_calendar_tokens')
    .upsert({
      user_id: userId,
      access_token: accessToken,
      token_expiry: expiryDate.toISOString(),
    });

  if (error) {
    console.error('Failed to save token:', error);
    throw error;
  }
}

// Create calendar event for customer
export async function createCustomerCalendarEvent(
  accessToken: string,
  eventData: CalendarEvent
): Promise<string | null> {
  // Ensure delivery date is exactly 7 days from order date
  const deliveryDateTime = new Date(eventData.deliveryDate);
  const deliveryEndTime = new Date(deliveryDateTime);
  deliveryEndTime.setHours(deliveryEndTime.getHours() + 2); // 2 hour delivery window

  const event = {
    summary: `🛒 Live MART Delivery - Order #${eventData.orderId.slice(0, 8)}`,
    description: `Your order will be delivered!\n\nOrder Total: ₹${eventData.orderTotal}\nDelivery Address: ${eventData.deliveryAddress}\n\n✅ Standard 7-day delivery\n\nThank you for shopping with Live MART!`,
    location: eventData.deliveryAddress,
    start: {
      dateTime: deliveryDateTime.toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: deliveryEndTime.toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
        { method: 'popup', minutes: 10 }, // 10 minutes before
      ],
    },
    attendees: [
      { email: eventData.customerEmail },
    ],
  };

  try {
    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating customer calendar event:', error);
    return null;
  }
}

// Create calendar event for retailer
export async function createRetailerCalendarEvent(
  accessToken: string,
  eventData: CalendarEvent
): Promise<string | null> {
  const event = {
    summary: `📦 Delivery - Order #${eventData.orderId.slice(0, 8)}`,
    description: `Deliver order to customer\n\nCustomer: ${eventData.customerName || eventData.customerEmail}\nOrder Total: ₹${eventData.orderTotal}\nDelivery Address: ${eventData.deliveryAddress}\n\nLive MART`,
    location: eventData.deliveryAddress,
    start: {
      dateTime: new Date(eventData.deliveryDate).toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: new Date(new Date(eventData.deliveryDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 120 }, // 2 hours before
      ],
    },
    colorId: '11', // Red color for retailer visibility
  };

  try {
    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to create retailer calendar event');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating retailer calendar event:', error);
    return null;
  }
}

// Update calendar event
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  newDate: string
): Promise<boolean> {
  const event = {
    start: {
      dateTime: new Date(newDate).toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: new Date(new Date(newDate).getTime() + 2 * 60 * 60 * 1000).toISOString(),
      timeZone: 'Asia/Kolkata',
    },
  };

  try {
    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

// Delete calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}