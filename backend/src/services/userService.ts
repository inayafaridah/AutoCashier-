import { supabase, supabaseAdmin } from '../config/supabaseClient';
import bcrypt from 'bcryptjs';

export async function getAllUsers() {
  try {
    const db = supabaseAdmin || supabase;
    // Fetch users from the 'users' table
    const { data, error } = await db
      .from('users')
      .select(`
        id,
        full_name,
        email,
        role,
        username,
        avatar_url,
        member_points (
          balance
        )
      `)
      .order('full_name');

    if (error) throw error;
    
    return { 
      ok: true, 
      data: (data || []).map((u: any) => ({
        id: u.id,
        name: u.full_name || u.username,
        full_name: u.full_name,
        username: u.username,
        profile_picture: u.avatar_url,
        email: u.email,
        role: u.role === 'super_admin' ? 'Super Admin' : (u.role === 'branch_admin' ? 'Branch Admin' : u.role),
        location: 'All Branches', // Simplified for now
        status: 'Active',
        points: u.member_points ? (Array.isArray(u.member_points) ? (u.member_points[0]?.balance || 0) : (u.member_points.balance || 0)) : 0
      }))
    };
  } catch (err) {
    console.error('[userService] ❌ Error fetching users:', err);
    return { ok: false, error: err };
  }
}

export async function createUser(userData: any) {
  try {
    const db = supabaseAdmin || supabase;
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(userData.password, salt);

    const { data, error } = await db
      .from('users')
      .insert([{
        username: userData.email.split('@')[0], // Use email prefix as default username
        email: userData.email,
        password: hash,
        full_name: userData.name,
        role: userData.role === 'Super Admin' ? 'super_admin' : (userData.role === 'Branch Admin' ? 'branch_admin' : 'member')
      }])
      .select()
      .single();

    if (error) throw error;

    return { ok: true, data };
  } catch (err) {
    console.error('[userService] ❌ Error creating user:', err);
    return { ok: false, error: err };
  }
}

export async function updateUser(userId: string, updates: any) {
  try {
    const db = supabaseAdmin || supabase;
    const { error } = await db
      .from('users')
      .update({
        full_name: updates.name,
        role: updates.role === 'Super Admin' ? 'super_admin' : (updates.role === 'Branch Admin' ? 'branch_admin' : 'member'),
        email: updates.email
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
    const db = supabaseAdmin || supabase;
    const { error } = await db
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (error) throw error;
    
    return { ok: true };
  } catch (err) {
    console.error('[userService] ❌ Error deleting user:', err);
    return { ok: false, error: err };
  }
}

export async function assignMemberPromo(userId: string, promoData: any) {
  try {
    const db = supabaseAdmin || supabase;
    const { data, error } = await db
      .from('member_promos')
      .insert([{
        user_id: userId,
        code: promoData.code,
        discount_type: promoData.discount_type,
        discount_value: promoData.discount_value,
        min_purchase: promoData.min_purchase || 0,
        expires_at: promoData.expires_at || null,
        is_used: false
      }])
      .select()
      .single();

    if (error) throw error;
    return { ok: true, data };
  } catch (err) {
    console.error('[userService] ❌ Error assigning member promo:', err);
    return { ok: false, error: err };
  }
}
