import { Request, Response } from 'express';
import { loginWithUsername } from '../services/authService';

export async function loginController(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ status: 'error', error: 'INVALID_INPUT' });

  const result = await loginWithUsername(username, password);
  if (!result.ok) return res.status(401).json({ status: 'error', error: result.error || 'LOGIN_FAILED' });

  return res.json({ status: 'success', data: { token: result.token, user: result.user } });
}

export function meController(req: Request, res: Response) {
  // user injected by auth middleware
  const user = (req as any).user;
  if (!user) return res.status(401).json({ status: 'error', error: 'UNAUTHORIZED' });
  return res.json({ status: 'success', data: user });
}
