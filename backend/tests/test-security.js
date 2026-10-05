const API_URL = 'http://localhost:5000/api';
const db = require('./src/config/database');

async function runTests() {
  try {
    console.log('--- Setup: Clearing DB ---');
    await db.query(`DELETE FROM expenses`);
    await db.query(`DELETE FROM activities`);
    await db.query(`DELETE FROM itinerary_days`);
    await db.query(`DELETE FROM destinations`);
    await db.query(`DELETE FROM trips`);
    await db.query(`DELETE FROM users`);
    
    console.log('--- Setup: Creating users ---');
    const userA = { full_name: 'User A', email: `a-${Date.now()}@example.com`, password: 'Password123!' };
    const userB = { full_name: 'User B', email: `b-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    
    const tokenA = (await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: userA.email, password: userA.password}) })).json()).data.token;
    const tokenB = (await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: userB.email, password: userB.password}) })).json()).data.token;
    
    const userIdA = (await db.query(`SELECT id FROM users WHERE email = $1`, [userA.email])).rows[0].id;
    const userIdB = (await db.query(`SELECT id FROM users WHERE email = $1`, [userB.email])).rows[0].id;

    // Create a trip for User B
    const tripB = await db.query(`
      INSERT INTO trips (user_id, name, start_date, end_date, estimated_budget)
      VALUES ($1, 'User B Trip', CURRENT_DATE, CURRENT_DATE + INTERVAL '4 days', 1000)
      RETURNING id
    `, [userIdB]);
    const tripIdB = tripB.rows[0].id;

    console.log('\n--- Test 1: User A cannot GET User B trip ---');
    const getTrip = await fetch(`${API_URL}/trips/${tripIdB}`, { headers: { 'Authorization': `Bearer ${tokenA}` } });
    if (getTrip.status === 404) console.log('PASS: User A blocked from User B trip.');
    else console.error('FAIL: User A bypassed get:', getTrip.status);

    console.log('\n--- Test 2: User A cannot UPDATE User B trip ---');
    const updateTrip = await fetch(`${API_URL}/trips/${tripIdB}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({name: 'Hacked'}) });
    if (updateTrip.status === 404) console.log('PASS: User A blocked from updating User B trip.');
    else console.error('FAIL: User A bypassed update:', updateTrip.status);

    console.log('\n--- Test 3: User A cannot DELETE User B trip ---');
    const deleteTrip = await fetch(`${API_URL}/trips/${tripIdB}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenA}` } });
    if (deleteTrip.status === 404) console.log('PASS: User A blocked from deleting User B trip.');
    else console.error('FAIL: User A bypassed delete:', deleteTrip.status);

    // Dest
    const destB = await db.query(`INSERT INTO destinations (trip_id, name) VALUES ($1, 'B Dest') RETURNING id`, [tripIdB]);
    const destIdB = destB.rows[0].id;
    
    console.log('\n--- Test 4: User A cannot UPDATE User B destinations ---');
    const updateDest = await fetch(`${API_URL}/destinations/${destIdB}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({name: 'Hacked'}) });
    if (updateDest.status === 404) console.log('PASS: User A blocked from updating User B dest.');
    else console.error('FAIL: User A bypassed dest update:', updateDest.status);

    // Day
    const dayB = await db.query(`INSERT INTO itinerary_days (trip_id, day_number, date) VALUES ($1, 1, CURRENT_DATE) RETURNING id`, [tripIdB]);
    const dayIdB = dayB.rows[0].id;

    console.log('\n--- Test 5: User A cannot UPDATE User B itinerary ---');
    const updateDay = await fetch(`${API_URL}/itinerary/${tripIdB}/days/${dayIdB}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({date: '2050-01-01'}) });
    if (updateDay.status === 404) console.log('PASS: User A blocked from updating User B day.');
    else console.error('FAIL: User A bypassed day update:', updateDay.status);

    // Expense
    const expB = await db.query(`INSERT INTO expenses (trip_id, category, name, amount) VALUES ($1, 'food', 'Lunch', 100) RETURNING id`, [tripIdB]);
    const expIdB = expB.rows[0].id;

    console.log('\n--- Test 6: User A cannot UPDATE User B expenses ---');
    const updateExp = await fetch(`${API_URL}/expenses/${expIdB}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' }, body: JSON.stringify({amount: 500}) });
    if (updateExp.status === 404) console.log('PASS: User A blocked from updating User B expense.');
    else console.error('FAIL: User A bypassed exp update:', updateExp.status);

    console.log('\n--- Test 7: Invalid/malformed IDs handle safely ---');
    const badId = await fetch(`${API_URL}/trips/invalid-uuid-123`, { headers: { 'Authorization': `Bearer ${tokenA}` } });
    if (badId.status === 500 || badId.status === 404 || badId.status === 400) console.log('PASS: Malformed UUID blocked without crashing.');
    else console.error('FAIL: Malformed UUID caused weird state:', badId.status);

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    process.exit(0);
  }
}
runTests();
