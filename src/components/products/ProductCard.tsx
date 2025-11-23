import { useState, useEffect } from 'react';
import { Star, ShoppingCart, Eye, X, Package, Edit, Trash2, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Product, fetchProductReviews, ProductReview } from '../../services/productService';
import ProductReviews from './ProductReviews';
import { useUserHasDeliveredOrder } from '../../hooks/useUserHasDeliveredOrder';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  isRetailer?: boolean;
  isTrashView?: boolean;
}

function ProductCard({ 
  product, 
  onAddToCart, 
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  isRetailer = false,
  isTrashView = false 
}: ProductCardProps) {
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
    setShowReviews(true);
  };

  const handleCloseReviews = () => {
    setShowReviews(false);
    loadReviewStats();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleDelete = () => {
    if (onDelete && product.id) {
      onDelete(product.id);
    }
  };

  const handleRestore = () => {
    if (onRestore && product.id) {
      onRestore(product.id);
    }
  };

  const handlePermanentDelete = () => {
    if (onPermanentDelete && product.id) {
      onPermanentDelete(product.id);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-[#D4A855] fill-[#D4A855]' : 'text-[#D8DEE6] dark:text-[#3A4555]'}`}
          />
        ))}
      </div>
    );
  };

  const getStockStatus = () => {
    if (!product.stock || product.stock === 0) {
      return { text: 'Out of Stock', color: 'text-[#8A4A4A] dark:text-[#E8C0C0]', bgColor: 'bg-[#F5E3E3] dark:bg-[#4D3333]', icon: '⌛' };
    } else if (product.stock < 10) {
      return { text: `Only ${product.stock} left`, color: 'text-[#8A4A4A] dark:text-[#E8C0C0]', bgColor: 'bg-[#F5E3E3] dark:bg-[#4D3333]', icon: '⚠️' };
    } else if (product.stock < 50) {
      return { text: `${product.stock} in stock`, color: 'text-[#4A9FBE] dark:text-[#6BB3CF]', bgColor: 'bg-[#EEF5F7] dark:bg-[#1A2332]', icon: '📦' };
    } else {
      return { text: `${product.stock} in stock`, color: 'text-[#3A6B56] dark:text-[#B8E6D5]', bgColor: 'bg-[#D9EDE5] dark:bg-[#2A4D40]', icon: '✅' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-[#D8DEE6] dark:border-[#3A4555]">
        {/* Product Image */}
        <div className="relative h-48 bg-[#EDF2F7] dark:bg-[#1A2332]">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8A99AA]">
              <ShoppingCart className="w-16 h-16" />
            </div>
          )}
          
          {/* Action buttons for retailer view */}
          {isRetailer && !isTrashView && (
            <div className="absolute top-2 left-2 flex gap-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white p-2 rounded-full hover:bg-[#3A7C96] dark:hover:bg-[#4A9FBE] transition-colors shadow-md"
                  title="Edit Product"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="bg-[#D97B7B] dark:bg-[#E59595] text-white p-2 rounded-full hover:bg-[#C66A6A] dark:hover:bg-[#D97B7B] transition-colors shadow-md"
                  title="Move to Trash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Action buttons for trash view */}
          {isRetailer && isTrashView && (
            <div className="absolute top-2 left-2 flex gap-2">
              {onRestore && (
                <button
                  onClick={handleRestore}
                  className="bg-[#5FA889] dark:bg-[#7DBFA0] text-white p-2 rounded-full hover:bg-[#4D8A6F] dark:hover:bg-[#5FA889] transition-colors shadow-md"
                  title="Restore Product"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {onPermanentDelete && (
                <button
                  onClick={handlePermanentDelete}
                  className="bg-[#C66A6A] dark:bg-[#D97B7B] text-white p-2 rounded-full hover:bg-[#8A4A4A] dark:hover:bg-[#C66A6A] transition-colors shadow-md"
                  title="Delete Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {product.stock && product.stock < 10 && product.stock > 0 && (
            <span className="absolute top-2 right-2 bg-[#D97B7B] dark:bg-[#E59595] text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
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
            <p className="text-xs text-[#4A9FBE] dark:text-[#6BB3CF] font-medium mb-1">{product.category}</p>
            <h3 className="font-semibold text-[#2C3847] dark:text-[#E5E9EF] text-lg mb-2 line-clamp-2">{product.name}</h3>
            
            {/* Rating Display */}
            <div 
              className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-[#EDF2F7] dark:hover:bg-[#1A2332] p-1 rounded -ml-1 transition-colors"
              onClick={handleOpenReviews}
            >
              {renderStars(averageRating)}
              <span className="text-sm text-[#4A5568] dark:text-[#D1D8E0]">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm text-[#6B7A8F] dark:text-[#8A99AA]">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {product.description && (
              <p className="text-[#4A5568] dark:text-[#D1D8E0] text-sm mb-3 line-clamp-2">{product.description}</p>
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
              <span className="text-2xl font-bold text-[#4A9FBE] dark:text-[#6BB3CF]">₹{product.price}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenReviews}
                className="flex-1 bg-[#EDF2F7] dark:bg-[#1A2332] text-[#4A5568] dark:text-[#D1D8E0] py-2 px-3 rounded-lg hover:bg-[#D8DEE6] dark:hover:bg-[#242D3C] transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-[#D8DEE6] dark:border-[#3A4555]"
              >
                <Eye className="w-4 h-4" />
                Reviews
              </button>
              
              {!isRetailer && onAddToCart && (
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  disabled={!product.stock || product.stock === 0}
                  className="flex-1 bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#6BB3CF] dark:to-[#5AA5B0] text-white py-2 px-3 rounded-lg hover:from-[#3A7C96] hover:to-[#4A9FBE] dark:hover:from-[#4A9FBE] dark:hover:to-[#6BB3CF] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium shadow-[0_4px_12px_rgba(74,159,190,0.25)]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              )}
              
              {isRetailer && isTrashView && (
                <div className="flex-1 bg-[#F5E3E3] dark:bg-[#4D3333] text-[#8A4A4A] dark:text-[#E8C0C0] py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium border border-[#D97B7B] dark:border-[#8A4A4A]">
                  <Trash2 className="w-4 h-4" />
                  In Trash
                </div>
              )}
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
            className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#5AA5B0] dark:to-[#6BB3CF] text-white p-6 flex items-center justify-between flex-shrink-0">
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