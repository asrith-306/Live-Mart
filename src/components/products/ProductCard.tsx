import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';
import { Product } from '@/services/productService';
import ProductReviews from './ProductReviews';
import { useUserHasDeliveredOrder } from '@/hooks/useUserHasDeliveredOrder';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  isRetailer?: boolean;
  isTrashView?: boolean;
}

const ProductCard = ({ 
  product, 
  onEdit, 
  onDelete,
  onRestore,
  onPermanentDelete,
  isRetailer = false,
  isTrashView = false
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const hasDeliveredOrder = useUserHasDeliveredOrder(product.id);
  
  useEffect(() => {
    // Get or create modal root
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    setModalRoot(root);
  }, []);

  const handleDelete = () => {
    console.log('ProductCard: Delete clicked for:', product.id);
    if (product.id && onDelete) {
      onDelete(product.id);
    } else {
      console.error('ProductCard: No product ID or onDelete handler');
    }
  };

  const handleEdit = () => {
    console.log('ProductCard: Edit clicked for:', product);
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleRestore = () => {
    console.log('ProductCard: Restore clicked for:', product.id);
    if (product.id && onRestore) {
      onRestore(product.id);
    }
  };

  const handlePermanentDelete = () => {
    console.log('ProductCard: Permanent delete clicked for:', product.id);
    if (product.id && onPermanentDelete) {
      onPermanentDelete(product.id);
    }
  };

  const handleAddToCart = () => {
    console.log('handleAddToCart clicked for product:', product);
    console.log('Quantity:', quantity);
    console.log('addToCart function exists?', typeof addToCart);
    
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className={`border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow ${
        isTrashView ? 'bg-gray-50 border-red-200' : ''
      }`}>
        {/* Deleted Badge */}
        {isTrashView && (
          <div className="mb-2">
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              🗑️ Deleted {product.deleted_at && new Date(product.deleted_at).toLocaleDateString()}
            </span>
          </div>
        )}

        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name}
            className={`w-full h-48 object-cover rounded-md mb-3 ${isTrashView ? 'opacity-60' : ''}`}
          />
        )}
        
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.category}</p>
        <p className="text-sm text-gray-700 mb-3">{product.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-green-600">₹{product.price}</span>
          <span className={`text-sm ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
          </span>
        </div>

        {/* Active Product Buttons */}
        {isRetailer && !isTrashView && (
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )}

        {/* Trash View Buttons */}
        {isRetailer && isTrashView && (
          <div className="flex gap-2">
            <button
              onClick={handleRestore}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
            >
              ↺ Restore
            </button>
            <button
              onClick={handlePermanentDelete}
              className="flex-1 bg-red-700 text-white px-3 py-2 rounded hover:bg-red-800"
            >
              🗑️ Delete Forever
            </button>
          </div>
        )}
        
        {/* Customer View - Add to Cart + View Reviews */}
        {!isRetailer && !isTrashView && (
          <div className="space-y-2">
            {product.stock > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border rounded px-2 py-1 w-20 text-center"
                  />
                </div>
                <button 
                  onClick={handleAddToCart}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    added
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {added ? '✓ Added to Cart' : '🛒 Add to Cart'}
                </button>
                
                {/* View Reviews Button */}
                <button
                  onClick={() => setShowReviews(true)}
                  className="w-full py-2 rounded-lg font-semibold bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                >
                  ⭐ View Reviews
                </button>
              </>
            ) : (
              <>
                <button 
                  disabled
                  className="w-full bg-gray-300 text-gray-500 px-3 py-2 rounded cursor-not-allowed mb-2"
                >
                  Out of Stock
                </button>
                
                {/* View Reviews Button - Still available for out of stock */}
                <button
                  onClick={() => setShowReviews(true)}
                  className="w-full py-2 rounded-lg font-semibold bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                >
                  ⭐ View Reviews
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Render modal via Portal */}
      {showReviews && modalRoot && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999
          }}
          onClick={() => setShowReviews(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0">
              <h2 className="text-xl font-bold">Product Reviews</h2>
              <button
                onClick={() => setShowReviews(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <ProductReviews
                productId={product.id!}
                productName={product.name}
                onClose={() => setShowReviews(false)}
                userHasDeliveredOrder={hasDeliveredOrder}
              />
            </div>
          </div>
        </div>,
        modalRoot
      )}
    </>
  );
};

export default ProductCard;