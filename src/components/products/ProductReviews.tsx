import { useEffect, useState } from 'react';
import { fetchProductReviews, ProductReview } from '../../services/productService';
import { supabase } from '../../utils/supabaseClient';
import { Star, Edit2, ShoppingBag } from 'lucide-react';

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
  const [userExistingReview, setUserExistingReview] = useState<ProductReview | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProductReviews mounted for product:', productId);
    console.log('User has delivered order:', userHasDeliveredOrder);
    if (!productId) {
      console.warn('ProductReviews mounted without productId');
      return;
    }
    loadReviews();
    getCurrentUser();
  }, [productId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log('Loading reviews for product:', productId);
      const data = await fetchProductReviews(productId);
      console.log('Reviews loaded:', data);
      setReviews(data);
      
      // Check if current user has already reviewed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const existingReview = data.find((r: ProductReview) => r.user_id === user.id);
        if (existingReview) {
          console.log('Found existing review from user:', existingReview);
          setUserExistingReview(existingReview);
          setNewReview({ rating: existingReview.rating, reviewText: existingReview.review_text || '' });
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = () => {
    // Only allow if user has delivered order OR if they already have a review (for editing)
    if (!userHasDeliveredOrder && !userExistingReview) {
      alert('You need to purchase and receive this product before you can leave a review.');
      return;
    }

    console.log('Starting review form');
    if (userExistingReview) {
      setIsEditMode(true);
      setNewReview({ rating: userExistingReview.rating, reviewText: userExistingReview.review_text || '' });
    } else {
      setIsEditMode(false);
      setNewReview({ rating: 5, reviewText: '' });
    }
    setShowAddReview(true);
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      alert('Please select a rating');
      return;
    }

    // Enforce delivered order requirement for new reviews
    if (!isEditMode && !userHasDeliveredOrder) {
      alert('You can only review products from your delivered orders.');
      return;
    }
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to leave a review');
        return;
      }

      // Get order ID for this product - verify delivered status
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`id, delivery_status, order_items (product_id)`)
        .eq('customer_id', user.id)
        .eq('delivery_status', 'delivered');

      if (orderError) throw orderError;

      const ordersWithProduct = orders?.filter(order => 
        order.order_items?.some((item: any) => item.product_id === productId)
      );

      // For new reviews, strictly enforce delivered order requirement
      if (!isEditMode && (!ordersWithProduct || ordersWithProduct.length === 0)) {
        alert('You can only review products from your delivered orders.');
        return;
      }

      // For updates, allow if they already have a review (even if somehow order status changed)
      if (isEditMode && !userExistingReview) {
        alert('Review not found.');
        return;
      }

      const orderId = ordersWithProduct && ordersWithProduct.length > 0 ? ordersWithProduct[0].id : null;

      // Get user name
      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const userName = userData?.full_name || user.email?.split('@')[0] || 'Anonymous';

      if (isEditMode && userExistingReview) {
        // Update existing review
        const { error: updateError } = await supabase
          .from('reviews')
          .update({
            rating: newReview.rating,
            review_text: newReview.reviewText.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userExistingReview.id);

        if (updateError) throw updateError;
        alert('✅ Review updated successfully!');
      } else {
        // Insert new review - double-check we have an order
        if (!orderId) {
          alert('Unable to verify your order. Please try again.');
          return;
        }

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
          .insert([reviewData]);

        if (reviewError) {
          if (reviewError.code === '23505') {
            alert('You have already reviewed this product');
          } else {
            throw reviewError;
          }
          return;
        }
        alert('✅ Review submitted successfully!');
      }

      setShowAddReview(false);
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
    const starSize = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const renderClickableStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setNewReview({ ...newReview, rating: star })}
            className={`text-4xl transition-all transform hover:scale-110 ${
              star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            ★
          </button>
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

  // Determine if user can write/edit review
  const canWriteReview = userHasDeliveredOrder || userExistingReview !== null;

  // Review Form View
  if (showAddReview) {
    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <button
            type="button"
            onClick={() => setShowAddReview(false)}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
          >
            <span>←</span> Back to Reviews
          </button>
          <h3 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Your Review' : 'Write Your Review'}
          </h3>
          <p className="text-gray-600 mt-1">{productName}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-semibold text-gray-700 mb-3 text-lg">Your Rating *</label>
            {renderClickableStars()}
            <p className="text-lg font-medium text-gray-700 mt-2">
              {newReview.rating === 5 && 'Excellent! ⭐⭐⭐⭐⭐'}
              {newReview.rating === 4 && 'Very Good ⭐⭐⭐⭐'}
              {newReview.rating === 3 && 'Average ⭐⭐⭐'}
              {newReview.rating === 2 && 'Below Average ⭐⭐'}
              {newReview.rating === 1 && 'Poor ⭐'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-3 text-lg">
              Your Review <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              value={newReview.reviewText}
              onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
              rows={5}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
              placeholder="Share your experience with this product..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddReview(false)}
              disabled={submitting}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-blue-700 font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                isEditMode ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reviews List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Customer Reviews</h2>
        <p className="text-gray-600">{productName}</p>
      </div>

      {/* Rating Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-blue-600">{getAverageRating()}</p>
            <div className="my-2 flex justify-center">{renderStars(Math.round(Number(getAverageRating())), 'lg')}</div>
            <p className="text-sm text-gray-600">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
          <div className="flex-1">
            {canWriteReview ? (
              <div className="text-center">
                <p className="text-gray-700 mb-3">
                  {userExistingReview ? 'You have already reviewed this product' : 'Share your experience with this product'}
                </p>
                <button
                  type="button"
                  onClick={handleStartReview}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                >
                  {userExistingReview ? (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit Your Review
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Write a Review
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ShoppingBag className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="font-semibold text-amber-800 mb-1">Purchase Required</p>
                <p className="text-sm text-amber-700">
                  You need to purchase and receive this product before you can leave a review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
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
          {canWriteReview && (
            <button
              type="button"
              onClick={handleStartReview}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-medium shadow-md"
            >
              Write First Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                review.user_id === currentUserId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    <span className="font-medium text-gray-700">
                      {review.user_name || 'Anonymous'}
                      {review.user_id === currentUserId && (
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">You</span>
                      )}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700 mt-2 leading-relaxed">{review.review_text}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <div className="text-xs text-gray-500">Verified Purchase ✓</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductReviews;