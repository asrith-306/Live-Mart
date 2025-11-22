// src/pages/ProductDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabaseClient';
import { Product } from '@/services/productService';
import ProductReviews from '@/components/products/ProductReviews';
import { useCart } from '@/context/CartContext';

interface ProductWithRetailer extends Product {
  retailer_name?: string;
  retailer_rating?: number;
  retailer_id?: string;
}

interface OtherRetailer {
  product_id: string;
  retailer_id: string;
  retailer_name: string;
  price: number;
  stock: number;
  rating: number;
}

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<ProductWithRetailer | null>(null);
  const [otherRetailers, setOtherRetailers] = useState<OtherRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('reviews');
  const [userId, setUserId] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [userHasDeliveredOrder, setUserHasDeliveredOrder] = useState(false);

  const productImages = product?.image_url ? [
    product.image_url,
    product.image_url,
    product.image_url,
    product.image_url
  ] : [];

  useEffect(() => {
    fetchProductDetails();
    fetchUserInfo();
  }, [productId]);

  const fetchUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Check if user has a delivered order for this product
      if (productId) {
        const { data: orders } = await supabase
          .from('orders')
          .select(`id, delivery_status, order_items (product_id)`)
          .eq('customer_id', user.id)
          .eq('delivery_status', 'delivered');

        const hasDelivered = orders?.some(order =>
          order.order_items?.some((item: any) => item.product_id === productId)
        ) || false;
        setUserHasDeliveredOrder(hasDelivered);
      }
    }
  };

  const fetchProductDetails = async () => {
    if (!productId) return;

    try {
      setLoading(true);

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (productData.retailer_id) {
        const { data: retailer } = await supabase
          .from('retailers')
          .select('name, rating')
          .eq('id', productData.retailer_id)
          .single();

        setProduct({
          ...productData,
          retailer_name: retailer?.name || 'Unknown Retailer',
          retailer_rating: retailer?.rating || 0
        });

        const { data: otherProducts } = await supabase
          .from('products')
          .select('id, retailer_id, price, stock')
          .eq('name', productData.name)
          .neq('id', productId);

        if (otherProducts && otherProducts.length > 0) {
          const retailersData = await Promise.all(
            otherProducts.map(async (prod) => {
              const { data: ret } = await supabase
                .from('retailers')
                .select('name, rating')
                .eq('id', prod.retailer_id)
                .single();

              return {
                product_id: prod.id,
                retailer_id: prod.retailer_id,
                retailer_name: ret?.name || 'Unknown',
                price: prod.price,
                stock: prod.stock,
                rating: ret?.rating || 0
              };
            })
          );

          setOtherRetailers(retailersData);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
    const stars = [];
    const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`${i <= rating ? 'text-yellow-400' : 'text-gray-300'} ${sizeClasses[size]}`}>
          ★
        </span>
      );
    }
    return <div className="flex items-center">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="text-sm text-gray-600">
            <button onClick={() => navigate('/')} className="hover:text-orange-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/')} className="hover:text-orange-600">{product.category}</button>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                <img src={productImages[selectedImage] || product.image_url} alt={product.name} className="max-w-full max-h-full object-contain" />
              </div>

              {productImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${selectedImage === idx ? 'border-orange-500 shadow-md' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'details' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Product Details
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'reviews' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Customer Reviews
                </button>
              </div>

              <div className="mt-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">About this item</h3>
                      <p className="text-gray-700 leading-relaxed">{product.description || 'No detailed description available.'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Specifications</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="font-medium">Category:</span> {product.category}</div>
                        <div><span className="font-medium">Stock:</span> {product.stock} units</div>
                        <div><span className="font-medium">Price:</span> ₹{product.price}</div>
                        <div><span className="font-medium">Product ID:</span> {product.id?.substring(0, 8)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && userId && product.id && (
                  <ProductReviews
                    productId={product.id}
                    productName={product.name}
                    onClose={() => setActiveTab('details')}
                    userHasDeliveredOrder={userHasDeliveredOrder}
                  />
                )}

                {activeTab === 'reviews' && !userId && (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <p className="text-xl font-semibold text-gray-800 mb-2">Login Required</p>
                    <p className="text-gray-600 mb-4">Please log in to view and submit reviews</p>
                    <button onClick={() => navigate('/login')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg">
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>

              <div className="border-t pt-4">
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs text-gray-600">Deal Price:</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-red-600">₹{product.price}</span>
                  </div>
                </div>

                <div className="mb-4">
                  {product.stock > 0 ? (
                    <div className="text-green-700 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      In Stock ({product.stock} available)
                    </div>
                  ) : (
                    <div className="text-red-600 font-semibold">Out of Stock</div>
                  )}
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Sold by</div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-600">{product.retailer_name}</span>
                    {product.retailer_rating && product.retailer_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <StarRating rating={Math.round(product.retailer_rating)} size="sm" />
                        <span className="text-xs text-gray-600">({product.retailer_rating.toFixed(1)})</span>
                      </div>
                    )}
                  </div>
                </div>

                {product.stock > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Quantity:</label>
                    <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                      {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    disabled={product.stock === 0}
                    onClick={handleAddToCart}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${product.stock > 0 ? addedToCart ? 'bg-green-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    {addedToCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
                  </button>
                  <button
                    disabled={product.stock === 0}
                    onClick={handleBuyNow}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${product.stock > 0 ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    ⚡ Buy Now
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2"><span>🚚</span><span>Free delivery on orders over ₹500</span></div>
                  <div className="flex items-center gap-2"><span>↩️</span><span>7-day easy returns</span></div>
                  <div className="flex items-center gap-2"><span>🛡️</span><span>Secure payment options</span></div>
                </div>
              </div>
            </div>

            {otherRetailers.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
                <h3 className="font-bold text-lg mb-4">Other Sellers</h3>
                <div className="space-y-3">
                  {otherRetailers.map((retailer, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/product/${retailer.product_id}`)}
                      className="w-full p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{retailer.retailer_name}</span>
                        <span className="text-red-600 font-bold">₹{retailer.price}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        {retailer.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <StarRating rating={Math.round(retailer.rating)} size="sm" />
                            <span>({retailer.rating.toFixed(1)})</span>
                          </div>
                        )}
                        <span className="text-green-600">{retailer.stock} in stock</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;