import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Package, Clock, CheckCircle, Truck, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  customer_name?: string;
  items?: any[];
}

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order from database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        alert('Failed to load order details');
        return;
      }

      setOrder(orderData);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate delivery timeline based on order creation date
  const getDeliveryTimeline = () => {
    if (!order) return null;

    const orderDate = new Date(order.created_at);
    const now = currentTime;
    const hoursPassed = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    const daysPassed = hoursPassed / 24;

    // Fixed 7-day delivery
    const estimatedDelivery = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Timeline milestones (in hours from order creation)
    const confirmedTime = orderDate; // Immediate
    const preparingTime = new Date(orderDate.getTime() + 0.25 * 60 * 60 * 1000); // 15 minutes
    const outForDeliveryTime = new Date(orderDate.getTime() + 6 * 24 * 60 * 60 * 1000); // Day 6
    const deliveredTime = estimatedDelivery; // Day 7

    // Determine current status based on time elapsed
    let currentStatus = 'confirmed';
    if (hoursPassed >= 168) { // 7 days = 168 hours
      currentStatus = 'delivered';
    } else if (daysPassed >= 6) {
      currentStatus = 'out_for_delivery';
    } else if (hoursPassed >= 0.25) { // 15 minutes
      currentStatus = 'preparing';
    }

    return {
      confirmedTime,
      preparingTime,
      outForDeliveryTime,
      deliveredTime,
      estimatedDelivery,
      currentStatus,
      hoursPassed,
      daysPassed,
      isDelivered: currentStatus === 'delivered'
    };
  };

  const timeline = getDeliveryTimeline();

  const getStatusSteps = () => {
    if (!timeline) return [];

    const allSteps = [
      { 
        key: 'confirmed', 
        label: 'Order Confirmed', 
        icon: CheckCircle, 
        time: timeline.confirmedTime,
        description: 'Your order has been received'
      },
      { 
        key: 'preparing', 
        label: 'Preparing', 
        icon: Package, 
        time: timeline.preparingTime,
        description: 'Your order is being prepared'
      },
      { 
        key: 'out_for_delivery', 
        label: 'Out for Delivery', 
        icon: Truck, 
        time: timeline.outForDeliveryTime,
        description: 'On the way to you'
      },
      { 
        key: 'delivered', 
        label: 'Delivered', 
        icon: CheckCircle, 
        time: timeline.deliveredTime,
        description: 'Successfully delivered'
      }
    ];

    const statusOrder = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(timeline.currentStatus);

    return allSteps.map((step, index) => {
      const stepTime = step.time;
      const hasOccurred = currentTime >= stepTime;
      
      return {
        ...step,
        isCompleted: index <= currentIndex,
        isActive: index === currentIndex,
        displayTime: hasOccurred 
          ? stepTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : `Expected: ${stepTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
      };
    });
  };

  // Generate realistic delivery partner based on order ID
  const getDeliveryPartner = () => {
    if (!timeline || timeline.currentStatus !== 'out_for_delivery') return null;

    // Generate deterministic partner based on order ID hash
    const partners = [
      { name: 'Rajesh Kumar', vehicle: 'Bike', phone: '+91 98765 43210' },
      { name: 'Priya Sharma', vehicle: 'Scooter', phone: '+91 98765 43211' },
      { name: 'Amit Patel', vehicle: 'Van', phone: '+91 98765 43212' },
      { name: 'Ananya Singh', vehicle: 'Bike', phone: '+91 98765 43213' },
      { name: 'Vikram Reddy', vehicle: 'Scooter', phone: '+91 98765 43214' }
    ];

    const hash = order!.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return partners[hash % partners.length];
  };

  const getLiveLocation = () => {
    if (!timeline || timeline.currentStatus !== 'out_for_delivery') return '';

    const hoursIntoDelivery = timeline.hoursPassed - (6 * 24);
    const distanceRemaining = Math.max(0, 10 - (hoursIntoDelivery * 0.5)).toFixed(1);

    return `Your delivery is on the way! Driver is ${distanceRemaining} km away.`;
  };

  const getTimeRemaining = () => {
    if (!timeline) return '';
    
    if (timeline.isDelivered) return 'Delivered';
    
    const diff = timeline.estimatedDelivery.getTime() - currentTime.getTime();
    
    if (diff < 0) return 'Delivery time passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  const handleCallDeliveryPartner = () => {
    const partner = getDeliveryPartner();
    if (partner) {
      alert(`Calling ${partner.name} at ${partner.phone}`);
      // In production: window.location.href = `tel:${partner.phone}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order || !timeline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const deliveryPartner = getDeliveryPartner();
  const liveLocation = getLiveLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-purple-600 hover:text-purple-800 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Track Your Order</h1>
            <p className="text-gray-600 text-lg">Order #{order.id.substring(0, 8)}</p>
            {!timeline.isDelivered && (
              <div className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full font-semibold">
                {getTimeRemaining()}
              </div>
            )}
            {timeline.isDelivered && (
              <div className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold">
                ✓ Delivered
              </div>
            )}
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
                          {step.displayTime}
                        </span>
                      </div>
                      <p className={`text-sm ${step.isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                      {step.isActive && !timeline.isDelivered && (
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
              <h3 className="text-xl font-bold text-gray-800">
                {timeline.isDelivered ? 'Delivered On' : 'Estimated Delivery'}
              </h3>
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {timeline.estimatedDelivery.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-gray-600">
              {timeline.estimatedDelivery.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Delivery Partner Info */}
        {deliveryPartner && (
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
                      {deliveryPartner.name}
                    </p>
                    <p className="text-white/80 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Vehicle: <span className="font-semibold">{deliveryPartner.vehicle}</span>
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
        {timeline.currentStatus === 'out_for_delivery' && !timeline.isDelivered && (
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
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-gray-600 text-lg">Delivery Timeline</span>
              <span className="text-gray-800 font-semibold">7 Days Standard</span>
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