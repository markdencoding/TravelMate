const API_URL = 'http://localhost:5000/api';
let tokenUser1 = '';
let tokenUser2 = '';
let tripId = '';

async function runTests() {
  try {
    console.log('--- 1. Setup: Create 2 Users ---');
    const u1 = { full_name: 'Trip User 1', email: `trip1-${Date.now()}@example.com`, password: 'Password123!' };
    const u2 = { full_name: 'Trip User 2', email: `trip2-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u1) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u2) });

    const l1 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u1.email, password: u1.password}) })).json();
    const l2 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u2.email, password: u2.password}) })).json();
    
    tokenUser1 = l1.data.token;
    tokenUser2 = l2.data.token;
    console.log('PASS: Users created and logged in.');

    console.log('\n--- 2. Create Trip (User 1) ---');
    const tripData = {
      name: 'Test Trip 1',
      description: 'A fun trip',
      start_date: '2026-12-01',
      end_date: '2026-12-10',
      estimated_budget: 1500.50
    };
    
    const createRes = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify(tripData)
    });
    const createData = await createRes.json();
    
    if (createData.success && createData.data.name === 'Test Trip 1') {
      tripId = createData.data.id;
      console.log('PASS: Trip created successfully.', tripId);
    } else {
      console.error('FAIL: Create Trip', createData);
    }

    console.log('\n--- 3. Get Trips (User 1) ---');
    const getRes = await (await fetch(`${API_URL}/trips`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } })).json();
    if (getRes.data.length === 1 && getRes.data[0].id === tripId) {
      console.log('PASS: Retrieved user trips successfully.');
    } else {
      console.error('FAIL: Get trips', getRes);
    }

    console.log('\n--- 4. Verify Ownership Isolation (User 2 tries to get User 1 trip) ---');
    const getUnauthorizedRes = await fetch(`${API_URL}/trips/${tripId}`, { headers: { 'Authorization': `Bearer ${tokenUser2}` } });
    if (getUnauthorizedRes.status === 404) {
      console.log('PASS: User 2 correctly rejected from viewing User 1 trip (404).');
    } else {
      console.error('FAIL: User 2 was able to access User 1 trip!', await getUnauthorizedRes.text());
    }

    console.log('\n--- 5. Edit Trip (User 1) ---');
    const updateRes = await (await fetch(`${API_URL}/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Updated Trip Name' })
    })).json();
    if (updateRes.data.name === 'Updated Trip Name') {
      console.log('PASS: Trip updated successfully.');
    } else {
      console.error('FAIL: Update trip', updateRes);
    }

    console.log('\n--- 6. Verify Ownership Isolation (User 2 tries to edit User 1 trip) ---');
    const editUnauthorizedRes = await fetch(`${API_URL}/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` },
      body: JSON.stringify({ name: 'Hacked Trip Name' })
    });
    if (editUnauthorizedRes.status === 404) {
      console.log('PASS: User 2 correctly rejected from editing User 1 trip (404).');
    } else {
      console.error('FAIL: User 2 was able to edit User 1 trip!', await editUnauthorizedRes.text());
    }

    console.log('\n--- 7. Delete Trip (User 1) ---');
    const deleteRes = await fetch(`${API_URL}/trips/${tripId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenUser1}` }
    });
    if (deleteRes.status === 200) {
      console.log('PASS: Trip deleted successfully.');
    } else {
      console.error('FAIL: Delete trip', await deleteRes.text());
    }

    console.log('\n--- 8. Verify Deletion ---');
    const checkDeleted = await fetch(`${API_URL}/trips/${tripId}`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    if (checkDeleted.status === 404) {
      console.log('PASS: Trip confirmed deleted.');
    } else {
      console.error('FAIL: Trip still exists!', await checkDeleted.text());
    }

    console.log('\nAll Backend API Tests Completed.');

  } catch (err) {
    console.error('Test Error:', err);
  }
}

runTests();
