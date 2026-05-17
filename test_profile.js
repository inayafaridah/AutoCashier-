async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' }) 
  });
  const loginData = await loginRes.json();
  console.log("Login:", loginData);

  if (loginData.data && loginData.data.token) {
    const token = loginData.data.token;
    const profileRes = await fetch('http://localhost:5000/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        full_name: 'Admin Test',
        email: 'admin@test.com',
        whatsapp: '08123456789'
      })
    });
    const profileData = await profileRes.json();
    console.log("Profile update:", profileData);
  }
}

test();
