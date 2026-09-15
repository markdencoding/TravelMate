const API_URL = 'http://localhost:5000/api/auth';
const testUser = {
  full_name: 'API Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'Password123!'
};

let token = '';

async function runTests() {
  try {
    console.log('--- 1. Testing Registration ---');
    const regRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    console.log('Registration Status:', regRes.status);
    console.log('Registration Data:', JSON.stringify(regData, null, 2));
    
    // Check if password hash is returned
    if (JSON.stringify(regData).includes('password')) {
      console.error('FAIL: Password or hash was returned in response!');
    } else {
      console.log('PASS: Password is not exposed.');
    }

    console.log('\n--- 2. Testing Duplicate Email ---');
    const dupRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 201) {
      console.log('Duplicate email correctly rejected with status:', dupRes.status);
      console.log('Message:', dupData.message);
    } else {
      console.error('FAIL: Duplicate email should have been rejected.');
    }

    console.log('\n--- 3. Testing Login ---');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    
    if (loginData.data && loginData.data.token) {
      token = loginData.data.token;
      console.log('PASS: JWT Generated.');
    } else {
      console.error('FAIL: No JWT in login response.');
    }

    if (JSON.stringify(loginData).includes('password')) {
      console.error('FAIL: Password or hash was returned in login response!');
    }

    console.log('\n--- 4. Testing Get Me ---');
    const meRes = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log('Get Me Status:', meRes.status);
    console.log('Get Me Data:', JSON.stringify(meData, null, 2));
    
    if (meData.data && meData.data.user && meData.data.user.email === testUser.email) {
      console.log('PASS: Correct user identity returned.');
    }

    console.log('\n--- 5. Testing Logout ---');
    const logoutRes = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const logoutData = await logoutRes.json();
    console.log('Logout Status:', logoutRes.status);
    console.log('Logout Message:', logoutData.message);

    console.log('\nAll API tests completed.');

  } catch (err) {
    console.error('API Test Error:', err.message);
  }
}

runTests();
