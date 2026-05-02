export interface User {
  id: string;
  username: string;
  email?: string | null;
  full_name?: string | null;
  role: 'super_admin' | 'branch_admin' | 'staff' | string;
  branch_id?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
