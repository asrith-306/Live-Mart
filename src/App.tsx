import { useState } from 'react';
import RetailerDashboard from '@/components/dashboards/RetailerDashboard';
import CustomerDashboard from '@/components/dashboards/CustomerDashboard';

function App() {
  const [view, setView] = useState<'retailer' | 'customer'>('retailer');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 mb-4">
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setView('retailer')}
            className={`px-6 py-2 rounded ${
              view === 'retailer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Retailer View
          </button>
          <button
            onClick={() => setView('customer')}
            className={`px-6 py-2 rounded ${
              view === 'customer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Customer View
          </button>
        </div>
      </nav>

      {view === 'retailer' ? <RetailerDashboard /> : <CustomerDashboard />}
    </div>
  );
}

export default App;