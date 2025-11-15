import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Package, MapPin, Clock, CheckCircle, Truck, Phone } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom delivery partner icon
const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Import Supabase client
import { supabase } from '../utils/supabaseClient';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';

type OrderData = {
  id: string;
  delivery_status: OrderStatus;
  delivery_partner_id?: string;
  delivery_partner?: {
    name: string;
    phone: string;
    vehicle_type: string;
  };
  delivery_lat: number;
  delivery_lng: number;
  estimated_delivery: string;
  delivery_address: string;
};

type LocationUpdate = {
  latitude: number;
  longitude: number;
  timestamp: string;
};

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<[number, number] | null>(null);
  const [locationHistory, setLocationHistory] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      
      // Replace with actual supabase import
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_partner:delivery_partners(name, phone, vehicle_type)
        `)
        .eq('id', orderId)
        .single();

      if (data) {
        setOrder(data as OrderData);
        if (data.delivery_lat && data.delivery_lng) {
          setDeliveryLocation([data.delivery_lat, data.delivery_lng]);
        }
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!order?.delivery_partner_id || !orderId) return;

    const channel = supabase
      .channel('delivery-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_tracking',
          filter: `order_id=eq.${orderId}`
        },
        (payload: any) => {
          const newLocation: LocationUpdate = payload.new;
          const coords: [number, number] = [newLocation.latitude, newLocation.longitude];
          setDeliveryLocation(coords);
          setLocationHistory(prev => [...prev, coords]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [orderId, order?.delivery_partner_id]);

  // Simulate live tracking (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (deliveryLocation && order?.delivery_status === 'out_for_delivery') {
        const [lat, lng] = deliveryLocation;
        // Simulate movement (small random changes)
        const newLat = lat + (Math.random() - 0.5) * 0.001;
        const newLng = lng + (Math.random() - 0.5) * 0.001;
        setDeliveryLocation([newLat, newLng]);
        setLocationHistory(prev => [...prev.slice(-20), [newLat, newLng]]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [deliveryLocation, order?.delivery_status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  const statusSteps: { status: OrderStatus; label: string; icon: any }[] = [
    { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
    { status: 'preparing', label: 'Preparing', icon: Package },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === order.delivery_status);

  // Default location (Hyderabad) if no delivery location
  const mapCenter: [number, number] = deliveryLocation || [17.385044, 78.486671];
  const destinationLocation: [number, number] = [order.delivery_lat, order.delivery_lng];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Track Your Order</h1>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              Order #{orderId?.slice(0, 8)}
            </span>
          </div>

          {/* Status Timeline */}
          <div className="flex items-center justify-between relative mt-8 mb-4">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              ></div>
            </div>
            
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.status} className="relative flex flex-col items-center z-10">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-blue-200 animate-pulse' : ''}
                    transition-all duration-300
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`
                    mt-2 text-xs font-medium text-center
                    ${isActive ? 'text-blue-600' : 'text-gray-400'}
                  `}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="space-y-6">
            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-blue-600" />
                Delivery Address
              </h2>
              <p className="text-gray-600">{order.delivery_address}</p>
            </div>

            {/* Estimated Time */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <h3 className="font-semibold">Estimated Delivery</h3>
              </div>
              <p className="text-3xl font-bold">{order.estimated_delivery}</p>
            </div>

            {/* Delivery Partner Info */}
            {order.delivery_partner && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Truck className="text-blue-600" />
                  Delivery Partner
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-800">{order.delivery_partner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="font-semibold text-gray-800">{order.delivery_partner.vehicle_type}</p>
                  </div>
                  <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Phone className="w-4 h-4" />
                    Call Delivery Partner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Live Tracking</h2>
              <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-200">
                <MapContainer 
                  center={mapCenter} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Delivery Partner Location */}
                  {deliveryLocation && (
                    <Marker position={deliveryLocation} icon={deliveryIcon}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold">Delivery Partner</p>
                          <p className="text-sm">{order.delivery_partner?.name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Destination Location */}
                  <Marker position={destinationLocation}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold">Delivery Location</p>
                        <p className="text-sm">{order.delivery_address}</p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Path traveled */}
                  {locationHistory.length > 1 && (
                    <Polyline 
                      positions={locationHistory} 
                      color="#3B82F6" 
                      weight={3}
                      opacity={0.6}
                    />
                  )}
                </MapContainer>
              </div>
              
              {order.delivery_status === 'out_for_delivery' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-blue-800 font-medium">Your delivery is on the way!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}