import { useState } from "react"
import { signUpUser, signInWithGoogle } from "./services/authService.js"
import { supabase } from "./utils/supabaseClient"

type SignupForm = {
  name: string
  email: string
  password: string
  role: "customer" | "retailer" | "wholesaler"
  phone: string
  location: string
}

export default function Signup() {
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    role: "customer",
    phone: "",
    location: "",
  })

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === "role" ? (value as SignupForm["role"]) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signUpUser(form)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // Supabase redirects automatically on success
    } catch (err: any) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto border rounded">
      <h2 className="text-xl font-bold text-center">Signup</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

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

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="customer">Customer</option>
          <option value="retailer">Retailer</option>
          <option value="wholesaler">Wholesaler</option>
        </select>

        {(form.role === "retailer" ||
          form.role === "wholesaler" ||
          form.role === "customer") && (
          <>
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              className="border p-2 w-full"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Signing up..." : "Signup"}
        </button>
      </form>

      {/* Google Signup */}
      <div className="text-center mt-4">
        <p className="text-gray-500 text-sm mb-2">or</p>
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full"
        >
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>

      {error && <p className="text-red-600 text-center mt-2">{error}</p>}
      {success && <p className="text-green-600 text-center mt-2">Signup successful!</p>}
    </div>
  )
}
