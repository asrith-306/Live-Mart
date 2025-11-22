import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { MapPin, Phone, CreditCard, Truck, Calendar, Check, X, Sparkles, Tag } from 'lucide-react';
import { fetchProductsByCategory, Product } from '@/services/productService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';


// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);


interface FormData {
  phone: string;
  address: string;
  paymentMethod: 'online' | 'offline';
  latitude?: number;
  longitude?: number;
}


// Stripe card input styling
const cardStyle = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: { color: '#fa755a', iconColor: '#fa755a' },
  },
};


// Stripe Payment Form Component
interface StripePaymentFormProps {
  orderId: string;
  totalAmount: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
}


function StripePaymentForm({ orderId, totalAmount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);


  const handleStripePayment = async () => {
    if (!stripe || !elements) {
      onError('Stripe not loaded yet. Please wait.');
      return;
    }


    setProcessing(true);


    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to continue');
      }


      console.log('Starting payment process...');
      console.log('Order ID:', orderId);
      console.log('Amount:', totalAmount);


      // Call Edge Function to create payment intent
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;
      console.log('Calling:', functionUrl);


      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          orderId: orderId,
          customerEmail: session.user.email,
        }),
      });


      console.log('Response status:', response.status);


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge Function Error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }


      const data = await response.json();
      console.log('Server response:', data);


      if (data.error) {
        throw new Error(data.error);
      }


      if (!data.clientSecret) {
        throw new Error('No client secret received');
      }


      // Confirm payment with Stripe
      console.log('Confirming payment with Stripe...');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { email: session.user.email },
          },
        }
      );


      if (stripeError) {
        console.error('Stripe Error:', stripeError);
        // Update order status to failed
        await supabase.from('orders').update({
          status: 'payment_failed',
          payment_status: 'failed'
        }).eq('id', orderId);
        throw new Error(stripeError.message);
      }


      if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded!');
        // Update order status to paid
        await supabase.from('orders').update({
          status: 'confirmed',
          delivery_status: 'confirmed',
          payment_status: 'paid',
          stripe_payment_intent_id: paymentIntent.id,
        }).eq('id', orderId);


        onSuccess();
      }


    } catch (err: any) {
      console.error('Payment Error:', err);
      onError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Card Details
        </label>
        <CardElement options={cardStyle} />
      </div>


      <button
        type="button"
        onClick={handleStripePayment}
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg hover:from-blue-600 hover:to-purple-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
      >
        {processing ? 'Processing Payment...' : `Pay ₹${totalAmount.toFixed(2)}`}
      </button>


      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800 font-semibold">Test Mode - Use these details:</p>
        <p className="text-xs text-yellow-700">Card: 4242 4242 4242 4242</p>
        <p className="text-xs text-yellow-700">Expiry: 12/25 | CVC: 123</p>
      </div>
    </div>
  );
}


