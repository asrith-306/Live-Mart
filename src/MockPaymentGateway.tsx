// PaymentGateway.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import { Check, CreditCard, Lock, User, Calendar, Shield, ArrowLeft } from 'lucide-react';

interface CreditCardData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
}

function PaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'card' | 'otp' | 'success'>('card');
  
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const phone = searchParams.get('phone');

  const [cardData, setCardData] = useState<CreditCardData>({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardData(prev => ({ ...prev, [name]: formattedValue }));
    } 
    // Format expiry date with slash
    else if (name === 'expiryDate') {
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      setCardData(prev => ({ ...prev, [name]: formattedValue }));
    }
    // Limit CVV to 3 digits
    else if (name === 'cvv') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 3);
      setCardData(prev => ({ ...prev, [name]: formattedValue }));
    }
    else {
      setCardData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const processCardPayment = async () => {
    setLoading(true);
    
    // Validate form
    if (!cardData.cardNumber || !cardData.cardHolder || !cardData.expiryDate || !cardData.cvv) {
      alert('Please fill in all credit card details');
      setLoading(false);
      return;
    }

    if (cardData.cardNumber.replace(/\s/g, '').length !== 16) {
      alert('Please enter a valid 16-digit card number');
      setLoading(false);
      return;
    }

    if (cardData.cvv.length !== 3) {
      alert('Please enter a valid 3-digit CVV');
      setLoading(false);
      return;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Move to OTP step
    setCurrentStep('otp');
    setLoading(false);
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    
    // Simulate OTP verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Accept any OTP - update order status for successful payment
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          delivery_status: 'confirmed',
          status: 'confirmed'
        })
        .eq('id', orderId);
      
      setCurrentStep('success');
      
      // Redirect to success page after delay
      setTimeout(() => {
        navigate(`/order-success/${orderId}`);
      }, 3000);
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to order confirmation...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">SecurePay</h1>
            </div>
            <p className="text-gray-600">OTP Verification</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              {/* Back Button */}
              <button
                onClick={() => setCurrentStep('card')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Payment
              </button>

              {/* OTP Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Enter OTP</h2>
                <p className="text-gray-600 text-sm">
                  We've sent a 6-digit verification code to your mobile number ending with {phone?.slice(-4)}
                </p>
              </div>

              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?{' '}
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Resend OTP
                  </button>
                </p>
              </div>

              {/* Verify Button */}
              <button
                onClick={verifyOtp}
                disabled={!isOtpComplete || otpLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3 shadow-lg transition-all duration-200"
              >
                {otpLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Verify & Complete Payment
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">Your transaction is secure</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              © 2024 SecurePay. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-md">
        {/* Payment Gateway Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SecurePay</h1>
          </div>
          <p className="text-gray-600">Safe and Secure Payment Processing</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Order Summary */}
          <div className="bg-gray-50 p-6 border-b">
            <h2 className="font-semibold text-gray-800 mb-4 text-lg">Payment Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded text-xs">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount to Pay:</span>
                <span className="font-bold text-lg text-blue-600">₹{amount}</span>
              </div>
            </div>
          </div>

          {/* Credit Card Form */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-800 text-lg">Payment Details</h2>
              <div className="flex gap-2">
                <div className="w-8 h-5 bg-blue-600 rounded-sm"></div>
                <div className="w-8 h-5 bg-red-500 rounded-sm"></div>
                <div className="w-8 h-5 bg-yellow-400 rounded-sm"></div>
                <div className="w-8 h-5 bg-green-500 rounded-sm"></div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleCardInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Card Holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Holder Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardData.cardHolder}
                    onChange={handleCardInputChange}
                    placeholder="Enter full name as on card"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardData.expiryDate}
                      onChange={handleCardInputChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardInputChange}
                      placeholder="123"
                      maxLength={3}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 p-3 bg-green-50 rounded-lg border border-green-200">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Your payment is secure and encrypted</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={processCardPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg mt-6 flex items-center justify-center gap-3 shadow-lg transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay ₹{amount}
                </>
              )}
            </button>

            {/* Accepted Cards */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-3">We accept</p>
              <div className="flex justify-center gap-4">
                <div className="w-10 h-6 bg-blue-900 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">MC</span>
                </div>
                <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">RU</span>
                </div>
                <div className="w-10 h-6 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2024 SecurePay. All rights reserved. | 
            <a href="#" className="text-blue-600 hover:underline ml-1">Privacy Policy</a> | 
            <a href="#" className="text-blue-600 hover:underline ml-1">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentGateway;