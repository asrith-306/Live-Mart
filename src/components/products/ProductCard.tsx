import { useState, useEffect } from 'react';
import { Star, ShoppingCart, Eye, X, Package } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Product, fetchProductReviews, ProductReview } from '../../services/productService';
import ProductReviews from './ProductReviews';
import { useUserHasDeliveredOrder } from '../../hooks/useUserHasDeliveredOrder';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [showReviews, setShowReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const hasDeliveredOrder = useUserHasDeliveredOrder(product.id);

  useEffect(() => {
    loadReviewStats();
  }, [product.id]);

  const loadReviewStats = async () => {
    if (!product.id) return;
    try {
      const data = await fetchProductReviews(product.id);
      setReviewCount(data.length);
      if (data.length > 0) {
        const avg = data.reduce((sum: number, r: ProductReview) => sum + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const handleOpenReviews = () => {
    console.log('Opening reviews for product:', product.id, product.name);
    setShowReviews(true);
  };

  const handleCloseReviews = () => {
    console.log('Closing reviews modal');
    setShowReviews(false);
    // Reload stats in case a review was added
    loadReviewStats();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getStockStatus = () => {
    if (!product.stock || product.stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50', icon: '❌' };
    } else if (product.stock < 10) {
      return { text: `Only ${product.stock} left`, color: 'text-orange-600', bgColor: 'bg-orange-50', icon: '⚠️' };
    } else if (product.stock < 50) {
      return { text: `${product.stock} in stock`, color: 'text-blue-600', bgColor: 'bg-blue-50', icon: '📦' };
    } else {
      return { text: `${product.stock} in stock`, color: 'text-green-600', bgColor: 'bg-green-50', icon: '✅' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="w-16 h-16" />
            </div>
          )}
          {product.stock && product.stock < 10 && product.stock > 0 && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <p className="text-xs text-blue-600 font-medium mb-1">{product.category}</p>
            <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">{product.name}</h3>
            
            {/* Rating Display */}
            <div 
              className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded -ml-1"
              onClick={handleOpenReviews}
            >
              {renderStars(averageRating)}
              <span className="text-sm text-gray-600">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm text-gray-500">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {product.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
            )}

            {/* Stock Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${stockStatus.bgColor} ${stockStatus.color} text-sm font-semibold mb-3`}>
              <Package className="w-4 h-4" />
              <span>{stockStatus.text}</span>
            </div>
          </div>

          {/* Price and Actions */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-blue-600">₹{product.price}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenReviews}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Reviews
              </button>
              <button
                type="button"
                onClick={() => onAddToCart(product)}
                disabled={!product.stock || product.stock === 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      {showReviews && product.id && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={handleCloseReviews}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-bold">Product Reviews</h2>
              <button
                type="button"
                onClick={handleCloseReviews}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <ProductReviews
                productId={product.id}
                productName={product.name}
                onClose={handleCloseReviews}
                userHasDeliveredOrder={hasDeliveredOrder}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ProductCard;
