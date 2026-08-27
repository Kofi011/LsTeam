const API_BASE = 'http://localhost:5000/api';

async function testPhase8() {
  console.log('--- TESTING PHASE 8: SECURITY HARDENING ---');

  // 1. Check Helmet Security Headers
  console.log('\n[1] Testing Helmet Security Headers on GET /api/health ...');
  const res = await fetch(`${API_BASE}/health`);
  console.log('X-Content-Type-Options Header:', res.headers.get('x-content-type-options'));
  console.log('X-Frame-Options Header:', res.headers.get('x-frame-options'));
  console.log('X-DNS-Prefetch-Control Header:', res.headers.get('x-dns-prefetch-control'));

  // 2. Test Auth Rate Limiter
  console.log('\n[2] Testing Auth Rate Limiting on POST /api/auth/login ...');
  let hitRateLimit = false;

  for (let i = 1; i <= 17; i++) {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ratelimittest@example.com', password: 'wrongpassword' }),
    });

    if (loginRes.status === 429) {
      const data = await loginRes.json();
      console.log(`Request #${i} triggered Rate Limiter! HTTP Status: 429`);
      console.log('Rate Limiter Response:', JSON.stringify(data, null, 2));
      hitRateLimit = true;
      break;
    }
  }

  if (res.headers.get('x-content-type-options') === 'nosniff' && hitRateLimit) {
    console.log('\n✅ PHASE 8 SECURITY HARDENING TESTS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ PHASE 8 TESTS FAILED');
  }
}

testPhase8().catch(console.error);
