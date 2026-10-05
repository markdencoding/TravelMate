const API_URL = 'http://localhost:5000/api';
const reminderService = require('./src/services/reminder.service');
const db = require('./src/config/database');

async function runTests() {
  try {
    console.log('--- Setup: Clearing notifications and trips ---');
    await db.query(`DELETE FROM notifications`);
    await db.query(`DELETE FROM trips`);
    await db.query(`DELETE FROM users`);
    
    console.log('--- Setup: Creating user ---');
    const userA = { full_name: 'User A', email: `a-${Date.now()}@example.com`, password: 'Password123!' };
    const userB = { full_name: 'User B', email: `b-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userA) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userB) });
    
    const tokenA = (await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: userA.email, password: userA.password}) })).json()).data.token;
    const tokenB = (await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: userB.email, password: userB.password}) })).json()).data.token;
    
    const userIdA = (await db.query(`SELECT id FROM users WHERE email = $1`, [userA.email])).rows[0].id;
    const userIdB = (await db.query(`SELECT id FROM users WHERE email = $1`, [userB.email])).rows[0].id;

    console.log('\n--- Test 1: Same trip does not duplicate ---');
    // Create one trip starting 5 days from today.
    await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Test Trip 5D', CURRENT_DATE + INTERVAL '5 days')
    `, [userIdA]);
    
    let res1 = await reminderService.generateReminders();
    let res2 = await reminderService.generateReminders();
    if (res1.generated === 1 && res2.generated === 0) {
      console.log('PASS: Same trip generated exactly 1 notification initially, 0 on second run.');
    } else {
      console.error('FAIL: Test 1 failed', res1, res2);
    }

    console.log('\n--- Test 2: Same-name trips remain independent ---');
    // Create two different trips with the same name, starting 5 days from today.
    await db.query(`DELETE FROM notifications`);
    await db.query(`DELETE FROM trips`);
    await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Paris Vacation', CURRENT_DATE + INTERVAL '5 days')
    `, [userIdA]);
    await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Paris Vacation', CURRENT_DATE + INTERVAL '5 days')
    `, [userIdA]);
    
    let res3 = await reminderService.generateReminders();
    let res4 = await reminderService.generateReminders();
    
    if (res3.generated === 2 && res4.generated === 0) {
      console.log('PASS: Same-name trips generated 2 independent notifications initially, 0 on second run.');
    } else {
      console.error('FAIL: Test 2 failed', res3, res4);
    }

    console.log('\n--- Test 3: Same-name activity independence ---');
    await db.query(`DELETE FROM notifications`);
    await db.query(`DELETE FROM trips`);
    
    const trip3 = await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Activity Trip', CURRENT_DATE + INTERVAL '10 days')
      RETURNING id
    `, [userIdA]);
    
    const day = await db.query(`
      INSERT INTO itinerary_days (trip_id, day_number, date)
      VALUES ($1, 1, CURRENT_DATE + INTERVAL '1 day')
      RETURNING id
    `, [trip3.rows[0].id]);
    
    await db.query(`
      INSERT INTO activities (itinerary_day_id, name)
      VALUES ($1, 'Museum Visit')
    `, [day.rows[0].id]);
    await db.query(`
      INSERT INTO activities (itinerary_day_id, name)
      VALUES ($1, 'Museum Visit')
    `, [day.rows[0].id]);
    
    let res5 = await reminderService.generateReminders();
    let res6 = await reminderService.generateReminders();
    if (res5.generated === 2 && res6.generated === 0) {
      console.log('PASS: Same-name activities generated 2 independent notifications initially, 0 on second run.');
    } else {
      console.error('FAIL: Test 3 failed', res5, res6);
    }

    console.log('\n--- Test 4: Trip reminder milestones remain independent ---');
    await db.query(`DELETE FROM notifications`);
    await db.query(`DELETE FROM trips`);
    
    // We can't have a trip that starts in 5 days AND 3 days, so we manipulate the DB.
    // We will generate the 5-day reminder by setting start_date to 5 days, running it, 
    // then changing start_date to 3 days and running it again.
    const trip4 = await db.query(`
      INSERT INTO trips (user_id, name, start_date)
      VALUES ($1, 'Milestone Trip', CURRENT_DATE + INTERVAL '5 days')
      RETURNING id
    `, [userIdA]);
    
    let res7 = await reminderService.generateReminders(); // should gen 5-day
    
    await db.query(`
      UPDATE trips SET start_date = CURRENT_DATE + INTERVAL '3 days' WHERE id = $1
    `, [trip4.rows[0].id]);
    
    let res8 = await reminderService.generateReminders(); // should gen 3-day
    let res9 = await reminderService.generateReminders(); // should gen 0
    
    if (res7.generated === 1 && res8.generated === 1 && res9.generated === 0) {
      console.log('PASS: Milestones for same trip remain distinct.');
    } else {
      console.error('FAIL: Test 4 failed', res7, res8, res9);
    }

    console.log('\n--- Test 5: Existing API regression & Verification ---');
    const listA = await (await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    const listB = await (await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${tokenB}` } })).json();
    
    if (listA.data.length === 2 && listB.data.length === 0) {
      console.log('PASS: Isolation verified. List returned successfully.');
      
      // Verify NO hidden identity in the output text!
      const containsHidden = listA.data.some(n => n.message.includes('<!--ID:'));
      if (containsHidden) {
        console.error('FAIL: Hidden identity string leaked to API output!');
      } else {
        console.log('PASS: Message payload successfully cleaned before API delivery.');
      }
    } else {
      console.error('FAIL: Isolation broke', listA.data.length, listB.data.length);
    }

    const unread = await (await fetch(`${API_URL}/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (unread.data.count === 2) console.log('PASS: Unread count correct');
    else console.error('FAIL: Unread count wrong', unread.data);

    const targetId = listA.data[0].id;
    await fetch(`${API_URL}/notifications/${targetId}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenA}` } });
    const unread2 = await (await fetch(`${API_URL}/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${tokenA}` } })).json();
    if (unread2.data.count === 1) console.log('PASS: Single read works');
    else console.error('FAIL: Single read failed');

    const hack = await fetch(`${API_URL}/notifications/${targetId}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${tokenB}` } });
    if (hack.status === 404) console.log('PASS: User B blocked');
    else console.error('FAIL: User B bypassed');

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
