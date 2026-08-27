import path from 'path';
import { runMigrations } from '../src/db/migrate.js';

const API_BASE = 'http://localhost:5000/api/auth';

async function testPhase4() {
  console.log('--- TESTING PHASE 4: AUTHENTICATION SERVICE ---');

  // Ensure DB migrations are up to date
  await runMigrations();

  const testEmail = `user_${Date.now()}@example.com`;
  const testPassword = 'securePassword123!';
  let authTokenCookie = '';

  // 1. Test Signup
  console.log('\n[1] Testing POST /api/auth/signup ...');
  const signupRes = await fetch(`${API_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const signupData = await signupRes.json();
  console.log('Signup Status:', signupRes.status);
  console.log('Signup Response:', JSON.stringify(signupData, null, 2));

  const setCookieHeader = signupRes.headers.get('set-cookie');
  if (setCookieHeader) {
    authTokenCookie = setCookieHeader.split(';')[0];
    console.log('Extracted Auth Cookie:', authTokenCookie);
  }

  // 2. Test Get Current User (/me) with cookie
  console.log('\n[2] Testing GET /api/auth/me (Authenticated) ...');
  const meRes = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    headers: { Cookie: authTokenCookie },
  });
  const meData = await meRes.json();
  console.log('/me Status:', meRes.status);
  console.log('/me Response:', JSON.stringify(meData, null, 2));

  // 3. Test Login
  console.log('\n[3] Testing POST /api/auth/login ...');
  const loginRes = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('Login Response:', JSON.stringify(loginData, null, 2));

  // 4. Test Logout
  console.log('\n[4] Testing POST /api/auth/logout ...');
  const logoutRes = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: { Cookie: authTokenCookie },
  });
  const logoutData = await logoutRes.json();
  console.log('Logout Status:', logoutRes.status);
  console.log('Logout Response:', JSON.stringify(logoutData, null, 2));

  // 5. Test Access /me Unauthenticated
  console.log('\n[5] Testing GET /api/auth/me (Unauthenticated) ...');
  const unauthRes = await fetch(`${API_BASE}/me`);
  const unauthData = await unauthRes.json();
  console.log('Unauth /me Status:', unauthRes.status);
  console.log('Unauth /me Response:', JSON.stringify(unauthData, null, 2));

  if (signupRes.status === 201 && meRes.status === 200 && unauthRes.status === 401) {
    console.log('\n✅ PHASE 4 AUTHENTICATION TESTS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ PHASE 4 TESTS FAILED');
  }
}

testPhase4().catch(console.error);
