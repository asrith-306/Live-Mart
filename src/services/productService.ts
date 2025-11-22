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
  availability_date?: string;
  region?: string;
}

// ============================================
// NEW: Review Interfaces
// ============================================
// In your productService.ts file, update the ProductReview interface:
export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  order_id?: string;
}

interface AddReviewData {
  order_id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  review_text?: string;
}

// Get current authenticated user
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// Fetch products based on user role
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const user = await getCurrentUser();
    
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    
    const role = userData?.role;
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_deleted', false);
    
    // Filter based on role
    if (role === 'retailer') {
      query = query.eq('retailer_id', user.id);
    } else if (role === 'wholesaler') {
      query = query.eq('wholesaler_id', user.id).is('retailer_id', null);
    }
    // Customers see all active products
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Fetch products by category (for customers)
export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_deleted', false)
      .gt('stock', 0)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Fetch deleted products (trash)
export const fetchDeletedProducts = async (): Promise<Product[]> => {
  try {
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_deleted', true)
      .eq('retailer_id', user.id)
      .order('deleted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching deleted products:', error);
    throw error;
  }
};

// Fetch wholesaler products (for retailers to browse)
export const fetchWholesalerProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('wholesaler_id', 'is', null)
      .is('retailer_id', null)
      .eq('is_deleted', false)
      .gt('stock', 0)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    console.log('Fetched wholesaler products:', data?.length);
    return data || [];
  } catch (error) {
    console.error('Error fetching wholesaler products:', error);
    throw error;
  }
};

// Add retailer product from wholesaler
export const addRetailerProductFromWholesaler = async (
  wholesalerProduct: Product,
  quantity: number,
  sellingPrice: number
): Promise<Product> => {
  try {
    const user = await getCurrentUser();
    
    console.log('=== Starting Order Process ===');
    console.log('User ID:', user.id);
    console.log('Wholesaler Product:', wholesalerProduct);
    console.log('Quantity:', quantity, 'Selling Price:', sellingPrice);
    
    // Validate inputs
    if (!wholesalerProduct.id) throw new Error('Invalid product: missing ID');
    if (!wholesalerProduct.wholesaler_id) throw new Error('Invalid product: missing wholesaler ID');
    if (quantity <= 0) throw new Error('Quantity must be positive');
    if (sellingPrice <= 0) throw new Error('Selling price must be positive');
    if (quantity > (wholesalerProduct.stock || 0)) {
      throw new Error(`Only ${wholesalerProduct.stock} units available`);
    }
    
    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('auth_id', user.id)
      .single();
    
    const userName = userData?.name || user.email?.split('@')[0] || 'Retailer';
    const userEmail = userData?.email || user.email || '';
    
    console.log('User details:', { userName, userEmail });
    
    // 1. Ensure retailer exists in retailers table
    let { data: retailer } = await supabase
      .from('retailers')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    if (!retailer) {
      console.log('Creating retailer record...');
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
        throw retailerError;
      }
      retailer = newRetailer;
      console.log('Created retailer:', retailer);
    }
    
    // 2. Check for existing product
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('retailer_id', user.id)
      .eq('name', wholesalerProduct.name)
      .eq('wholesaler_id', wholesalerProduct.wholesaler_id)
      .eq('is_deleted', false)
      .single();
    
    let finalProduct: Product;
    
    if (existingProduct) {
      // Update existing product
      console.log('Updating existing product...');
      const newStock = existingProduct.stock + quantity;
      
      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update({
          stock: newStock,
          price: sellingPrice,
          cost_price: wholesalerProduct.price
        })
        .eq('id', existingProduct.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      finalProduct = updated;
      console.log('Updated product, new stock:', newStock);
    } else {
      // Create new product
      console.log('Creating new product...');
      const { data: created, error: createError } = await supabase
        .from('products')
        .insert([{
          name: wholesalerProduct.name,
          description: wholesalerProduct.description,
          category: wholesalerProduct.category,
          price: sellingPrice,
          stock: quantity,
          image_url: wholesalerProduct.image_url,
          retailer_id: user.id,
          wholesaler_id: wholesalerProduct.wholesaler_id,
          cost_price: wholesalerProduct.price,
          is_deleted: false,
          //region: wholesalerProduct.region
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      finalProduct = created;
      console.log('Created new product:', finalProduct);
    }
    
    // 3. Update wholesaler stock
    const newWholesalerStock = (wholesalerProduct.stock || 0) - quantity;
    console.log('Updating wholesaler stock to:', newWholesalerStock);
    
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: newWholesalerStock })
      .eq('id', wholesalerProduct.id);
    
    if (stockError) throw stockError;
    
    // 4. Create transaction record
    const totalAmount = (wholesalerProduct.price || 0) * quantity;
    console.log('Creating transaction, total:', totalAmount);
    
    const { error: orderError } = await supabase
      .from('retailer_orders')
      .insert([{
        retailer_id: user.id,
        retailer_name: userName,
        wholesaler_id: wholesalerProduct.wholesaler_id,
        items: [{
          product_id: wholesalerProduct.id,
          product_name: wholesalerProduct.name,
          quantity: quantity,
          unit_price: wholesalerProduct.price,
          total: totalAmount
        }],
        total_amount: totalAmount,
        status: 'completed'
      }]);
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }
    
    // 5. Update retailer stats
    const newTotalOrders = (retailer.total_orders || 0) + 1;
    const newTotalSpent = parseFloat(retailer.total_spent || '0') + totalAmount;
    
    const { error: statsError } = await supabase
      .from('retailers')
      .update({
        total_orders: newTotalOrders,
        total_spent: newTotalSpent
      })
      .eq('id', retailer.id);
    
    if (statsError) {
      console.error('Error updating retailer stats:', statsError);
    }
    
    console.log('=== Order Process Complete ===');
    return finalProduct;
  } catch (error) {
    console.error('Error in addRetailerProductFromWholesaler:', error);
    throw error;
  }
};

// Add new product (for wholesalers)
export const addProduct = async (product: Product): Promise<Product> => {
  try {
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        ...product, 
        wholesaler_id: user.id,
        retailer_id: null,
        is_deleted: false 
      }])
      .select()
      .single();
    
    if (error) throw error;
    console.log('Product added:', data);
    return data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    console.log('Product updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Soft delete
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const { error } = await supabase
      .from('products')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    console.log('Product deleted:', id);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Restore product
export const restoreProduct = async (id: string): Promise<void> => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const { error } = await supabase
      .from('products')
      .update({ 
        is_deleted: false,
        deleted_at: null
      })
      .eq('id', id);
    
    if (error) throw error;
    console.log('Product restored:', id);
  } catch (error) {
    console.error('Error restoring product:', error);
    throw error;
  }
};

// Permanent delete
export const permanentlyDeleteProduct = async (id: string): Promise<void> => {
  try {
    if (!id) throw new Error('Product ID is required');
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    console.log('Product permanently deleted:', id);
  } catch (error) {
    console.error('Error permanently deleting product:', error);
    throw error;
  }
};

// Search products with filters (as per project requirements)
export const searchProducts = async (filters: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  region?: string;
}): Promise<Product[]> => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_deleted', false);
    
    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    
    if (filters.inStock) {
      query = query.gt('stock', 0);
    }
    
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// ============================================
// NEW: Review Functions
// ============================================

// Fetch all reviews for a specific product
export const fetchProductReviews = async (productId: string): Promise<ProductReview[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
};

// Add a new review
export const addReview = async (reviewData: AddReviewData): Promise<ProductReview> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select()
      .single();

    if (error) {
      console.error('Error adding review:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};