// Main Checkout Component
function Checkout() {
  const { cartItems, getCartTotal, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [calendarLinked, setCalendarLinked] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);
 
 
  // Stripe payment state
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);


  const [formData, setFormData] = useState<FormData>({
    phone: '',
    address: '',
    paymentMethod: 'online',
    latitude: 17.385044,
    longitude: 78.486671,
  });

  const DELIVERY_FEE = 40;


  const totalPrice = getCartTotal() + 40;


  // Load recommendations
  useEffect(() => {
    if (cartItems.length > 0) {
      loadRecommendations();
    }
  }, [cartItems]);


  const loadRecommendations = async () => {
    try {
      const categories = [...new Set(cartItems.map(item => item.category))];
      if (categories.length === 0) return;


      const allProducts: Product[] = [];
      for (const category of categories) {
        if (category && category !== 'All') {
          const data = await fetchProductsByCategory(category);
          allProducts.push(...data);
        }
      }


      const uniqueProducts = allProducts.filter(
        (product, index, self) =>
          index === self.findIndex(p => p.id === product.id) &&
          !cartItems.find(item => item.id === product.id)
      );


      const filtered = uniqueProducts.slice(0, 6);
      setRecommendedProducts(filtered);


      if (filtered.length > 0) {
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };


  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


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


  const handleGoogleCalendarLink = () => {
    setCalendarLinked(true);
  };

  // Coupon validation and application
  const applyCoupon = () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    if (trimmedCode === 'LIVEMART10') {
      const subtotal = getCartTotal();
      const discountAmount = subtotal * 0.10; // 10% discount
      setDiscount(discountAmount);
      setAppliedCoupon(trimmedCode);
      setCouponError('');
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code');
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const calculateTotal = () => {
    const subtotal = getCartTotal();
    return subtotal - discount + DELIVERY_FEE;
  };


  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentError(null);


    try {
      const { data: { user } } = await supabase.auth.getUser();


      if (!user) {
        alert('Please login to place order');
        navigate('/login');
        return;
      }

      const totalPrice = calculateTotal();

      const orderNumber = `ORD-${Date.now()}`;


      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('auth_id', user.id)
        .single();


      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + 35);
      const estimatedDelivery = estimatedTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });


      // Create the order
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
          payment_status: 'pending',
          delivery_address: formData.address,
          phone: formData.phone,
          order_number: orderNumber,
          delivery_lat: formData.latitude || 17.385044,
          delivery_lng: formData.longitude || 78.486671,
          estimated_delivery: estimatedDelivery,
          coupon_code: appliedCoupon,
          discount_amount: discount,
        })
        .select()
        .single();


      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }


      console.log('Order created:', order.id);


      // Create order items
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


      if (itemsError) {
        console.error('Order items error:', itemsError);
        throw itemsError;
      }


      // Update stock
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


      // Save last purchased category
      if (cartItems.length > 0) {
        const lastItem = cartItems[cartItems.length - 1];
        localStorage.setItem('lastPurchasedCategory', lastItem.category);
      }


      // Handle payment method
      if (formData.paymentMethod === 'online') {
        // Show Stripe payment form
        setPendingOrderId(order.id);
        setShowStripeForm(true);
      } else {
        // Cash on Delivery - confirm order immediately
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
    const mockPaymentUrl = `/mock-payment?orderId=${orderId}&amount=${amount}&phone=${encodeURIComponent(formData.phone)}`;
    navigate(mockPaymentUrl);

  // Handle successful payment
  const handlePaymentSuccess = () => {
    clearCart();
    navigate(`/order-success/${pendingOrderId}`);
  };


  // Handle payment error
  const handlePaymentError = (msg: string) => {
    setPaymentError(msg);
  };


  // Handle going back from payment form
  const handleBackFromPayment = async () => {
    // Delete the pending order if user goes back
    if (pendingOrderId) {
      await supabase.from('order_items').delete().eq('order_id', pendingOrderId);
      await supabase.from('orders').delete().eq('id', pendingOrderId);
    }
    setShowStripeForm(false);
    setPendingOrderId(null);
    setPaymentError(null);
  };


  // Empty cart view
  if (cartItems.length === 0 && !showStripeForm) {
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


  const cartCategories = [...new Set(cartItems.map(item => item.category))];
  const categoryDisplay = cartCategories.length > 1
    ? `${cartCategories[0]} and more`
    : cartCategories[0];


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Checkout</h1>


        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Stripe Payment Form */}
            {showStripeForm && pendingOrderId ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-bold text-xl mb-4 text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Complete Payment
                </h2>


                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    ❌ {paymentError}
                  </div>
                )}


                <Elements stripe={stripePromise}>
                  <StripePaymentForm
                    orderId={pendingOrderId}
                    totalAmount={totalPrice}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>


                <button
                  onClick={handleBackFromPayment}
                  className="mt-4 text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
                >
                  ← Cancel and go back
                </button>
              </div>
            ) : (
              /* Original Checkout Form */
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


                {/* Calendar Reminder */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <label className="block font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Delivery Reminder
                  </label>


                  {!calendarLinked ? (
                    <button
                      type="button"
                      onClick={handleGoogleCalendarLink}
                      className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Link Google Calendar
                    </button>
                  ) : (
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-green-800">Google Calendar Linked</span>
                      </div>
                      <p className="text-sm text-green-700">
                        ✅ Reminder will be sent via Google Calendar
                      </p>
                    </div>
                  )}
                </div>


                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <label className="block font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Method
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'online' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}>
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
                        <p className="text-sm text-gray-500">Pay securely via Stripe</p>
                      </div>
                    </label>


                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'offline' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}>
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
            )}
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

              {/* Coupon Section */}
              <div className="border-t pt-4 mb-4">
                <label className="block font-semibold mb-2 text-gray-800 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Have a Coupon?
                </label>
                
                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        {couponError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">💡 Try: LIVEMART10 for 10% off</p>
                  </div>
                ) : (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-800 text-sm">{appliedCoupon}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-green-700 mt-1">10% discount applied!</p>
                  </div>
                )}
              </div>


              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{getCartTotal().toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount (10%)</span>
                    <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">₹{DELIVERY_FEE.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-lg text-gray-800">Total</span>
                  <span className="font-bold text-2xl text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                  <span className="font-bold text-2xl text-blue-600">₹{totalPrice.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-xs text-green-800 font-semibold text-center">
                      🎉 You saved ₹{discount.toFixed(2)}!
                    </p>
                  </div>
                )}
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


      {/* Recommendations Sidebar */}
      {recommendedProducts.length > 0 && !showStripeForm && (
        <div className={`fixed top-1/2 right-0 transform -translate-y-1/2 transition-all duration-300 z-40 ${showRecommendations ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="bg-white rounded-l-2xl shadow-2xl overflow-hidden" style={{ width: '320px' }}>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Also Recommended</h3>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/90">For your {categoryDisplay} purchase</p>
            </div>


            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-800 truncate">{product.name}</h4>
                      <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                      <p className="text-lg font-bold text-purple-600">₹{product.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showRecommendations && recommendedProducts.length > 0 && (

      {/* Floating Recommendations Button */}
      {!showRecommendations && recommendedProducts.length > 0 && !showStripeForm && (
        <button
          onClick={() => setShowRecommendations(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 z-40 flex items-center gap-3 animate-bounce-subtle"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">View Recommendations</span>
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{recommendedProducts.length}</span>
        </button>
      )}


      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}


export default Checkout;

