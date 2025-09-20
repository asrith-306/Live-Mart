import { useState } from "react"
import { signUpUser } from "./services/authService.js"

// Define the form type with role as a union
type SignupForm = {
  name: string
  email: string
  password: string
  role: "customer" | "retailer" | "wholesaler"
  phone: string
  location: string
}

export default function Signup() {
  // Fully type the form state
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    role: "customer", // default
    phone: "",
    location: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Type-safe handleChange
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      // Cast role value to correct union type
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-md mx-auto border rounded">
      <h2 className="text-xl font-bold">Signup</h2>

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

      {/* Role selector */}
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

      {/* Conditional fields */}
      {(form.role === "retailer" || form.role === "wholesaler" || form.role==="customer") && (
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
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Signing up..." : "Signup"}
      </button>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">Signup successful!</p>}
    </form>
  )
}
