import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://sbiksbuozyycaxxqqnty.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaWtzYnVvenl5Y2F4eHFxbnR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODIxODUsImV4cCI6MjA3Mzc1ODE4NX0.bduY6sP8VM_yCLH3CMi4bfqbxqGvtI6MsRdf-ozSx7E"
export const supabase = createClient(supabaseUrl, supabaseKey)
