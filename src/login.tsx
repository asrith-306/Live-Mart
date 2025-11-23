import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { loginWithGoogle, checkUserExists, createUserProfile } from "./services/authService"
import { supabase } from "./utils/supabaseClient"

type LoginForm = { email: string; password: string }

type ProfileForm = {
  name: string
  phone: string
  role: "customer" | "retailer" | "wholesaler"
  location: string
}

interface LoginProps {
  onLogin?: (id: string) => void;
  userRole?: string | null;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    phone: "",
    role: "customer",
    location: "",
  })

  // When user returns from Google login
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) return

      // Check if user exists in users table
      const existing = await checkUserExists(user.id)
      if (!existing) {
        setShowProfileForm(true)
      } else {
        if (onLogin) onLogin(user.id);
        redirectBasedOnRole(existing.role);
      }
    }
    checkSession()
  }, [])

  const redirectBasedOnRole = (role: string) => {
    if (role === "customer") {
      navigate("/customer");
    } else if (role === "retailer") {
      navigate("/retailer");
    } else if (role === "wholesaler") {
      navigate("/wholesaler");
    } else if (role === "delivery_partner") {
      navigate("/delivery-dashboard");
    } else {
      navigate("/customer");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Send magic link to email
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: form.email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true
        }
      });

      if (otpError) {
        console.error("OTP Error:", otpError);
        throw otpError;
      }

      setEmailSent(true);
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) throw new Error("No authenticated user found")

      await createUserProfile({
        auth_id: user.id,
        name: profile.name,
        email: user.email ?? "",
        phone: profile.phone,
        role: profile.role,
        location: profile.location,
      })
      
      if (onLogin) {
        onLogin(user.id);
      }
      
      redirectBasedOnRole(profile.role);
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show email sent confirmation
  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 max-w-md w-full text-center">
          <div className="bg-accent/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Check Your Email! 📧
          </h2>
          
          <p className="text-muted-foreground mb-2">
            We've sent a magic link to
          </p>
          <p className="text-primary font-semibold mb-6">{form.email}</p>
          
          <div className="alert-success p-4 mb-6 rounded-lg">
            <p className="text-sm">
              Click the link in your email to securely log in. The link will expire in 60 minutes.
            </p>
          </div>

          <button
            onClick={() => setEmailSent(false)}
            className="text-primary font-semibold hover:text-[hsl(var(--link-hover))] transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Show profile form if new Google user
  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-foreground mb-6">Complete Your Profile</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Full Name"
              value={profile.name}
              onChange={handleProfileChange}
              className="border border-input bg-background text-foreground p-3 w-full rounded-lg focus-primary transition-base"
              required
            />

            <input
              name="phone"
              placeholder="Phone Number"
              value={profile.phone}
              onChange={handleProfileChange}
              className="border border-input bg-background text-foreground p-3 w-full rounded-lg focus-primary transition-base"
              required
            />

            <select
              name="role"
              value={profile.role}
              onChange={handleProfileChange}
              className="border border-input bg-background text-foreground p-3 w-full rounded-lg focus-primary transition-base"
            >
              <option value="customer">Customer</option>
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
            </select>

            <input
              name="location"
              placeholder="Location"
              value={profile.location}
              onChange={handleProfileChange}
              className="border border-input bg-background text-foreground p-3 w-full rounded-lg focus-primary transition-base"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="gradient-primary text-white px-4 py-3 rounded-lg w-full font-semibold hover:shadow-button-hover transition-all"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>

            {error && <p className="text-secondary text-center text-sm">{error}</p>}
          </form>
        </div>
      </div>
    )
  }

  // Default: Login page with Magic Link
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-foreground">
          Welcome Back
        </h1>
        <p className="text-center text-muted-foreground mb-6">Login to Live MART</p>

        {error && (
          <div className="alert-warning px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-white font-semibold py-3 rounded-lg hover:shadow-button-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? "Sending Magic Link..." : "Login with Email"}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-4 text-muted-foreground text-sm">OR</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-card border-2 border-border text-foreground font-semibold py-3 rounded-lg hover:bg-muted transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-muted-foreground mt-6">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-primary font-semibold hover:text-[hsl(var(--link-hover))] transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}