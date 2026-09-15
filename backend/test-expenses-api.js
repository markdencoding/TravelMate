const API_URL = 'http://localhost:5000/api';
let tokenUser1 = '';
let tokenUser2 = '';
let trip1Id = '';
let trip2Id = '';
let day1Id = '';
let act1Id = '';
let act2Id = '';
let exp1Id = '';

async function runTests() {
  try {
    console.log('--- Setup: Users, Trips, Itinerary ---');
    const u1 = { full_name: 'Exp User 1', email: `eu1-${Date.now()}@example.com`, password: 'Password123!' };
    const u2 = { full_name: 'Exp User 2', email: `eu2-${Date.now()}@example.com`, password: 'Password123!' };
    
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u1) });
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u2) });

    const l1 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u1.email, password: u1.password}) })).json();
    const l2 = await (await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({email: u2.email, password: u2.password}) })).json();
    tokenUser1 = l1.data.token;
    tokenUser2 = l2.data.token;

    const t1 = await (await fetch(`${API_URL}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify({ name: 'Exp Trip 1', estimated_budget: 1000 }) })).json();
    trip1Id = t1.data.id;
    
    const t2 = await (await fetch(`${API_URL}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` }, body: JSON.stringify({ name: 'Exp Trip 2', estimated_budget: 500 }) })).json();
    trip2Id = t2.data.id;

    // Create Day & Activity for User 1
    const day1 = await (await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify({ day_number: 1 }) })).json();
    day1Id = day1.data.id;
    const act1 = await (await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` }, body: JSON.stringify({ name: 'Act 1' }) })).json();
    act1Id = act1.data.id;

    // Create Day & Activity for User 2
    const day2 = await (await fetch(`${API_URL}/trips/${trip2Id}/itinerary/days`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` }, body: JSON.stringify({ day_number: 1 }) })).json();
    const act2 = await (await fetch(`${API_URL}/trips/${trip2Id}/itinerary/days/${day2.data.id}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser2}` }, body: JSON.stringify({ name: 'Act 2' }) })).json();
    act2Id = act2.data.id;
    
    console.log('Setup complete.');

    console.log('\n--- Test 1: Create Expense ---');
    const expRes = await fetch(`${API_URL}/trips/${trip1Id}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Lunch', amount: 50.25, category: 'food' })
    });
    const expData = await expRes.json();
    if (expData.success) {
      exp1Id = expData.data.id;
      console.log('PASS: Expense created.');
    } else console.error('FAIL: Expense creation', expData);

    console.log('\n--- Test 2: Validation (Negative Amount) ---');
    const negRes = await fetch(`${API_URL}/trips/${trip1Id}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Negative', amount: -10, category: 'food' })
    });
    if (negRes.status === 400) console.log('PASS: Negative amount rejected.');
    else console.error('FAIL: Negative amount accepted!');

    console.log('\n--- Test 3: Validation (Invalid Category) ---');
    const catRes = await fetch(`${API_URL}/trips/${trip1Id}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Bad Cat', amount: 10, category: 'aliens' })
    });
    if (catRes.status === 400) console.log('PASS: Invalid category rejected.');
    else console.error('FAIL: Invalid category accepted!');

    console.log('\n--- Test 4: Security (Cross-User Read) ---');
    const readCross = await fetch(`${API_URL}/trips/${trip1Id}/expenses`, { headers: { 'Authorization': `Bearer ${tokenUser2}` } });
    if (readCross.status === 404) console.log('PASS: User 2 blocked from reading User 1 expenses.');
    else console.error('FAIL: User 2 read User 1 expenses!', await readCross.text());

    console.log('\n--- Test 5: Security (Cross-Trip Activity Association) ---');
    const actCross = await fetch(`${API_URL}/trips/${trip1Id}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Hacker', amount: 10, category: 'other', activity_id: act2Id })
    });
    if (actCross.status === 400 || actCross.status === 404) console.log('PASS: User 1 blocked from associating User 2 activity.');
    else console.error('FAIL: User 1 associated User 2 activity!', await actCross.text());

    console.log('\n--- Test 6: Valid Activity Association ---');
    const actValid = await (await fetch(`${API_URL}/trips/${trip1Id}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Museum Ticket', amount: 30, category: 'activities', activity_id: act1Id })
    })).json();
    if (actValid.success) console.log('PASS: Expense associated with valid activity.');
    else console.error('FAIL: Activity association failed', actValid);
    const exp2Id = actValid.data.id;

    console.log('\n--- Test 7: Aggregation / Summary ---');
    const sumRes = await (await fetch(`${API_URL}/trips/${trip1Id}/expenses/summary`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } })).json();
    if (sumRes.data.total_spent === 80.25 && sumRes.data.categories['food'] === 50.25 && sumRes.data.categories['activities'] === 30 && sumRes.data.remaining_budget === 919.75) {
      console.log('PASS: Aggregation calculations are perfectly correct.');
    } else console.error('FAIL: Aggregation error', sumRes.data);

    console.log('\n--- Test 8: Foreign-Key Behavior (Delete Activity) ---');
    const delAct = await fetch(`${API_URL}/trips/${trip1Id}/itinerary/days/${day1Id}/activities/${act1Id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    if (delAct.status === 200) {
      const exps = await (await fetch(`${API_URL}/trips/${trip1Id}/expenses`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } })).json();
      const museumExp = exps.data.find(e => e.id === exp2Id);
      if (museumExp && museumExp.activity_id === null) {
        console.log('PASS: Expense remained and activity_id became NULL after activity deletion.');
      } else console.error('FAIL: ON DELETE SET NULL failed', museumExp);
    } else console.error('FAIL: Could not delete activity');

    console.log('\n--- Test 9: Update Expense & Check Aggregation Recalculates ---');
    const updateRes = await fetch(`${API_URL}/trips/${trip1Id}/expenses/${exp1Id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenUser1}` },
      body: JSON.stringify({ name: 'Lunch Updated', amount: 100, category: 'food' })
    });
    if (updateRes.status === 200) {
      const sumRes2 = await (await fetch(`${API_URL}/trips/${trip1Id}/expenses/summary`, { headers: { 'Authorization': `Bearer ${tokenUser1}` } })).json();
      if (sumRes2.data.total_spent === 130) console.log('PASS: Summary recalculated correctly after update.');
      else console.error('FAIL: Summary recalculation incorrect', sumRes2.data);
    } else console.error('FAIL: Update expense failed', await updateRes.text());

    console.log('\n--- Test 10: Delete Expense ---');
    const delExp = await fetch(`${API_URL}/trips/${trip1Id}/expenses/${exp1Id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${tokenUser1}` } });
    if (delExp.status === 200) console.log('PASS: Expense deleted.');
    else console.error('FAIL: Expense deletion failed', await delExp.text());

  } catch (err) {
    console.error('Test Error:', err);
  }
}
runTests();
