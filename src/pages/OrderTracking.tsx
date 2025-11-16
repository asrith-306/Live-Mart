import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Package, Clock, CheckCircle, Truck, User, ArrowLeft } from 'lucide-react';

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  estimated_delivery: string;
  created_at: string;
  delivery_partner?: {
    name: string;
    phone: string;
    vehicle: string;
  };
}

// Sample data for demonstration
const sampleOrder: OrderDetails = {
  id: '08beaf87-c36e-4c4f-9e80-f5f8bffade4d',
  status: 'out_for_delivery',
  total_amount: 1299,
  delivery_address: 'Hyderabad, Telangana, India',
  estimated_delivery: '2025-11-16T19:56:00',
  created_at: '2025-11-16T10:00:00',
  delivery_partner: {
    name: 'Ananya',
    phone: '+91 98765 43210',
    vehicle: 'Scooter'
  }
};

const OrderTracking: React.FC = () => {
  const [order, setOrder] = useState<OrderDetails>(sampleOrder);
  const [liveLocation, setLiveLocation] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate live location updates
    if (order.status === 'out_for_delivery') {
      setLiveLocation('Your delivery is on the way! Driver is 2.5 km away.');
    }

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [order.status]);

  const getStatusSteps = () => {
    const allSteps = [
      { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle, time: '10:00 AM' },
      { key: 'preparing', label: 'Preparing', icon: Package, time: '10:15 AM' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, time: '11:30 AM' },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle, time: 'Expected: 7:56 PM' }
    ];

    const statusOrder = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    return allSteps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
      isActive: index === currentIndex
    }));
  };

  const handleCallDeliveryPartner = () => {
    if (order.delivery_partner?.phone) {
      alert(`Calling ${order.delivery_partner.name} at ${order.delivery_partner.phone}`);
      // In production: window.location.href = `tel:${order.delivery_partner.phone}`;
    }
  };

  const getTimeRemaining = () => {
    const estimatedTime = new Date(order.estimated_delivery);
    const diff = estimatedTime.getTime() - currentTime.getTime();
    
    if (diff < 0) return 'Delivery time passed';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            className="text-purple-600 hover:text-purple-800 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Track Your Order</h1>
            <p className="text-gray-600 text-lg">Order #{order.id.substring(0, 8)}</p>
            <div className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full font-semibold">
              {getTimeRemaining()}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Order Progress</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-8 bottom-8 w-1 bg-gray-200">
              <div 
                className="bg-gradient-to-b from-purple-600 to-pink-600 transition-all duration-1000 ease-out"
                style={{ 
                  height: `${(statusSteps.findIndex(s => s.isActive) / (statusSteps.length - 1)) * 100}%` 
                }}
              />
            </div>

            {/* Status Steps */}
            <div className="space-y-8 relative">
              {statusSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-6">
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-500 ${
                      step.isCompleted 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-400'
                    } ${step.isActive ? 'ring-4 ring-purple-200 scale-110 animate-pulse' : ''}`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-xl font-semibold ${
                          step.isCompleted ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </h3>
                        <span className={`text-sm font-medium ${
                          step.isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {step.time}
                        </span>
                      </div>
                      {step.isActive && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
                          <p className="text-purple-600 font-medium">
                            In Progress
                          </p>
                        </div>
                      )}
                      {step.isCompleted && !step.isActive && (
                        <p className="text-green-600 font-medium mt-1">
                          ✓ Completed
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delivery Address</h3>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">{order.delivery_address}</p>
          </div>

          {/* Estimated Delivery */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-transform">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Estimated Delivery</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {new Date(order.estimated_delivery).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-600">
              {new Date(order.estimated_delivery).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Delivery Partner Info */}
        {order.delivery_partner && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mt-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 rounded-full">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold">Your Delivery Partner</h3>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-1">
                      {order.delivery_partner.name}
                    </p>
                    <p className="text-white/80 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Vehicle: <span className="font-semibold">{order.delivery_partner.vehicle}</span>
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleCallDeliveryPartner}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                >
                  <Phone className="w-6 h-6" />
                  Call Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Tracking */}
        {order.status === 'out_for_delivery' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full animate-pulse">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Live Tracking</h3>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
              <p className="text-lg font-semibold text-green-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                {liveLocation}
              </p>
            </div>

            <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center border-4 border-dashed border-purple-200">
              <div className="text-center p-8">
                <MapPin className="w-20 h-20 mx-auto mb-4 text-purple-600 animate-bounce" />
                <p className="text-xl font-semibold text-gray-700 mb-2">Real-time GPS Tracking</p>
                <p className="text-gray-600">Map integration displays live delivery location</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live updates every 30 seconds</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600 text-lg">Total Amount</span>
              <span className="text-3xl font-bold text-purple-600">₹{order.total_amount}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600 text-lg">Order Date</span>
              <span className="text-gray-800 font-semibold">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-lg">Payment Status</span>
              <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-full">
                ✓ Paid
              </span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mt-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Contact our customer support for any queries or concerns about your order.
          </p>
          <button className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;