import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser, loginWithGoogle, checkUserExists, createUserProfile } from "./services/authService"
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
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
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
        navigate("/customer");
      }
    }
    checkSession()
  }, [])

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
      const result = await loginUser(form)
      
      if (result.user && onLogin) {
        onLogin(result.user.id);
      }
      
      // Redirect immediately
      navigate("/customer");
      
    } catch (err: any) {
      setError(err.message)
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
      navigate("/customer");
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show profile form if new Google user
  if (showProfileForm) {
    return (
      <form
        onSubmit={handleProfileSubmit}
        className="space-y-4 p-4 max-w-md mx-auto border rounded"
      >
        <h2 className="text-xl font-bold">Complete Your Profile</h2>

        <input
          name="name"
          placeholder="Full Name"
          value={profile.name}
          onChange={handleProfileChange}
          className="border p-2 w-full"
          required
        />

        <input
          name="phone"
          placeholder="Phone Number"
          value={profile.phone}
          onChange={handleProfileChange}
          className="border p-2 w-full"
          required
        />

        <select
          name="role"
          value={profile.role}
          onChange={handleProfileChange}
          className="border p-2 w-full"
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
          className="border p-2 w-full"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>

        {error && <p className="text-red-600">{error}</p>}
      </form>
    )
  }

  // Default: normal login page
  return (
    <div className="space-y-4 p-4 max-w-md mx-auto border rounded">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <button
        onClick={handleGoogleLogin}
        className="bg-red-600 text-white px-4 py-2 rounded w-full"
      >
        Login with Google
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}