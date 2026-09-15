const API_URL = 'http://localhost:5000/api';
let tokenUser1 = '';
let tokenUser2 = '';
let trip1Id = '';
let trip2Id = '';
let dest1Id = '';
let dest2Id = '';
let day1Id = '';
let day2Id = '';
let act1Id = '';

async function runTests() {
  try {
    console.log('--- Setup: Creating Users, Trips, and Destinations ---');
    const u1 = { full_name: 'User 1', email: `u1-${Date.now()}@example.com`, password: 'Password123!' };
    const u2 = { full_name: 'User 2', email: `u2-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u1) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u2) });

    const l1 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u1.email, password: u1.password}) })).json();
    const l2 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u2.email, password: u2.password}) })).json();
    tokenUser1 = l1.data.token;
    tokenUser2 = l2.data.token;

    // Create Trips
    const t1 = await (await fetch(`${API_URL}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify({ name: 'Trip 1' }) })).json();
    trip1Id = t1.data.id;
    
    const t2 = await (await fetch(`${API_URL}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` }, body: JSON.stringify({ name: 'Trip 2' }) })).json();
    trip2Id = t2.data.id;

    // Create Destinations
    const d1 = await (await fetch(`${API_URL}/trips/${trip1Id}/destinations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify({ name: 'Dest 1' }) })).json();
    dest1Id = d1.data.id;
    
    const d2 = await (await fetch(`${API_URL}/trips/${trip2Id}/destinations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` }, body: JSON.stringify({ name: 'Dest 2' }) })).json();
    dest2Id = d2.data.id;

    console.log('Setup complete.');

    console.log('\n--- Test 1: Create Itinerary Days ---');
    const dayRes1 = await (await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify({ day_number: 1, date: '2026-10-01' }) })).json();
    day1Id = dayRes1.data.id;
    
    const dayRes2 = await (await fetch(`${API_URL}/trips/${trip2Id}/itinerary/days`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` }, body: JSON.stringify({ day_number: 1, date: '2026-10-01' }) })).json();
    day2Id = dayRes2.data.id;
    
    if (day1Id && day2Id) console.log('PASS: Days created.');
    else console.error('FAIL: Day creation', dayRes1, dayRes2);

    console.log('\n--- Test 2: Create Activity with valid destination ---');
    const actRes1 = await (await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Activity 1', destination_id: dest1Id })
    })).json();
    if (actRes1.success) {
      act1Id = actRes1.data.id;
      console.log('PASS: Activity created with valid destination.');
    } else console.error('FAIL: Activity creation', actRes1);

    console.log('\n--- Test 3: Create Activity with cross-trip destination (User 1 tries to use User 2 destination) ---');
    const actResCross = await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Activity Hacker', destination_id: dest2Id })
    });
    if (actResCross.status === 400 || actResCross.status === 404) {
      console.log('PASS: Rejected cross-trip destination.');
    } else console.error('FAIL: Accepted cross-trip destination!', await actResCross.text());

    console.log('\n--- Test 4: Verify Ownership (User 2 tries to read User 1 Itinerary) ---');
    const readCross = await fetch(`${API_URL}/trips/${trip1Id}/itinerary`, { headers: { 'Authorization': `Bearer ${tokenUser2}` } });
    if (readCross.status === 404) {
      console.log('PASS: User 2 blocked from reading User 1 itinerary (404).');
    } else console.error('FAIL: User 2 read User 1 itinerary!', await readCross.text());

    console.log('\n--- Test 5: Verify Ownership (User 2 tries to edit User 1 Activity) ---');
    const editCross = await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}/activities/${act1Id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` },
      body: JSON.stringify({ name: 'Hacked' })
    });
    if (editCross.status === 404) {
      console.log('PASS: User 2 blocked from editing User 1 activity (404).');
    } else console.error('FAIL: User 2 edited User 1 activity!', await editCross.text());

    console.log('\n--- Test 6: Verify Ownership (User 1 tries to put activity in User 2 day) ---');
    const putCrossDay = await fetch(`${API_URL}/trips/${trip2Id}/itinerary/days/${day2Id}/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Hacked' })
    });
    if (putCrossDay.status === 404) {
      console.log('PASS: User 1 blocked from creating activity in User 2 day (404).');
    } else console.error('FAIL: User 1 created activity in User 2 day!', await putCrossDay.text());

    console.log('\n--- Test 7: Duplicate day number check ---');
    const dupDay = await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ day_number: 1, date: '2026-10-02' })
    });
    if (dupDay.status === 400) {
      console.log('PASS: Duplicate day number correctly rejected (400).');
    } else console.error('FAIL: Duplicate day number allowed!', await dupDay.text());

    console.log('\n--- Test 8: Read Full Itinerary ---');
    const getItin = await (await fetch(`${API_URL}/trips/${trip1Id}/itinerary`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } })).json();
    if (getItin.data.length === 1 && getItin.data[0].activities.length === 1) {
      console.log('PASS: Read full itinerary correctly returns nested data.');
    } else console.error('FAIL: Read itinerary structure incorrect.', JSON.stringify(getItin, null, 2));

    console.log('\n--- Test 9: Delete Activity ---');
    const delAct = await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}/activities/${act1Id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    if (delAct.status === 200) {
      console.log('PASS: Activity deleted.');
    } else console.error('FAIL: Activity deletion', await delAct.text());

    console.log('\n--- Test 10: Delete Day ---');
    const delDay = await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    if (delDay.status === 200) {
      console.log('PASS: Day deleted.');
    } else console.error('FAIL: Day deletion', await delDay.text());

  } catch (err) {
    console.error('Test Error:', err);
  }
}

runTests();
