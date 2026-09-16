const API_URL = 'http://localhost:5000/api';
const reminderService = require('./src/services/reminder.service');
const db = require('./src/config/database');

async function runTests() {
  try {
    console.log('--- Setup: Creating user and testing schema ---');
    const userA = { full_name: 'User A', email: `a-${Date.now()}@example.com`, password: 'Password123!' };
    const userB = { full_name: 'User B', email: `b-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    
    const tokenA = (await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: userA.email, password: userA.password}) })).json()).data.token;
    const tokenB = (await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: userB.email, password: userB.password}) })).json()).data.token;
    
    const userIdA = (await db.query(`SELECT id FROM users WHERE email = $1`, [userA.email])).rows[0].id;
    const userIdB = (await db.query(`SELECT id FROM users WHERE email = $1`, [userB.email])).rows[0].id;

    // Create 5-day trip for User A
    const trip5Day = await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Test Trip 5D', CURRENT_DATE + INTERVAL '5 days')
      RETURNING id
    `, [userIdA]);

    // Create 3-day trip for User A
    const trip3Day = await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Test Trip 3D', CURRENT_DATE + INTERVAL '3 days')
      RETURNING id
    `, [userIdA]);

    // Create 1-day Activity for User A
    const day = await db.query(`
      INSERT INTO itinerary_days (trip_id, day_number, date)
      VALUES ($1, 1, CURRENT_DATE + INTERVAL '1 day')
      RETURNING id
    `, [trip3Day.rows[0].id]);
    await db.query(`
      INSERT INTO activities (itinerary_day_id, name)
      VALUES ($1, 'Test Activity 1D')
    `, [day.rows[0].id]);

    console.log('\n--- Test 1: Empty Notification List ---');
    const emptyList = await (await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (emptyList.success && emptyList.data.length === 0) console.log('PASS: Empty list');
    else console.error('FAIL: Not empty');

    console.log('\n--- Test 2: Scheduler Generation ---');
    const res1 = await reminderService.generateReminders();
    if (res1.generated === 3 && res1.skipped === 0) console.log('PASS: Generated exactly 3 reminders');
    else console.error('FAIL: Expected 3 generated, got', res1);

    console.log('\n--- Test 3: Duplicate Prevention ---');
    const res2 = await reminderService.generateReminders();
    if (res2.generated === 0 && res2.skipped === 3) console.log('PASS: Generated 0, skipped 3 duplicates');
    else console.error('FAIL: Expected 0 generated, 3 skipped, got', res2);

    console.log('\n--- Test 4: Authenticated List & Cross-User Isolation ---');
    const listA = await (await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    const listB = await (await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${tokenB}` } })).json();
    if (listA.data.length === 3 && listB.data.length === 0) console.log('PASS: Isolation verified');
    else console.error('FAIL: Isolation broke', listA.data.length, listB.data.length);

    console.log('\n--- Test 5: Unread Count ---');
    const unread = await (await fetch(`${API_URL}/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (unread.data.count === 3) console.log('PASS: Unread count correct');
    else console.error('FAIL: Unread count wrong', unread.data);

    console.log('\n--- Test 6: Mark One As Read ---');
    const targetId = listA.data[0].id;
    await fetch(`${API_URL}/notifications/${targetId}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}` } });
    const unread2 = await (await fetch(`${API_URL}/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (unread2.data.count === 2) console.log('PASS: Single read works');
    else console.error('FAIL: Single read failed');

    console.log('\n--- Test 7: User B cannot modify User A notification ---');
    const hack = await fetch(`${API_URL}/notifications/${targetId}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenB}` } });
    if (hack.status === 404) console.log('PASS: User B blocked');
    else console.error('FAIL: User B bypassed');

    console.log('\n--- Test 8: Mark All As Read ---');
    await fetch(`${API_URL}/notifications/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}` } });
    const unread3 = await (await fetch(`${API_URL}/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (unread3.data.count === 0) console.log('PASS: Mark all works');
    else console.error('FAIL: Mark all failed');

  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    process.exit(0);
  }
}
runTests();
