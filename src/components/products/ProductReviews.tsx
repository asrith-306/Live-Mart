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
    if (!productId) return;
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
      const data = await fetchProductReviews(productId);
      setReviews(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const existingReview = data.find((r: ProductReview) => r.user_id === user.id);
        if (existingReview) {
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
    if (!userHasDeliveredOrder && !userExistingReview) {
      alert('You need to purchase and receive this product before you can leave a review.');
      return;
    }

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

      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select(`id, delivery_status, order_items (product_id)`)
        .eq('customer_id', user.id)
        .eq('delivery_status', 'delivered');

      if (orderError) throw orderError;

      const ordersWithProduct = orders?.filter(order => 
        order.order_items?.some((item: any) => item.product_id === productId)
      );

      if (!isEditMode && (!ordersWithProduct || ordersWithProduct.length === 0)) {
        alert('You can only review products from your delivered orders.');
        return;
      }

      if (isEditMode && !userExistingReview) {
        alert('Review not found.');
        return;
      }

      const orderId = ordersWithProduct && ordersWithProduct.length > 0 ? ordersWithProduct[0].id : null;

      const { data: userData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const userName = userData?.full_name || user.email?.split('@')[0] || 'Anonymous';

      if (isEditMode && userExistingReview) {
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
            className={`${starSize} ${star <= rating ? 'text-[#D4A855] fill-[#D4A855]' : 'text-[#D8DEE6] dark:text-[#3A4555]'}`}
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
              star <= newReview.rating ? 'text-[#D4A855]' : 'text-[#D8DEE6] dark:text-[#3A4555] hover:text-[#D4A855]/70'
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

  const canWriteReview = userHasDeliveredOrder || userExistingReview !== null;

  // Review Form View
  if (showAddReview) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#D8DEE6] dark:border-[#3A4555] pb-4">
          <button
            type="button"
            onClick={() => setShowAddReview(false)}
            className="text-[#6B7A8F] dark:text-[#8A99AA] hover:text-[#4A5568] dark:hover:text-[#D1D8E0] flex items-center gap-1 mb-3 transition-colors"
          >
            <span>←</span> Back to Reviews
          </button>
          <h3 className="text-2xl font-bold text-[#2C3847] dark:text-[#E5E9EF]">
            {isEditMode ? 'Edit Your Review' : 'Write Your Review'}
          </h3>
          <p className="text-[#4A5568] dark:text-[#D1D8E0] mt-1">{productName}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-semibold text-[#2C3847] dark:text-[#E5E9EF] mb-3 text-lg">Your Rating *</label>
            {renderClickableStars()}
            <p className="text-lg font-medium text-[#4A5568] dark:text-[#D1D8E0] mt-2">
              {newReview.rating === 5 && 'Excellent! ⭐⭐⭐⭐⭐'}
              {newReview.rating === 4 && 'Very Good ⭐⭐⭐⭐'}
              {newReview.rating === 3 && 'Average ⭐⭐⭐'}
              {newReview.rating === 2 && 'Below Average ⭐⭐'}
              {newReview.rating === 1 && 'Poor ⭐'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#2C3847] dark:text-[#E5E9EF] mb-3 text-lg">
              Your Review <span className="text-[#6B7A8F] dark:text-[#8A99AA] font-normal">(Optional)</span>
            </label>
            <textarea
              value={newReview.reviewText}
              onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
              rows={5}
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-xl px-4 py-3 focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF] focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:outline-none resize-none"
              placeholder="Share your experience with this product..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowAddReview(false)}
              disabled={submitting}
              className="flex-1 bg-[#EDF2F7] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] py-3 rounded-xl hover:bg-[#D8DEE6] dark:hover:bg-[#242D3C] font-semibold disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-[#5FA889] to-[#4A9FBE] dark:from-[#7DBFA0] dark:to-[#6BB3CF] text-white py-3 rounded-xl hover:from-[#4D8A6F] hover:to-[#3A7C96] dark:hover:from-[#5FA889] dark:hover:to-[#4A9FBE] font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
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
      <div className="border-b border-[#D8DEE6] dark:border-[#3A4555] pb-4">
        <h2 className="text-2xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-1">Customer Reviews</h2>
        <p className="text-[#4A5568] dark:text-[#D1D8E0]">{productName}</p>
      </div>

      {/* Rating Summary */}
      <div className="bg-gradient-to-r from-[#EDF2F7] to-[#EEF5F7] dark:from-[#242D3C] dark:to-[#1A2332] rounded-xl p-6 border border-[#D8DEE6] dark:border-[#3A4555]">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-[#4A9FBE] dark:text-[#6BB3CF]">{getAverageRating()}</p>
            <div className="my-2 flex justify-center">{renderStars(Math.round(Number(getAverageRating())), 'lg')}</div>
            <p className="text-sm text-[#4A5568] dark:text-[#D1D8E0]">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
          </div>
          <div className="flex-1">
            {canWriteReview ? (
              <div className="text-center">
                <p className="text-[#2C3847] dark:text-[#E5E9EF] mb-3">
                  {userExistingReview ? 'You have already reviewed this product' : 'Share your experience with this product'}
                </p>
                <button
                  type="button"
                  onClick={handleStartReview}
                  className="bg-gradient-to-r from-[#D4A855] to-[#D97B7B] dark:from-[#D4A855] dark:to-[#E59595] text-white px-6 py-3 rounded-lg hover:from-[#C69945] hover:to-[#C66A6A] font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
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
              <div className="text-center bg-[#F5E3E3] dark:bg-[#4D3333] border border-[#D97B7B] dark:border-[#8A4A4A] rounded-lg p-4">
                <ShoppingBag className="w-8 h-8 text-[#8A4A4A] dark:text-[#E8C0C0] mx-auto mb-2" />
                <p className="font-semibold text-[#8A4A4A] dark:text-[#E8C0C0] mb-1">Purchase Required</p>
                <p className="text-sm text-[#8A4A4A] dark:text-[#E8C0C0]">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A9FBE] dark:border-[#6BB3CF] mx-auto mb-3"></div>
          <p className="text-[#6B7A8F] dark:text-[#8A99AA]">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-[#EDF2F7] dark:bg-[#1A2332] rounded-xl">
          <p className="text-6xl mb-3">⭐</p>
          <p className="text-[#4A5568] dark:text-[#D1D8E0] mb-2 text-lg">No reviews yet</p>
          <p className="text-[#6B7A8F] dark:text-[#8A99AA] text-sm mb-4">Be the first to share your experience!</p>
          {canWriteReview && (
            <button
              type="button"
              onClick={handleStartReview}
              className="bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white px-6 py-2 rounded-lg hover:bg-[#3A7C96] dark:hover:bg-[#4A9FBE] font-medium shadow-md transition-colors"
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
                review.user_id === currentUserId 
                  ? 'border-[#4A9FBE] dark:border-[#6BB3CF] bg-[#EEF5F7] dark:bg-[#1A2332]' 
                  : 'border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#242D3C]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(review.rating)}
                    <span className="font-medium text-[#2C3847] dark:text-[#E5E9EF]">
                      {review.user_name || 'Anonymous'}
                      {review.user_id === currentUserId && (
                        <span className="ml-2 text-xs bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white px-2 py-0.5 rounded">You</span>
                      )}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-[#4A5568] dark:text-[#D1D8E0] mt-2 leading-relaxed">{review.review_text}</p>
                  )}
                </div>
                <span className="text-xs text-[#6B7A8F] dark:text-[#8A99AA] whitespace-nowrap ml-4">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <div className="text-xs text-[#5FA889] dark:text-[#7DBFA0]">Verified Purchase ✓</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductReviews;