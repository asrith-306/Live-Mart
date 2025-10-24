import { supabase } from '../supabaseClient.js';

export type SignupForm = {
  name: string
  email: string
  password: string
  role: "customer" | "retailer" | "wholesaler"
  phone?: string
  location?: string
}

export async function loginUser({
  email,
  password,
}: {
  email: string
  password: string
}) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function signUpUser(form: SignupForm) {
  // Step 1: Sign up in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
  })

  if (authError) throw authError

  const authId = authData.user?.id
  if (!authId) throw new Error("Signup failed: no auth ID returned")

  // Step 2: Insert into users table
  const { error: dbError } = await supabase.from("users").insert({
    auth_id: authId,
    name: form.name,
    email: form.email,
    role: form.role,
    phone: form.phone,
    location: form.location,
  })

  if (dbError) throw dbError

  return authData
}
