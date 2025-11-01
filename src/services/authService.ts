import { supabase } from '@/utils/supabaseClient';

export type SignupForm = {
  name: string
  email: string
  password: string
  role: "customer" | "retailer" | "wholesaler"
  phone?: string
  location?: string
}

/**
 * Email + password login
 */
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

/**
 * Email + password signup
 * Also inserts the user’s info into the `users` table
 */
export async function signUpUser(form: SignupForm) {
  // Step 1: Sign up in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        name: form.name,
        role: form.role,
        phone: form.phone,
        location: form.location,
      },
    },
  })

  if (authError) throw authError

  const authId = authData.user?.id
  if (!authId) throw new Error("Signup failed: no auth ID returned")

  // Step 2: Insert into `users` table
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

/**
 * Google OAuth sign-in
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:5173/", // replace with your app URL when deployed
    },
  })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Logout function
 */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}


export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/login', // return to your login page
    },
  })
  if (error) throw error
  return data
}

export async function checkUserExists(authId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // ignore "no row found" error
  return data
}

export async function createUserProfile({
  auth_id,
  name,
  email,
  phone,
  role,
  location,
}: {
  auth_id: string
  name: string
  email: string
  phone: string
  role: string
  location: string
}) {
  const { error } = await supabase.from('users').insert({
    auth_id,
    name,
    email,
    phone,
    role,
    location,
  })
  if (error) throw error
}
