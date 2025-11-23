import { useState } from "react";
import { supabase } from "./utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { User, Store, Truck, Package } from "lucide-react";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"customer" | "retailer" | "wholesaler" | "delivery_partner">("customer");
  const [vehicleType, setVehicleType] = useState(""); // For delivery partners
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert user details into users table
        const { error: userError } = await supabase.from("users").insert({
          auth_id: authData.user.id,
          email,
          name,
          phone,
          role,
        });

        if (userError) {
          console.error("User table error:", userError);
          throw userError;
        }

        // 3. If delivery partner, create delivery partner profile
        if (role === "delivery_partner") {
          console.log("Creating delivery partner with auth_id:", authData.user.id);
          
          const { error: partnerError } = await supabase
            .from("delivery_partners")
            .insert({
              auth_id: authData.user.id,
              name: name,
              phone: phone,
              vehicle_type: vehicleType,
              is_available: true,
            });

          if (partnerError) {
            console.error("Delivery partner error:", partnerError);
            throw partnerError;
          }
          
          console.log("Delivery partner created successfully!");
        }

        alert("✅ Signup successful! You can now login.");
        navigate("/login");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { 
      value: "customer", 
      label: "Customer", 
      icon: User, 
      gradient: "from-primary to-primary-light",
      border: "border-primary",
      bg: "bg-primary/10",
      text: "text-primary",
      description: "Shop and order products" 
    },
    { 
      value: "retailer", 
      label: "Retailer", 
      icon: Store, 
      gradient: "from-secondary to-secondary-light",
      border: "border-secondary",
      bg: "bg-secondary/10",
      text: "text-secondary",
      description: "Manage store inventory" 
    },
    { 
      value: "wholesaler", 
      label: "Wholesaler", 
      icon: Package, 
      gradient: "from-accent to-accent-light",
      border: "border-accent",
      bg: "bg-accent/10",
      text: "text-accent",
      description: "Supply products in bulk" 
    },
    { 
      value: "delivery_partner", 
      label: "Delivery Partner", 
      icon: Truck, 
      gradient: "from-neutral to-neutral-light",
      border: "border-neutral",
      bg: "bg-neutral/10",
      text: "text-neutral",
      description: "Deliver orders to customers" 
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">
          Create Account
        </h1>
        <p className="text-center text-muted-foreground mb-6">Join Live MART today</p>

        {error && (
          <div className="alert-warning px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? `${option.border} ${option.bg}`
                        : "border-border hover:border-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 ${isSelected ? option.text : "text-muted-foreground"}`} />
                      <span className={`font-semibold ${isSelected ? option.text : "text-foreground"}`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
              placeholder="your@email.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
              placeholder="+91 XXXXXXXXXX"
            />
          </div>

          {/* Vehicle Type - Only for Delivery Partners */}
          {role === "delivery_partner" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
              >
                <option value="">Select vehicle type</option>
                <option value="Bike">Bike/Motorcycle</option>
                <option value="Scooter">Scooter</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-button-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-primary font-semibold hover:text-[hsl(var(--link-hover))] transition-colors"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;