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
  cost_price?: number;
  retailer_price?: number;
  original_wholesaler_product_id?: string; // Track which wholesaler product this came from
}

// Fetch all active (non-deleted) products for current retailer
export const fetchProducts = async (): Promise<Product[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_deleted', false)
    .eq('retailer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return data || [];
};

// Fetch deleted products (for trash view)
export const fetchDeletedProducts = async (): Promise<Product[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_deleted', true)
    .eq('retailer_id', user.id)
    .order('deleted_at', { ascending: false });

  if (error) {
    console.error('Error fetching deleted products:', error);
    throw error;
  }
  return data || [];
};

// Fetch all wholesaler products (available for retailers to add)
// IMPORTANT: Only show products that belong to wholesalers (no retailer_id)
export const fetchWholesalerProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .not('wholesaler_id', 'is', null)  // Must have a wholesaler
    .is('retailer_id', null)            // Must NOT be a retailer product
    .eq('is_deleted', false)
    .gt('stock', 0)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wholesaler products:', error);
    throw error;
  }
  
  console.log('Fetched wholesaler products:', data);
  return data || [];
};

// Add retailer product from wholesaler inventory
export const addRetailerProductFromWholesaler = async (
  wholesalerProduct: Product,
  retailerStock: number,
  retailerPrice: number
): Promise<Product> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  // Check if wholesaler has enough stock
  if (!wholesalerProduct.stock || wholesalerProduct.stock < retailerStock) {
    throw new Error(`Insufficient stock. Only ${wholesalerProduct.stock} available.`);
  }

  console.log('Starting order process:', {
    wholesalerId: wholesalerProduct.wholesaler_id,
    productName: wholesalerProduct.name,
    requestedStock: retailerStock,
    availableStock: wholesalerProduct.stock
  });

  // Get user details
  const { data: userData } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single();

  const userEmail = userData?.email || user.email || '';
  const userName = userData?.name || userEmail.split('@')[0] || 'Retailer';

  // 1. Ensure retailer exists in retailers table
  let { data: existingRetailer } = await supabase
    .from('retailers')
    .select('*')
    .eq('email', userEmail)
    .single();

  if (!existingRetailer) {
    console.log('Creating new retailer record...');
    const { data: newRetailer, error: retailerError } = await supabase
      .from('retailers')
      .insert([{
        name: userName,
        email: userEmail,
        phone: '',
        address: '',
        total_orders: 0,
        total_spent: 0,
        status: 'active'
      }])
      .select()
      .single();

    if (retailerError) {
      console.error('Error creating retailer:', retailerError);
    } else {
      existingRetailer = newRetailer;
      console.log('Created retailer:', newRetailer);
    }
  }

  // 2. Check if retailer already has this product (avoid duplicates)
  const { data: existingRetailerProduct } = await supabase
    .from('products')
    .select('*')
    .eq('retailer_id', user.id)
    .eq('name', wholesalerProduct.name)
    .eq('wholesaler_id', wholesalerProduct.wholesaler_id)
    .eq('is_deleted', false)
    .single();

  let newProduct: Product;

  if (existingRetailerProduct) {
    // Update existing product - add to stock
    console.log('Updating existing retailer product...');
    const newStock = existingRetailerProduct.stock + retailerStock;
    
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        stock: newStock,
        price: retailerPrice, // Update price if different
        cost_price: wholesalerProduct.price,
        retailer_price: retailerPrice
      })
      .eq('id', existingRetailerProduct.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating retailer product:', updateError);
      throw updateError;
    }

    newProduct = updatedProduct;
    console.log('Updated product stock:', { old: existingRetailerProduct.stock, new: newStock });
  } else {
    // Create new retailer product
    console.log('Creating new retailer product...');
    const { data: createdProduct, error: insertError } = await supabase
      .from('products')
      .insert([{
        name: wholesalerProduct.name,
        description: wholesalerProduct.description,
        category: wholesalerProduct.category,
        price: retailerPrice,
        stock: retailerStock,
        image_url: wholesalerProduct.image_url,
        retailer_id: user.id,
        wholesaler_id: wholesalerProduct.wholesaler_id,
        cost_price: wholesalerProduct.price,
        retailer_price: retailerPrice,
        is_deleted: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating retailer product:', insertError);
      throw insertError;
    }

    newProduct = createdProduct;
    console.log('Created new product:', createdProduct);
  }

  // 3. Reduce wholesaler stock
  const newWholesalerStock = wholesalerProduct.stock - retailerStock;
  console.log('Updating wholesaler stock:', { old: wholesalerProduct.stock, new: newWholesalerStock });
  
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      stock: newWholesalerStock 
    })
    .eq('id', wholesalerProduct.id);

  if (updateError) {
    console.error('Error updating wholesaler stock:', updateError);
    throw updateError;
  }

  // 4. Create transaction record
  const totalAmount = wholesalerProduct.price * retailerStock;
  
  const { data: orderData, error: orderError } = await supabase
    .from('retailer_orders')
    .insert([{
      retailer_id: user.id,
      retailer_name: userName,
      wholesaler_id: wholesalerProduct.wholesaler_id,
      items: [{
        product_id: wholesalerProduct.id,
        product_name: wholesalerProduct.name,
        quantity: retailerStock,
        unit_price: wholesalerProduct.price,
        total: totalAmount
      }],
      total_amount: totalAmount,
      status: 'completed'
    }])
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order record:', orderError);
  } else {
    console.log('Created order:', orderData);
  }

  // 5. Update retailer stats
  if (existingRetailer) {
    const newTotalOrders = (existingRetailer.total_orders || 0) + 1;
    const newTotalSpent = (parseFloat(existingRetailer.total_spent || '0') + totalAmount);

    const { error: updateRetailerError } = await supabase
      .from('retailers')
      .update({
        total_orders: newTotalOrders,
        total_spent: newTotalSpent
      })
      .eq('id', existingRetailer.id);

    if (updateRetailerError) {
      console.error('Error updating retailer stats:', updateRetailerError);
    } else {
      console.log('Updated retailer stats:', { orders: newTotalOrders, spent: newTotalSpent });
    }
  }

  console.log('✅ Order completed successfully!');
  return newProduct;
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

// Add a new product (for wholesaler or retailer)
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
    throw error;
  }
  
  console.log('Product restored successfully');
};

// Permanently delete a product
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