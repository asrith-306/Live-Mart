import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Starting...");

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        setStatus("Checking authentication...");
        console.log("🔍 Step 1: Starting auth callback");
        console.log("URL:", window.location.href);
        
        // Give Supabase a moment to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setStatus("Getting session...");
        console.log("🔍 Step 2: Getting session");
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log("Session result:", { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: sessionError 
        });

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(sessionError.message);
        }

        if (!session?.user) {
          console.error("No session found");
          throw new Error("No session found. Please try logging in again.");
        }

        if (!mounted) return;

        setStatus("Fetching profile...");
        console.log("🔍 Step 3: User found:", session.user.id);
        
        const userId = session.user.id;
        
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("auth_id", userId)
          .maybeSingle();

        console.log("User data:", { userData, error: userError });

        if (userError) {
          console.error("User fetch error:", userError);
        }

        if (!mounted) return;

        // Create profile if it doesn't exist
        if (!userData) {
          setStatus("Creating profile...");
          console.log("🔍 Step 4: Creating new profile");
          
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              auth_id: userId,
              email: session.user.email || "",
              name: session.user.email?.split('@')[0] || "User",
              role: "customer",
              phone: "",
              location: ""
            });

          if (insertError) {
            console.error("Insert error:", insertError);
          }

          console.log("✅ Step 5: Redirecting to /customer");
          if (mounted) navigate("/customer", { replace: true });
          return;
        }

        // Redirect based on role
        const routes: Record<string, string> = {
          customer: "/customer",
          retailer: "/retailer",
          wholesaler: "/wholesaler",
          delivery_partner: "/delivery-dashboard"
        };

        const route = routes[userData.role] || "/customer";
        console.log("✅ Step 5: Redirecting to:", route);
        
        if (mounted) {
          setStatus("Redirecting...");
          navigate(route, { replace: true });
        }

      } catch (err: any) {
        console.error("❌ Error in handleCallback:", err);
        if (mounted) {
          setError(err.message || "Authentication failed");
          setTimeout(() => {
            if (mounted) navigate("/login", { replace: true });
          }, 3000);
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">✗</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Authentication Failed</h2>
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <p className="text-gray-600 text-sm mb-4">Redirecting to login...</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-t-4 border-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl">🔐</div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          Welcome to Live MART!
        </h2>
        
        <p className="text-gray-700 font-semibold text-lg mb-2">
          {status}
        </p>
        
        <p className="text-gray-500 text-sm mb-8">
          Please wait while we verify your credentials
        </p>
        
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Taking longer than expected?{" "}
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="text-blue-600 hover:underline font-semibold"
            >
              Return to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}