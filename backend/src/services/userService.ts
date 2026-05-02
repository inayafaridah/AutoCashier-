import { supabase, supabaseAdmin } from '../config/supabaseClient';

export async function getAllUsers() {
  try {
    const db = supabaseAdmin || supabase;
    // Fetch profiles and join with branch name if possible
    const { data, error } = await db
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        branch_id,
        branches (name)
      `)
      .order('full_name');

    if (error) throw error;
    
    return { 
      ok: true, 
      data: data.map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        location: u.branches?.name || 'Unassigned',
        branch_id: u.branch_id,
        status: 'Active' // Profiles in DB are generally active
      }))
    };
  } catch (err) {
    console.error('[userService] ❌ Error fetching users:', err);
    return { ok: false, error: err };
  }
}

export async function createUser(userData: any) {
  try {
    const db = supabaseAdmin;
    if (!db) throw new Error('Admin privileges required to create users');

    // 1. Create auth user
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { full_name: userData.name }
    });

    if (authError) throw authError;

    // 2. Profile is usually created by a trigger, but let's ensure it's updated with the role
    const { error: profError } = await db
      .from('profiles')
      .update({
        role: userData.role,
        branch_id: userData.branchId || null
      })
      .eq('id', authData.user.id);

    if (profError) throw profError;

    return { ok: true, data: authData.user };
  } catch (err) {
    console.error('[userService] ❌ Error creating user:', err);
    return { ok: false, error: err };
  }
}

export async function updateUser(userId: string, updates: any) {
  try {
    const db = supabaseAdmin || supabase;
    const { error } = await db
      .from('profiles')
      .update({
        full_name: updates.name,
        role: updates.role,
        branch_id: updates.branchId || null
      })
      .eq('id', userId);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error('[userService] ❌ Error updating user:', err);
    return { ok: false, error: err };
  }
}

export async function deleteUser(userId: string) {
  try {
    const db = supabaseAdmin;
    if (!db) throw new Error('Admin privileges required to delete users');

    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) throw error;
    
    return { ok: true };
  } catch (err) {
    console.error('[userService] ❌ Error deleting user:', err);
    return { ok: false, error: err };
  }
}
