import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import RetailerDashboard from '@/components/dashboards/RetailerDashboard';
import CustomerDashboard from '@/components/dashboards/CustomerDashboard';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Orders from '@/pages/Orders';
import { useCart } from '@/context/CartContext';

function Navbar() {
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [view, setView] = useState<'retailer' | 'customer'>('customer');

  const handleViewChange = (newView: 'retailer' | 'customer') => {
    setView(newView);
    navigate(newView === 'retailer' ? '/retailer' : '/');
  };

  return (
    <nav className="bg-white shadow-md p-4 mb-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-500">
          Live MART
        </Link>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => handleViewChange('customer')}
            className={`px-4 py-2 rounded ${
              view === 'customer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Customer View
          </button>
          <button
            onClick={() => handleViewChange('retailer')}
            className={`px-4 py-2 rounded ${
              view === 'retailer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Retailer View
          </button>

          {view === 'customer' && (
            <>
              <Link
                to="/orders"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                My Orders
              </Link>
              <Link
                to="/cart"
                className="relative px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                🛒 Cart
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<CustomerDashboard />} />
          <Route path="/retailer" element={<RetailerDashboard />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;