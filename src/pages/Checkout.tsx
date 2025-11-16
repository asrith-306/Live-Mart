import { useState, FormEvent, ChangeEvent } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

interface CheckoutFormData {
  phone: string;
  address: string;
  paymentMethod: 'online' | 'offline';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    phone: '',
    address: '',
    paymentMethod: 'online',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

      const totalPrice = getCartTotal() + 40;

      // Calculate delivery date - exactly 7 days from now
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      deliveryDate.setHours(14, 0, 0, 0); // Set time to 2:00 PM

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          total_price: totalPrice,
          status: 'pending',
          payment_method: formData.paymentMethod,
          payment_status: formData.paymentMethod === 'offline' ? 'pending' : 'pending',
          delivery_address: formData.address,
          phone: formData.phone,
          delivery_date: deliveryDate.toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
        initiatePayment(order.id, totalPrice);
      } else {
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

  const initiatePayment = (orderId: string, amount: number) => {
    const options = {
      key: 'rzp_test_YOUR_KEY_HERE', // Replace with your Razorpay test key
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'Live MART',
      description: 'Order Payment',
      order_id: orderId,
      handler: async function (_response: any) {
        // Payment successful
        await supabase
          .from('orders')
          .update({ payment_status: 'completed' })
          .eq('id', orderId);

        clearCart();
        navigate(`/order-success/${orderId}`);
      },
      prefill: {
        contact: formData.phone,
      },
      theme: {
        color: '#3B82F6',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

    rzp.on('payment.failed', async function () {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('id', orderId);
      
      alert('Payment failed. Please try again.');
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <button
          onClick={() => navigate('/products')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Summary */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-bold text-lg mb-2">Order Summary</h2>
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span>{item.name} x {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
            <span>Total (incl. delivery):</span>
            <span>₹{(getCartTotal() + 40).toFixed(2)}</span>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block font-semibold mb-2">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="+91 XXXXX XXXXX"
          />
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block font-semibold mb-2">Delivery Address *</label>
          <textarea
            name="address"
            required
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded px-3 py-2"
            placeholder="Enter your full address"
          />
        </div>

        {/* Delivery Date Info - Auto-calculated, NO INPUT */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-blue-900">Estimated Delivery</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            📦 All orders delivered within 7 days
          </p>
          <p className="text-xs text-gray-600 mt-2">
            ⏰ Delivery Time: 2:00 PM - 4:00 PM
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block font-semibold mb-2">Payment Method</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={formData.paymentMethod === 'online'}
                onChange={handleChange}
                className="mr-2"
              />
              Online Payment (Razorpay)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="offline"
                checked={formData.paymentMethod === 'offline'}
                onChange={handleChange}
                className="mr-2"
              />
              Cash on Delivery
            </label>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}

export default Checkout;