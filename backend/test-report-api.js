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

    // Create a trip for User A
    const tripA = await db.query(`
      INSERT INTO trips (user_id, name, start_date, end_date, estimated_budget)
      VALUES ($1, 'Test Trip', CURRENT_DATE, CURRENT_DATE + INTERVAL '4 days', 1000)
      RETURNING id
    `, [userIdA]);
    const tripId = tripA.rows[0].id;

    // Insert 2 destinations
    const dest1 = await db.query(`INSERT INTO destinations (trip_id, name) VALUES ($1, 'D1') RETURNING id`, [tripId]);
    const dest2 = await db.query(`INSERT INTO destinations (trip_id, name) VALUES ($1, 'D2') RETURNING id`, [tripId]);

    // Insert 3 itinerary days
    const day1 = await db.query(`INSERT INTO itinerary_days (trip_id, day_number, date) VALUES ($1, 1, CURRENT_DATE) RETURNING id`, [tripId]);
    const day2 = await db.query(`INSERT INTO itinerary_days (trip_id, day_number, date) VALUES ($1, 2, CURRENT_DATE + INTERVAL '1 day') RETURNING id`, [tripId]);
    const day3 = await db.query(`INSERT INTO itinerary_days (trip_id, day_number, date) VALUES ($1, 3, CURRENT_DATE + INTERVAL '2 days') RETURNING id`, [tripId]);

    // Insert 4 activities (3 linked to destination 1, 1 not linked. 2 have costs)
    const act1 = await db.query(`INSERT INTO activities (itinerary_day_id, name, destination_id, estimated_cost) VALUES ($1, 'A1', $2, 100) RETURNING id`, [day1.rows[0].id, dest1.rows[0].id]);
    await db.query(`INSERT INTO activities (itinerary_day_id, name, destination_id, estimated_cost) VALUES ($1, 'A2', $2, 200) RETURNING id`, [day1.rows[0].id, dest1.rows[0].id]);
    await db.query(`INSERT INTO activities (itinerary_day_id, name, destination_id) VALUES ($1, 'A3', $2) RETURNING id`, [day2.rows[0].id, dest1.rows[0].id]);
    await db.query(`INSERT INTO activities (itinerary_day_id, name) VALUES ($1, 'A4') RETURNING id`, [day3.rows[0].id]);

    // Insert 3 expenses (Total: 400. Food: 150, Trans: 250)
    await db.query(`INSERT INTO expenses (trip_id, category, name, amount) VALUES ($1, 'food', 'Lunch', 100)`, [tripId]);
    await db.query(`INSERT INTO expenses (trip_id, category, name, amount) VALUES ($1, 'food', 'Snack', 50)`, [tripId]);
    await db.query(`INSERT INTO expenses (trip_id, category, name, amount, activity_id) VALUES ($1, 'transportation', 'Taxi', 250, $2)`, [tripId, act1.rows[0].id]);

    console.log('\n--- Test 1: Retrieve own report ---');
    const resA = await (await fetch(`${API_URL}/trips/${tripId}/report`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (resA.success && resA.data.trip.name === 'Test Trip') console.log('PASS: Report retrieved successfully.');
    else console.error('FAIL:', resA);

    console.log('\n--- Test 2: Cannot retrieve other user report ---');
    const resB = await fetch(`${API_URL}/trips/${tripId}/report`, { headers: { 'Authorization': `Bearer ${tokenB}` } });
    if (resB.status === 404) console.log('PASS: User B blocked from User A trip.');
    else console.error('FAIL: User B bypassed:', resB.status);

    console.log('\n--- Test 3: Aggregation values ---');
    const data = resA.data;
    if (data.expenses.count === 3 && data.summary.totalExpenses === 400) console.log('PASS: Expense totals correct. (No cartesian explosion)');
    else console.error('FAIL: Expense aggregation incorrect:', data.expenses.count, data.summary.totalExpenses);

    if (data.expenses.byCategory.food === 150 && data.expenses.byCategory.transportation === 250) console.log('PASS: Expense categories correct.');
    else console.error('FAIL: Expense categories incorrect:', data.expenses.byCategory);

    if (data.summary.estimatedBudget === 1000 && data.summary.remainingBudget === 600 && data.summary.budgetUtilization === 40) console.log('PASS: Budget calculations correct.');
    else console.error('FAIL: Budget calculations incorrect:', data.summary);

    if (data.trip.durationDays === 5) console.log('PASS: Duration is 5 days.');
    else console.error('FAIL: Duration incorrect:', data.trip.durationDays);

    if (data.itinerary.totalDays === 3 && data.itinerary.totalActivities === 4 && data.itinerary.activitiesWithLocations === 3 && data.itinerary.activitiesWithCosts === 2) console.log('PASS: Itinerary stats correct.');
    else console.error('FAIL: Itinerary stats incorrect:', data.itinerary);

    if (data.destinations.length === 2 && data.destinations.find(d => d.name === 'D1').has_activities === true && data.destinations.find(d => d.name === 'D2').has_activities === false) console.log('PASS: Destinations relationships correct.');
    else console.error('FAIL: Destinations incorrect:', data.destinations);

    console.log('\n--- Test 4: Edge Case - Empty Trip ---');
    const tripEmpty = await db.query(`INSERT INTO trips (user_id, name, estimated_budget) VALUES ($1, 'Empty', 0) RETURNING id`, [userIdA]);
    const resEmpty = await (await fetch(`${API_URL}/trips/${tripEmpty.rows[0].id}/report`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (resEmpty.data.summary.budgetUtilization === 0 && resEmpty.data.expenses.count === 0 && resEmpty.data.itinerary.totalDays === 0 && resEmpty.data.trip.durationDays === 0) console.log('PASS: Empty trip handled correctly without NaN or crashes.');
    else console.error('FAIL: Empty trip failed:', resEmpty.data);

    console.log('\n--- Test 5: Edge Case - Overspending ---');
    const tripOver = await db.query(`INSERT INTO trips (user_id, name, estimated_budget) VALUES ($1, 'Over', 100) RETURNING id`, [userIdA]);
    await db.query(`INSERT INTO expenses (trip_id, name, amount) VALUES ($1, 'Over', 150)`, [tripOver.rows[0].id]);
    const resOver = await (await fetch(`${API_URL}/trips/${tripOver.rows[0].id}/report`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (resOver.data.summary.remainingBudget === -50 && resOver.data.summary.budgetUtilization === 150) console.log('PASS: Overspending outputs accurate remaining and >100% utilization.');
    else console.error('FAIL: Overspending failed:', resOver.data.summary);

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    process.exit(0);
  }
}
runTests();
