// src/services/productService.ts
import { supabase } from '@/utils/supabaseClient';

export interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;
  retailer_id?: string;
  wholesaler_id?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Fetch all active (non-deleted) products
export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return data || [];
};

// Fetch deleted products (for trash view)
export const fetchDeletedProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching deleted products:', error);
    throw error;
  }
  return data || [];
};

// Fetch products by category (only active)
export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
  return data || [];
};

// Add a new product
export const addProduct = async (product: Product): Promise<Product> => {
  console.log('Adding product:', product);
  
  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, is_deleted: false }])
    .select()
    .single();

  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }
  
  console.log('Product added successfully:', data);
  return data;
};

// Update a product
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  console.log('Updating product ID:', id);
  console.log('Update data:', updates);
  
  if (!id) {
    throw new Error('Product ID is required for update');
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  console.log('Product updated successfully:', data);
  return data;
};

// Soft delete a product (mark as deleted)
export const deleteProduct = async (id: string): Promise<void> => {
  console.log('Soft deleting product ID:', id);
  
  if (!id) {
    throw new Error('Product ID is required for deletion');
  }

  const { error } = await supabase
    .from('products')
    .update({ 
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  console.log('Product soft deleted successfully');
};

// Restore a deleted product
export const restoreProduct = async (id: string): Promise<void> => {
  console.log('Restoring product ID:', id);
  
  if (!id) {
    throw new Error('Product ID is required for restoration');
  }

  const { error } = await supabase
    .from('products')
    .update({ 
      is_deleted: false,
      deleted_at: null
    })
    .eq('id', id);

  if (error) {
    console.error('Error restoring product:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  console.log('Product restored successfully');
};

// Permanently delete a product (use with caution!)
export const permanentlyDeleteProduct = async (id: string): Promise<void> => {
  console.log('Permanently deleting product ID:', id);
  
  if (!id) {
    throw new Error('Product ID is required for permanent deletion');
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error permanently deleting product:', error);
    throw error;
  }
  
  console.log('Product permanently deleted');
};