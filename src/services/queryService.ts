// src/services/queryService.ts
import { supabase } from '@/utils/supabaseClient';

export type QueryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type QueryPriority = 'low' | 'medium' | 'high';

export interface Query {
  id: string;
  customer_id: string;
  customer_name?: string;
  retailer_id?: string;
  retailer_name?: string;
  subject: string;
  message: string;
  status: QueryStatus;
  priority: QueryPriority;
  order_id?: string;
  order_number?: string;
  product_id?: string;
  product_name?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryResponse {
  id: string;
  query_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

// Create a new query
export async function createQuery(
  subject: string,
  message: string,
  priority: QueryPriority = 'medium',
  orderId?: string,
  productId?: string
): Promise<Query> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user details from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    // Insert the query
    const { data, error } = await supabase
      .from('queries')
      .insert({
        customer_id: userData.id,
        subject,
        message,
        priority,
        status: 'open',
        order_id: orderId || null,
        product_id: productId || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating query:', error);
    throw error;
  }
}

// Fetch queries for customer
export async function fetchCustomerQueries(): Promise<Query[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) throw new Error('User not found');

    const { data, error } = await supabase
      .from('queries')
      .select(`
        *,
        orders(order_number),
        products(name)
      `)
      .eq('customer_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to include order_number and product_name
    return (data || []).map(query => ({
      ...query,
      order_number: query.orders?.order_number,
      product_name: query.products?.name
    }));
  } catch (error) {
    console.error('Error fetching customer queries:', error);
    throw error;
  }
}

// Fetch queries for retailer
export async function fetchRetailerQueries(): Promise<Query[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) throw new Error('User not found');

    const { data, error } = await supabase
      .from('queries')
      .select(`
        *,
        customer:users!queries_customer_id_fkey(name),
        orders(order_number),
        products(name)
      `)
      .or(`retailer_id.eq.${userData.id},retailer_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(query => ({
      ...query,
      customer_name: query.customer?.name || 'Unknown Customer',
      order_number: query.orders?.order_number,
      product_name: query.products?.name
    }));
  } catch (error) {
    console.error('Error fetching retailer queries:', error);
    throw error;
  }
}

// Fetch single query by ID
export async function fetchQueryById(queryId: string): Promise<Query> {
  try {
    const { data, error } = await supabase
      .from('queries')
      .select(`
        *,
        customer:users!queries_customer_id_fkey(name),
        retailer:users!queries_retailer_id_fkey(name),
        orders(order_number),
        products(name)
      `)
      .eq('id', queryId)
      .single();

    if (error) throw error;

    return {
      ...data,
      customer_name: data.customer?.name || 'Unknown Customer',
      retailer_name: data.retailer?.name,
      order_number: data.orders?.order_number,
      product_name: data.products?.name
    };
  } catch (error) {
    console.error('Error fetching query:', error);
    throw error;
  }
}

// Fetch responses for a query
export async function fetchQueryResponses(queryId: string): Promise<QueryResponse[]> {
  try {
    const { data, error } = await supabase
      .from('query_responses')
      .select(`
        *,
        user:users(name, role)
      `)
      .eq('query_id', queryId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(response => ({
      ...response,
      user_name: response.user?.name || 'Unknown User',
      user_role: response.user?.role || 'unknown'
    }));
  } catch (error) {
    console.error('Error fetching query responses:', error);
    throw error;
  }
}

// Add a response to a query
export async function addQueryResponse(queryId: string, message: string): Promise<QueryResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) throw new Error('User not found');

    // If this is the first response from a retailer, assign them to the query
    if (userData.role === 'retailer') {
      const { data: queryData } = await supabase
        .from('queries')
        .select('retailer_id, status')
        .eq('id', queryId)
        .single();

      if (queryData && !queryData.retailer_id) {
        await supabase
          .from('queries')
          .update({ 
            retailer_id: userData.id,
            status: 'in_progress'
          })
          .eq('id', queryId);
      } else if (queryData && queryData.status === 'open') {
        await supabase
          .from('queries')
          .update({ status: 'in_progress' })
          .eq('id', queryId);
      }
    }

    // Add the response
    const { data, error } = await supabase
      .from('query_responses')
      .insert({
        query_id: queryId,
        user_id: userData.id,
        message
      })
      .select()
      .single();

    if (error) throw error;

    // Update query's updated_at timestamp
    await supabase
      .from('queries')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', queryId);

    return {
      ...data,
      user_name: 'You',
      user_role: userData.role
    };
  } catch (error) {
    console.error('Error adding query response:', error);
    throw error;
  }
}

// Update query status
export async function updateQueryStatus(queryId: string, status: QueryStatus): Promise<void> {
  try {
    const { error } = await supabase
      .from('queries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', queryId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating query status:', error);
    throw error;
  }
}