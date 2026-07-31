import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vysoirkwthldlidayhfy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5c29pcmt3dGhsZGxpZGF5aGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzA4MzIsImV4cCI6MjEwMTAwNjgzMn0.fWbQIk2q9lYMRdyOE-CmK--70STGFQUWt2Pl7ZmfttQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)