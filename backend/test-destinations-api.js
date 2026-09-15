const API_URL = 'http://localhost:5000/api';
let tokenUser1 = '';
let tokenUser2 = '';
let tripId = '';
let destId = '';

async function runTests() {
  try {
    console.log('--- 1. Setup ---');
    const u1 = { full_name: 'Dest User 1', email: `dest1-${Date.now()}@example.com`, password: 'Password123!' };
    const u2 = { full_name: 'Dest User 2', email: `dest2-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u1) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u2) });

    const l1 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u1.email, password: u1.password}) })).json();
    const l2 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u2.email, password: u2.password}) })).json();
    tokenUser1 = l1.data.token;
    tokenUser2 = l2.data.token;

    const tripData = { name: 'Dest Test Trip', start_date: '2026-10-01', end_date: '2026-10-14' };
    const tripRes = await (await fetch(`${API_URL}/trips`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify(tripData)
    })).json();
    tripId = tripRes.data.id;
    console.log('Setup complete. Trip created.');

    console.log('\n--- 2. Create Destination ---');
    const destData = {
      name: 'Eiffel Tower',
      address: 'Paris, France',
      latitude: 48.8584,
      longitude: 2.2945,
      description: 'First stop'
    };
    const createRes = await (await fetch(`${API_URL}/trips/${tripId}/destinations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify(destData)
    })).json();
    if (createRes.success) {
      destId = createRes.data.id;
      console.log('PASS: Destination created.', destId);
    } else {
      console.error('FAIL: Create', createRes);
    }

    console.log('\n--- 3. Verify Ownership Isolation (User 2 accesses User 1 destination) ---');
    const getFail = await fetch(`${API_URL}/trips/${tripId}/destinations/${destId}`, { headers: { 'Authorization': `Bearer ${tokenUser2}` } });
    if (getFail.status === 404) {
      console.log('PASS: User 2 blocked from reading User 1 destination (404)');
    } else {
      console.error('FAIL: User 2 could read!', await getFail.text());
    }

    console.log('\n--- 4. Edit Destination ---');
    const editRes = await (await fetch(`${API_URL}/trips/${tripId}/destinations/${destId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, 
      body: JSON.stringify({ name: 'Eiffel Tower Updated', address: destData.address, latitude: destData.latitude, longitude: destData.longitude, description: destData.description })
    })).json();
    if (editRes.data.name === 'Eiffel Tower Updated') {
      console.log('PASS: Destination updated.');
    } else {
      console.error('FAIL: Update', editRes);
    }

    console.log('\n--- 5. Delete Destination ---');
    const delRes = await fetch(`${API_URL}/trips/${tripId}/destinations/${destId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    if (delRes.status === 200) {
      console.log('PASS: Destination deleted.');
    } else {
      console.error('FAIL: Delete', await delRes.text());
    }

    console.log('\n--- 6. Test Maps Proxy API ---');
    const mapRes = await fetch(`${API_URL}/maps/search?q=Paris`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    const mapStatus = mapRes.status;
    if (mapStatus === 503 || mapStatus === 200) {
      console.log('PASS: Maps Proxy handled request. Status:', mapStatus);
    } else {
      console.error('FAIL: Maps proxy returned unexpected status:', mapStatus, await mapRes.text());
    }

  } catch (err) {
    console.error('Test error:', err);
  }
}
runTests();
