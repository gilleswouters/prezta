import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing from environment variables.")
}

export const SUPABASE_URL = supabaseUrl || 'http://localhost:54321'
export const SUPABASE_ANON_KEY = supabaseAnonKey || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'dummy-key')
