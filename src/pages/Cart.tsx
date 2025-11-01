import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div key={item.id} className="border rounded-lg p-4 flex items-center gap-4 bg-white shadow">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-gray-600">{item.category}</p>
                <p className="text-xl font-semibold mt-2">₹{item.price}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1 border rounded min-w-[60px] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 font-bold"
                >
                  +
                </button>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 text-sm hover:underline mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-red-500 hover:underline text-sm"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="border rounded-lg p-6 h-fit bg-white shadow">
          <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{getCartTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span>₹40.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>₹{(getCartTotal() + 40).toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 font-semibold"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;