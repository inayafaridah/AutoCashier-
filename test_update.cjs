async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'adminautocashier' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.token;
  const updateRes = await fetch('http://localhost:5000/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ full_name: 'Super Admin Edited 3', email: 'test3@test.com', whatsapp: '1234' })
  });
  const updateData = await updateRes.json();
  console.log("Update:", updateData);
}
run();
