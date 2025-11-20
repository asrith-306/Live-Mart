import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
  onLogin: (id: string) => void;
}

export default function OTPVerification({ email, onBack, onLogin }: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

const handleVerifyOTP = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    // Log everything for debugging
    console.log("Attempting to verify:");
    console.log("Email:", email);
    console.log("OTP entered:", otp);
    console.log("OTP length:", otp.length);
    
    // Try verification
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(), // Ensure email is clean
      token: otp.trim(), // Remove any whitespace
      type: "email",
    });

    console.log("Response:", { data, error: verifyError });

    if (verifyError) {
      console.error("Verification failed:", verifyError);
      throw verifyError;
    }

    if (data.user) {
      console.log("Success! User:", data.user);
      onLogin(data.user.id);
      
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("auth_id", data.user.id)
        .single();
      
      if (userData) {
        const role = userData.role;
        if (role === "customer") navigate("/customer");
        else if (role === "retailer") navigate("/retailer");
        else if (role === "wholesaler") navigate("/wholesaler");
        else if (role === "delivery_partner") navigate("/delivery-dashboard");
        else navigate("/customer");
      } else {
        navigate("/customer");
      }
    }
  } catch (err: any) {
    console.error("Full error:", err);
    setError(err.message || "Invalid OTP. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handleResendOTP = async () => {
    setResending(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) throw error;
      alert("✅ New OTP sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a 6-digit OTP to
          </p>
          <p className="text-blue-600 font-semibold">{email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="000000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={handleResendOTP}
            disabled={resending}
            className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend OTP"}
          </button>

          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 w-full text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}