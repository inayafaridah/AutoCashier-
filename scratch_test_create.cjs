const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCreate() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const loginJson = await loginRes.json();
    console.log('Login Response:', loginJson);

    if (!loginJson.data || !loginJson.data.token) {
      console.error('Login failed, no token returned!');
      return;
    }

    const token = loginJson.data.token;
    
    // Create product
    const createRes = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sku: 'TEST-SKU-' + Date.now(),
        name: 'Auto Test Product',
        price: 7500,
        category: 'Beverage',
        ai_label: 'test_ai',
        stock: 50
      })
    });
    const createJson = await createRes.json();
    console.log('Create Response:', createJson);

    if (createJson.status === 'success' && createJson.data && createJson.data.id) {
      const prodId = createJson.data.id;

      // Update product
      const updateRes = await fetch(`http://localhost:5000/api/products/${prodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Auto Test Product Updated',
          price: 9000
        })
      });
      const updateJson = await updateRes.json();
      console.log('Update Response:', updateJson);

      // Delete product
      const deleteRes = await fetch(`http://localhost:5000/api/products/${prodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const deleteJson = await deleteRes.json();
      console.log('Delete Response:', deleteJson);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testCreate();
