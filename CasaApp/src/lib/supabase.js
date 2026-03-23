import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://oxwznhcuevivgmsnadnr.supabase.co'
const supabaseAnonKey = 'sb_publishable_EAXtioj3--F1jF6QPRVRtg_L8VEH73Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})