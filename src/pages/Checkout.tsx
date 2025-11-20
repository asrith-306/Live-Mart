import { useState, FormEvent, ChangeEvent } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { MapPin, Phone, CreditCard, Truck } from 'lucide-react';

interface FormData {
  phone: string;
  address: string;
  paymentMethod: 'online' | 'offline';
  latitude?: number;
  longitude?: number;
}

function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    address: '',
    paymentMethod: 'online',
    latitude: 17.385044, // Default to Hyderabad
    longitude: 78.486671,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGettingLocation(false);
          alert('✅ Location captured successfully!');
        },
        (error) => {
          console.error('Location error:', error);
          alert('Could not get your location. Using default location.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please login to place order');
        navigate('/login');
        return;
      }

      const totalPrice = getCartTotal() + 40; // Including delivery fee
      const orderNumber = `ORD-${Date.now()}`; // Generate unique order number

      // Get user details for order
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('auth_id', user.id)
        .single();

      // Calculate estimated delivery time (30-45 mins from now)
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + 35);
      const estimatedDelivery = estimatedTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Create order with delivery fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: userData?.name || 'Customer',
          customer_phone: formData.phone,
          total_price: totalPrice,
          status: 'pending',
          delivery_status: 'pending',
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'offline' ? 'pending' : 'pending',
          delivery_address: formData.address,
          phone: formData.phone,
          order_number: orderNumber,
          delivery_lat: formData.latitude || 17.385044,
          delivery_lng: formData.longitude || 78.486671,
          estimated_delivery: estimatedDelivery,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.id);
        }
      }

      // Handle payment
      if (formData.paymentMethod === 'online') {
        redirectToMockPayment(order.id, totalPrice);
      } else {
        // For offline payment, mark order as confirmed
        await supabase
          .from('orders')
          .update({ 
            delivery_status: 'confirmed',
            status: 'confirmed' 
          })
          .eq('id', order.id);

        clearCart();
        navigate(`/order-success/${order.id}`);
      }

    } catch (error: any) {
      console.error('Order error:', error);
      alert('Failed to place order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const redirectToMockPayment = (orderId: string, amount: number) => {
    // Create a mock payment gateway URL with order details
    const mockPaymentUrl = `/mock-payment?orderId=${orderId}&amount=${amount}&phone=${encodeURIComponent(formData.phone)}`;
    
    // Redirect to mock payment page
    navigate(mockPaymentUrl);
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to get started</p>
          <button
            onClick={() => navigate('/customer')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 font-semibold transition-all"
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              {/* Delivery Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Delivery Address *
                </label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  placeholder="Enter your full address with landmark"
                />
                
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </button>
                
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label className="block font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={formData.paymentMethod === 'online'}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Online Payment</p>
                      <p className="text-sm text-gray-500">Pay via Mock Payment Gateway</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="offline"
                      checked={formData.paymentMethod === 'offline'}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">Cash on Delivery</p>
                      <p className="text-sm text-gray-500">Pay when you receive</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg hover:from-blue-600 hover:to-purple-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                {loading ? 'Processing...' : '🛒 Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="font-bold text-xl mb-4 text-gray-800">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                    <span className="text-gray-700">
                      {item.name} <span className="text-gray-500">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">₹40.00</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-lg text-gray-800">Total</span>
                  <span className="font-bold text-2xl text-blue-600">₹{(getCartTotal() + 40).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Expected delivery: 30-45 mins
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;