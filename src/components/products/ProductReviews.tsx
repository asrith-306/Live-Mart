import { useEffect, useState } from 'react';
import { fetchProductReviews, ProductReview } from '../../services/productService';
import { supabase } from '../../utils/supabaseClient';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  onClose: () => void;
  userHasDeliveredOrder?: boolean;
}

interface ReviewForm {
  rating: number;
  reviewText: string;
}

function ProductReviews({ productId, productName, onClose, userHasDeliveredOrder = false }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState<ReviewForm>({ rating: 5, reviewText: '' });

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const data = await fetchProductReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      alert('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to leave a review');
        return;
      }

      const { data: existingReviews, error: existingError } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id);

      if (existingError) throw existingError;
      if (existingReviews && existingReviews.length > 0) {
        alert('You have already reviewed this product');
        return;
      }

      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`id, status, delivery_status, order_items (product_id)`)
        .eq('customer_id', user.id);

      if (orderError) throw orderError;

      // Filter for delivered orders (check both status and delivery_status)
      const deliveredOrders = orders?.filter(order => 
        order.status === 'delivered' || order.delivery_status === 'delivered'
      );

      if (orderError) throw orderError;

      const ordersWithProduct = deliveredOrders?.filter(order => 
        order.order_items?.some((item: any) => item.product_id === productId)
      );

      if (!ordersWithProduct || ordersWithProduct.length === 0) {
        alert('You can only review products from your delivered orders. Please make sure your order has been delivered.');
        return;
      }

      const orderId = ordersWithProduct[0].id;

      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const userName = userData?.full_name || user.email?.split('@')[0] || 'Anonymous';

      const reviewData = {
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        rating: newReview.rating,
        review_text: newReview.reviewText.trim() || null,
        order_id: orderId,
        created_at: new Date().toISOString(),
      };

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select();

      if (reviewError) {
        if (reviewError.code === '23505') {
          alert('You have already reviewed this product');
        } else if (reviewError.message.includes('row-level security')) {
          alert('Database permission error. Please contact support.');
        } else {
          throw reviewError;
        }
        return;
      }

      alert('✅ Review submitted successfully!');
      setShowAddReview(false);
      setNewReview({ rating: 5, reviewText: '' });
      await loadReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(`Failed to submit review: ${error.message || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'text-2xl' : 'text-lg';
    return (
      <div className={`flex ${starSize} gap-1`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {!showAddReview ? (
        <>
          <div className="border-b pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Customer Reviews</h2>
                <p className="text-gray-600">{productName}</p>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-600">{getAverageRating()}</p>
                <div className="my-2 flex justify-center">{renderStars(Math.round(Number(getAverageRating())), 'lg')}</div>
                <p className="text-sm text-gray-600 mt-1">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>
              <div className="flex-1">
                {userHasDeliveredOrder ? (
                  <div className="text-center">
                    <p className="text-gray-700 mb-3">Share your experience with this product</p>
                    <button onClick={() => setShowAddReview(true)} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
                      <span>⭐</span> Write a Review
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <p className="font-medium">Reviews are available after product delivery</p>
                    <p className="text-sm mt-1">You can review this product once it's delivered to you</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-6xl mb-3">⭐</p>
              <p className="text-gray-600 mb-2 text-lg">No reviews yet</p>
              <p className="text-gray-500 text-sm mb-4">Be the first to share your experience!</p>
              {userHasDeliveredOrder && (
                <button onClick={() => setShowAddReview(true)} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-medium shadow-md">Write First Review</button>
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        <span className="font-medium text-gray-700">{review.user_name || 'Anonymous'}</span>
                      </div>
                      {review.review_text && <p className="text-gray-700 mt-2 leading-relaxed">{review.review_text}</p>}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{review.created_at && formatDate(review.created_at)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Verified Purchase ✓</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl">
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setShowAddReview(false)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
                <span>←</span><span>Back</span>
              </button>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Write Your Review</h3>
            <p className="text-gray-600 mt-1">{productName}</p>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-3 text-lg">Your Rating *</label>
            <div className="flex gap-3 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })}
                  className={`text-4xl transition-all transform hover:scale-110 ${star <= newReview.rating ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-300'}`}>★</button>
              ))}
            </div>
            <p className="text-lg font-medium text-gray-700">
              {newReview.rating === 5 && 'Excellent! ⭐⭐⭐⭐⭐'}
              {newReview.rating === 4 && 'Very Good ⭐⭐⭐⭐'}
              {newReview.rating === 3 && 'Average ⭐⭐⭐'}
              {newReview.rating === 2 && 'Below Average ⭐⭐'}
              {newReview.rating === 1 && 'Poor ⭐'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-3 text-lg">Your Review <span className="text-gray-500 font-normal">(Optional)</span></label>
            <textarea value={newReview.reviewText} onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })} rows={5}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors resize-none"
              placeholder="Share your experience with this product..." />
            <p className="text-sm text-gray-500 mt-2">Your review will help other customers make better decisions</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={() => setShowAddReview(false)} disabled={submitting} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold transition-colors disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmitReview} disabled={submitting} className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-blue-700 font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Submitting...</>) : 'Submit Review'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2"><span>✓</span>Verified Purchase - This review will be marked as from a verified customer</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductReviews;