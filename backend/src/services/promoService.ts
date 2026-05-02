import { supabaseAdmin, supabase } from '../config/supabaseClient';

const client = () => supabaseAdmin || supabase;

export async function getAllPromos() {
  const { data, error } = await client()
    .from('promos')
    .select('*')
    .order('created_at', { ascending: false });
  return { ok: !error, data, error };
}

export async function createPromo(payload: any) {
  const { data, error } = await client()
    .from('promos')
    .insert([payload])
    .select()
    .single();
  return { ok: !error, data, error };
}

export async function deletePromo(id: string) {
  const { error } = await client()
    .from('promos')
    .delete()
    .eq('id', id);
  return { ok: !error, error };
}
