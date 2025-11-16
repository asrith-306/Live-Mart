import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { addReview, getExistingReview, updateReview } from '../services/productService';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total_price: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  delivery_date?: string;
  delivery_address: string;
  order_items?: OrderItem[];
}

interface ReviewForm {
  productId: string;
  productName: string;
  rating: number;
  reviewText: string;
  existingReviewId?: string;
}

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReview, setCurrentReview] = useState<ReviewForm | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryDate = (order: Order) => {
    if (order.delivery_date) {
      return new Date(order.delivery_date);
    }
    
    const orderDate = new Date(order.created_at);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    return deliveryDate;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isDeliveryPast = (order: Order) => {
    const deliveryDate = getDeliveryDate(order);
    return deliveryDate < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'confirmed': return 'text-blue-600 bg-blue-50';
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleReviewClick = async (orderId: string, productId: string, productName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if review already exists
      const existingReview = await getExistingReview(orderId, productId);

      setSelectedOrderId(orderId);
      setCurrentReview({
        productId,
        productName,
        rating: existingReview?.rating || 5,
        reviewText: existingReview?.review_text || '',
        existingReviewId: existingReview?.id,
      });
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error checking existing review:', error);
      alert('Failed to load review');
    }
  };

  const handleSubmitReview = async () => {
    if (!currentReview) return;

    setSubmittingReview(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to submit review');
        return;
      }

      if (currentReview.existingReviewId) {
        // Update existing review
        await updateReview(currentReview.existingReviewId, {
          rating: currentReview.rating,
          review_text: currentReview.reviewText,
        });
        alert('✅ Review updated successfully!');
      } else {
        // Create new review
        await addReview({
          order_id: selectedOrderId,
          product_id: currentReview.productId,
          customer_id: user.id,
          rating: currentReview.rating,
          review_text: currentReview.reviewText,
        });
        alert('✅ Review submitted successfully!');
      }

      setShowReviewModal(false);
      setCurrentReview(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold mb-2">No Orders Yet</h1>
          <p className="text-gray-600 mb-6">
            You haven't placed any orders. Start shopping now!
          </p>
          <button
            onClick={() => navigate('/customer')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const deliveryDate = getDeliveryDate(order);
          const isPast = isDeliveryPast(order);
          const isDelivered = order.status.toLowerCase() === 'delivered';
          
          return (
            <div
              key={order.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex flex-wrap justify-between items-start gap-4">
                {/* Left side - Order details */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-gray-600">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="font-bold text-xl mb-1">₹{order.total_price.toFixed(2)}</p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Placed on {formatDate(new Date(order.created_at))}
                  </p>

                  <p className="text-xs text-gray-500 capitalize">
                    Payment: {order.payment_method} • {order.payment_status}
                  </p>
                </div>

                {/* Right side - Delivery date */}
                <div className={`text-right min-w-[180px] p-2.5 rounded-lg border ${
                  isDelivered
                    ? 'bg-green-50 border-green-300' 
                    : isPast 
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-blue-50 border-blue-300'
                }`}>
                  <p className="text-xs font-semibold mb-0.5">
                    {isDelivered ? '✅ Delivered' : '📦 Expected Delivery'}
                  </p>
                  <p className={`font-bold text-base ${
                    isDelivered
                      ? 'text-green-900' 
                      : isPast 
                        ? 'text-orange-900'
                        : 'text-blue-900'
                  }`}>
                    {formatDate(deliveryDate)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    10:00 AM - 8:00 PM
                  </p>
                  {isPast && !isDelivered && (
                    <p className="text-xs text-orange-600 mt-0.5 font-medium">
                      ⚠️ Overdue
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Items:</p>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {item.product_name} x {item.quantity}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</span>
                          
                          {/* Review Button - Only for delivered orders */}
                          {isDelivered && (
                            <button
                              onClick={() => handleReviewClick(order.id, item.product_id, item.product_name)}
                              className="text-base bg-yellow-100 text-yellow-800 px-8 py-4 rounded-full hover:bg-yellow-200 font-medium"                            >
                              ⭐ Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-600 mb-1">Delivery Address:</p>
                <p className="text-sm text-gray-800">{order.delivery_address}</p>
              </div>

              <div className="mt-3 text-right">
                <button 
                  onClick={() => navigate(`/order-success/${order.id}`)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {showReviewModal && currentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {currentReview.existingReviewId ? 'Update Review' : 'Write a Review'}
            </h2>
            
            <p className="text-gray-700 mb-4">
              <strong>Product:</strong> {currentReview.productName}
            </p>

            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCurrentReview({ ...currentReview, rating: star })}
                    className="text-3xl focus:outline-none"
                  >
                    {star <= currentReview.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Your Review</label>
              <textarea
                value={currentReview.reviewText}
                onChange={(e) => setCurrentReview({ ...currentReview, reviewText: e.target.value })}
                rows={4}
                className="w-full border rounded px-3 py-2"
                placeholder="Share your experience with this product..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setCurrentReview(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                disabled={submittingReview}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || currentReview.rating === 0}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {submittingReview ? 'Submitting...' : currentReview.existingReviewId ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/customer')}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
        >
          ← Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default Orders;