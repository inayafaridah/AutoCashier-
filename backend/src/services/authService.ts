import { supabaseAdmin as supabase } from '../config/supabaseClient';
import { comparePassword } from '../utils/passwords';
import { signToken } from '../utils/jwt';
import { User } from '../models/User';

export async function loginWithUsername(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  const user = data as User & { password_hash?: string; password?: string };

  const hash = user.password_hash || user.password;
  const match = hash ? await comparePassword(password, hash) : false;
  if (!match) return { ok: false, error: 'INVALID_CREDENTIALS' };

  const token = signToken({ sub: user.id, role: user.role, username: user.username });

  // remove sensitive fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...safeUser } = user as any;

  return { ok: true, token, user: safeUser };
}
