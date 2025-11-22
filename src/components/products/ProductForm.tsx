// src/components/products/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../../services/productService';

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Product>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    description: '',
    image_url: ''
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#D8DEE6] dark:border-[#3A4555]">
        <h2 className="text-2xl font-bold mb-4 text-[#2C3847] dark:text-[#E5E9EF]">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#4A5568] dark:text-[#D1D8E0]">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#4A5568] dark:text-[#D1D8E0]">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]"
            >
              <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Food">Food</option>
              <option value="Home">Home & Kitchen</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#4A5568] dark:text-[#D1D8E0]">Price (₹)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#4A5568] dark:text-[#D1D8E0]">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#4A5568] dark:text-[#D1D8E0]">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-[#4A5568] dark:text-[#D1D8E0]">Image URL</label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="w-full border border-[#D8DEE6] dark:border-[#3A4555] bg-[#FAFBFC] dark:bg-[#1A2332] text-[#2C3847] dark:text-[#E5E9EF] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(74,159,190,0.3)] focus:border-[#4A9FBE] dark:focus:border-[#6BB3CF]"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#6BB3CF] dark:to-[#5AA5B0] text-white px-4 py-2 rounded-lg hover:from-[#3A7C96] hover:to-[#4A9FBE] dark:hover:from-[#4A9FBE] dark:hover:to-[#6BB3CF] font-semibold transition-all shadow-md"
            >
              {product ? 'Update' : 'Add'} Product
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-[#EDF2F7] dark:bg-[#1A2332] text-[#4A5568] dark:text-[#D1D8E0] px-4 py-2 rounded-lg hover:bg-[#D8DEE6] dark:hover:bg-[#242D3C] font-semibold transition-colors border border-[#D8DEE6] dark:border-[#3A4555]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;