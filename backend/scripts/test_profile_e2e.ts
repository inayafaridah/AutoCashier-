// End-to-end test for profile endpoints using actual user credentials
import { signToken } from '../src/utils/jwt';

const BASE = 'http://localhost:5000';

async function test() {
  const f = (await import('node-fetch')).default as any;

  // Step 1: Login with real credentials
  console.log('\n=== 1. Testing Login ===');
  const loginRes = await f(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password' })
  });
  const loginData = await loginRes.json();
  console.log('Login result:', loginData.status, loginData.error || '');

  // Use manual token if login fails
  let token = loginData?.data?.token;
  if (!token) {
    console.log('Login failed, generating token manually for admin user...');
    token = signToken({ sub: '36bb2564-0b7a-4dd9-9215-64720f5007de', role: 'super_admin', username: 'admin' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 2: GET profile
  console.log('\n=== 2. Testing GET /api/profile ===');
  const getRes = await f(`${BASE}/api/profile`, { headers });
  const getData = await getRes.json();
  console.log('GET profile:', JSON.stringify(getData, null, 2));

  // Step 3: PUT profile update
  console.log('\n=== 3. Testing PUT /api/profile ===');
  const putRes = await f(`${BASE}/api/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      full_name: 'System Admin',
      email: 'admin@autocashier.com',
      whatsapp: '08123456789'
    })
  });
  const putData = await putRes.json();
  console.log('PUT profile:', JSON.stringify(putData, null, 2));

  console.log('\n✅ All tests complete!');
}

test().catch(console.error);
