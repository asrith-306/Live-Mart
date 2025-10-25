// src/components/products/ProductCard.tsx
import { Product } from '@/services/productService';

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

  return (
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
      
      {/* Customer View Button */}
      {!isRetailer && product.stock > 0 && !isTrashView && (
        <button className="w-full bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600">
          Add to Cart
        </button>
      )}
    </div>
  );
};

export default ProductCard;