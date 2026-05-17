import { signToken } from '../src/utils/jwt';
import fs from 'fs';

async function test() {
  const token = signToken({ sub: '6cae98bd-7ed7-4704-84e9-4c3b619c49de', role: 'admin', username: 'superadmin' });
  console.log("Generated token:", token);

  const fetch = (await import('node-fetch')).default;
  const profileRes = await fetch('http://localhost:5000/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      full_name: 'Super Admin Edited',
      email: 'superadmin2@autocashier.com',
      whatsapp: '081234567890'
    })
  });
  const profileData = await profileRes.json();
  console.log("Profile update:", profileData);
}

test();
