import { supabaseAdmin as supabase } from '../../config/supabaseClient';
import { comparePassword } from '../../utils/passwords';
import { signToken } from '../../utils/jwt';

export async function loginWithUsername(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, full_name, role, created_at, whatsapp, password, avatar_url, branch_id')
    .eq('username', username)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  const hash = data.password;
  const match = hash ? await comparePassword(password, hash) : false;
  if (!match) return { ok: false, error: 'INVALID_CREDENTIALS' };

  const token = signToken({ sub: data.id, role: data.role, username: data.username });

  // Return safe user (no password)
  const { password: _pw, ...safeUser } = data;

  return { ok: true, token, user: safeUser };
}
