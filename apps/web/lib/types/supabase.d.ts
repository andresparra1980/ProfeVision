import { SupabaseClient as SC } from '@supabase/supabase-js';
import { Database } from './database';

declare module '@supabase/supabase-js' {
  export type SupabaseClient<T = Database> = SC<T>;
} 