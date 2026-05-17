// Matches the actual 'users' table in Supabase
export interface User {
  id: string;
  username: string;
  email?: string | null;
  whatsapp?: string | null;
  full_name?: string | null;
  role: 'super_admin' | 'admin' | 'staff' | string;
  reset_token?: string | null;
  created_at?: string;
}
