import { useEffect, useState } from 'react';
import { fetchProductReviews, addReview, ProductReview } from '../../services/productService';
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
  const [newReview, setNewReview] = useState<ReviewForm>({
    rating: 5,
    reviewText: '',
  });

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
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please login to leave a review');
        return;
      }

      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_items!inner(product_id)
        `)
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .eq('order_items.product_id', productId)
        .limit(1);

      if (!orders || orders.length === 0) {
        alert('You can only review products from delivered orders');
        return;
      }

      await addReview({
        order_id: orders[0].id,
        product_id: productId,
        customer_id: user.id,
        rating: newReview.rating,
        review_text: newReview.reviewText,
      });

      alert('✅ Review submitted successfully!');
      setShowAddReview(false);
      setNewReview({ rating: 5, reviewText: '' });
      loadReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.message.includes('duplicate')) {
        alert('You have already reviewed this product from this order');
      } else {
        alert('Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {!showAddReview ? (
        <>
          {/* Header */}
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold mb-1">Reviews</h2>
            <p className="text-gray-600">{productName}</p>
          </div>

          {/* Rating Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">{getAverageRating()}</p>
                <p className="text-2xl my-1">{renderStars(Math.round(Number(getAverageRating())))}</p>
                <p className="text-sm text-gray-600">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>

              {userHasDeliveredOrder && (
                <button
                  onClick={() => setShowAddReview(true)}
                  className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 font-medium"
                >
                  Write a Review
                </button>
              )}
            </div>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">⭐</p>
              <p className="text-gray-600 mb-4">No reviews yet</p>
              {userHasDeliveredOrder && (
                <button
                  onClick={() => setShowAddReview(true)}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  Write First Review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xl">{renderStars(review.rating)}</div>
                    <span className="text-xs text-gray-500">
                      {review.created_at && formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Add Review Form */
        <div>
          <button
            onClick={() => setShowAddReview(false)}
            className="text-blue-600 hover:underline mb-4 flex items-center gap-1"
          >
            ← Back to Reviews
          </button>

          <h3 className="text-xl font-bold mb-4">Write Your Review</h3>

          {/* Star Rating */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Your Rating *</label>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="text-3xl hover:scale-110 transition-transform"
                >
                  {star <= newReview.rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {newReview.rating === 5 && 'Excellent!'}
              {newReview.rating === 4 && 'Very Good'}
              {newReview.rating === 3 && 'Average'}
              {newReview.rating === 2 && 'Below Average'}
              {newReview.rating === 1 && 'Poor'}
            </p>
          </div>

          {/* Review Text */}
          <div className="mb-4">
            <label className="block font-medium mb-2">Your Review (Optional)</label>
            <textarea
              value={newReview.reviewText}
              onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Share your experience with this product..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddReview(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductReviews;