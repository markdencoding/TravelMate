const jwt = require('jsonwebtoken');
const config = require('./src/config');

const token = jwt.sign({ id: '00000000-0000-0000-0000-000000000000', email: 'tester@example.com', role: 'user' }, config.jwtSecret);
const headers = { Authorization: 'Bearer ' + token };

async function runTests() {
  console.log('--- RUNNING PHASE 9.8 BACKEND TESTS ---');
  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`✗ FAIL: ${desc} - ${err.message}`);
      failed++;
    }
  }

  // Currency tests
  await assert('Get PHP to USD exchange rate', async () => {
    const res = await fetch('http://localhost:5000/api/currency/rate?from=PHP&to=USD', { headers });
    const data = await res.json();
    if (!data.success || !data.data.rate || typeof data.data.rate !== 'number') {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }
  });

  await assert('Get PHP to JPY exchange rate', async () => {
    const res = await fetch('http://localhost:5000/api/currency/rate?from=PHP&to=JPY', { headers });
    const data = await res.json();
    if (!data.success || data.data.from !== 'PHP' || data.data.to !== 'JPY' || data.data.rate <= 0) {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }
  });

  await assert('Convert 50,000 PHP to JPY calculation', async () => {
    const res = await fetch('http://localhost:5000/api/currency/convert?amount=50000&from=PHP&to=JPY', { headers });
    const data = await res.json();
    if (!data.success || data.data.amount !== 50000 || data.data.converted_amount <= 0) {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }
    const expected = Math.round(50000 * data.data.rate * 100) / 100;
    if (Math.abs(data.data.converted_amount - expected) > 0.1) {
      throw new Error(`Math mismatch: ${data.data.converted_amount} vs ${expected}`);
    }
  });

  await assert('Reject invalid currency code', async () => {
    const res = await fetch('http://localhost:5000/api/currency/rate?from=INVALID&to=JPY', { headers });
    const data = await res.json();
    if (res.status !== 400 || data.success) {
      throw new Error(`Expected 400 error, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  await assert('Get supported currencies list', async () => {
    const res = await fetch('http://localhost:5000/api/currency/currencies', { headers });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data) || !data.data.some(c => c.code === 'PHP') || !data.data.some(c => c.code === 'JPY')) {
      throw new Error(`Missing expected currencies: ${JSON.stringify(data)}`);
    }
  });

  // Weather tests
  await assert('Get current weather for Tokyo coordinates', async () => {
    const res = await fetch('http://localhost:5000/api/weather?lat=35.6762&lon=139.6503', { headers });
    const data = await res.json();
    if (!data.success || !data.data.temperature || !data.data.condition) {
      throw new Error(`Invalid response: ${JSON.stringify(data)}`);
    }
  });

  await assert('Get forecast within 16-day range', async () => {
    const targetDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const res = await fetch(`http://localhost:5000/api/weather?lat=35.6762&lon=139.6503&date=${targetDate}`, { headers });
    const data = await res.json();
    if (!data.success || !data.data.forecast || !data.data.forecast.available || data.data.forecast.date !== targetDate) {
      throw new Error(`Invalid forecast: ${JSON.stringify(data)}`);
    }
  });

  await assert('Get fallback for date beyond forecast range', async () => {
    const targetDate = '2026-11-20';
    const res = await fetch(`http://localhost:5000/api/weather?lat=35.6762&lon=139.6503&date=${targetDate}`, { headers });
    const data = await res.json();
    if (!data.success || !data.data.forecast || data.data.forecast.available !== false || !data.data.forecast.message) {
      throw new Error(`Expected unavailable forecast message, got: ${JSON.stringify(data)}`);
    }
  });

  await assert('Reject missing coordinates', async () => {
    const res = await fetch('http://localhost:5000/api/weather', { headers });
    const data = await res.json();
    if (res.status !== 400 || data.success) {
      throw new Error(`Expected 400 error, got ${res.status}`);
    }
  });

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
