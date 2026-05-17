const fs = require('fs');
async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password: 'adminautocashier' })
  });
  const loginData = await loginRes.json();
  console.log("Login:", loginData);
  if(loginData.data && loginData.data.token) {
      console.log("Got token");
  } else {
      console.log("No token in response", loginData);
  }
}
run();
