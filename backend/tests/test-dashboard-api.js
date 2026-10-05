const API_URL = 'http://localhost:5000/api';
let tokenUser = '';
let tripId = '';

async function runTests() {
  try {
    console.log('--- Setup: Creating user and trips ---');
    const user = { full_name: 'Dash User', email: `dash-${Date.now()}@example.com`, password: 'Password123!' };
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
    const l1 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: user.email, password: user.password}) })).json();
    tokenUser = l1.data.token;

    // Create a trip starting tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const t1 = await (await fetch(`${API_URL}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser}` }, 
      body: JSON.stringify({ name: 'Dash Trip 1', estimated_budget: 1000, start_date: tomorrow.toISOString().split('T')[0], end_date: nextWeek.toISOString().split('T')[0] }) })).json();
    tripId = t1.data.id;
    console.log('Setup complete.');

    console.log('\n--- Test 1: Empty Dashboard State ---');
    // Fetch before we add anything else
    const dash1 = await (await fetch(`${API_URL}/dashboard`, { headers: { 'Authorization': `Bearer ${tokenUser}` } })).json();
    if (dash1.success && dash1.data.total_trips === 1) console.log('PASS: Dashboard loads total trips.');
    else console.error('FAIL: Dashboard data incorrect', dash1);

    console.log('\n--- Test 2: Dashboard Destination Rule ---');
    // Add destination
    const destRes = await (await fetch(`${API_URL}/trips/${tripId}/destinations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser}` },
      body: JSON.stringify({ name: 'Dash Dest', address: 'London', latitude: 51.5074, longitude: -0.1278 })
    })).json();
    
    const dash2 = await (await fetch(`${API_URL}/dashboard`, { headers: { 'Authorization': `Bearer ${tokenUser}` } })).json();
    if (dash2.data.next_upcoming_trip.destination && dash2.data.next_upcoming_trip.destination.latitude === '51.5074') {
      console.log('PASS: Dashboard selects destination with valid coordinates.');
    } else console.error('FAIL: Destination rule failed', dash2.data.next_upcoming_trip);

    console.log('\n--- Test 3: Dashboard Budget Aggregation ---');
    // Add expense
    await fetch(`${API_URL}/trips/${tripId}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser}` },
      body: JSON.stringify({ name: 'Food', amount: 200, category: 'food' })
    });

    const dash3 = await (await fetch(`${API_URL}/dashboard`, { headers: { 'Authorization': `Bearer ${tokenUser}` } })).json();
    if (dash3.data.next_upcoming_trip.budget_summary.total_spent === 200 && dash3.data.next_upcoming_trip.budget_summary.remaining_budget === 800) {
      console.log('PASS: Dashboard budget aggregation is correct.');
    } else console.error('FAIL: Dashboard budget failed', dash3.data.next_upcoming_trip.budget_summary);

    console.log('\n--- Test 4: Dashboard Next Activity Rule ---');
    // Add day and activity
    const day = await (await fetch(`${API_URL}/trips/${tripId}/itinerary/days`, { 
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser}` }, 
      body: JSON.stringify({ day_number: 1, date: tomorrow.toISOString().split('T')[0] }) })).json();
    
    await fetch(`${API_URL}/trips/${tripId}/itinerary/days/${day.data.id}/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser}` },
      body: JSON.stringify({ name: 'Dash Activity', start_time: '10:00' })
    });

    const dash4 = await (await fetch(`${API_URL}/dashboard`, { headers: { 'Authorization': `Bearer ${tokenUser}` } })).json();
    if (dash4.data.next_upcoming_trip.next_activity && dash4.data.next_upcoming_trip.next_activity.name === 'Dash Activity') {
      console.log('PASS: Dashboard next activity selected correctly.');
    } else console.error('FAIL: Dashboard next activity failed', dash4.data.next_upcoming_trip);

    console.log('\n--- Test 5: Weather API Missing Coordinates ---');
    const weather1 = await fetch(`${API_URL}/weather`, { headers: { 'Authorization': `Bearer ${tokenUser}` } });
    if (weather1.status === 400) console.log('PASS: Weather API rejects missing coordinates.');
    else console.error('FAIL: Weather API allowed missing coordinates.');

    console.log('\n--- Test 6: Weather API Success / Missing Key ---');
    const weather2 = await fetch(`${API_URL}/weather?lat=51.5074&lon=-0.1278`, { headers: { 'Authorization': `Bearer ${tokenUser}` } });
    if (weather2.status === 200 || weather2.status === 503) {
      console.log('PASS: Weather API handled gracefully. HTTP status:', weather2.status);
    } else {
      console.error('FAIL: Weather API crashed or returned unexpected code', await weather2.text());
    }

  } catch (err) {
    console.error('Test Error:', err);
  }
}
runTests();
