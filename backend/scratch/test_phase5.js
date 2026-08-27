import { createDummyWavBuffer } from './create_test_files.js';

const API_BASE = 'http://localhost:5000/api';

async function testPhase5() {
  console.log('--- TESTING PHASE 5: TRIAL GATING ---');

  const wavBuffer = createDummyWavBuffer(3);
  let cookieHeader = '';

  // 1. Initial trial status
  console.log('\n[1] Fetching initial GET /api/trial-status ...');
  const statusRes1 = await fetch(`${API_BASE}/trial-status`);
  const statusData1 = await statusRes1.json();
  console.log('Trial Status 1:', statusData1);

  // Helper to post upload
  const doUpload = async (attemptNum) => {
    console.log(`\n[Upload ${attemptNum}] Posting audio file...`);
    const formData = new FormData();
    formData.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), `trial_${attemptNum}.wav`);

    const headers = {};
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    if (setCookies.length > 0) {
      const cookieMap = new Map();
      if (cookieHeader) {
        cookieHeader.split('; ').forEach(c => {
          const [k, v] = c.split('=');
          if (k && v) cookieMap.set(k, v);
        });
      }
      setCookies.forEach(c => {
        const firstPart = c.split(';')[0];
        const [k, v] = firstPart.split('=');
        if (k && v) cookieMap.set(k, v);
      });
      cookieHeader = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    const data = await res.json();
    console.log(`Upload ${attemptNum} HTTP Status:`, res.status);
    console.log(`Upload ${attemptNum} Response:`, JSON.stringify(data, null, 2));
    return { status: res.status, data };
  };

  // Upload 1
  const up1 = await doUpload(1);
  // Upload 2
  const up2 = await doUpload(2);
  // Upload 3
  const up3 = await doUpload(3);

  // Check status after 3 uploads
  console.log('\nFetching GET /api/trial-status after 3 uploads...');
  const statusRes2 = await fetch(`${API_BASE}/trial-status`, { headers: { Cookie: cookieHeader } });
  const statusData2 = await statusRes2.json();
  console.log('Trial Status 2:', statusData2);

  // Upload 4 (Should be BLOCKED with 403 Forbidden!)
  const up4 = await doUpload(4);

  // 6. Test Auth Bypass
  console.log('\n[Auth Test] Registering a user to test trial bypass...');
  const email = `trialuser_${Date.now()}@example.com`;
  const signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const signupCookie = signupRes.headers.get('set-cookie')?.split(';')[0];

  const authCookieHeader = `${cookieHeader}; ${signupCookie}`;

  console.log('\n[Upload 5 - Authenticated] Uploading with auth cookie...');
  const formData5 = new FormData();
  formData5.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'auth_test.wav');

  const up5Res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Cookie: authCookieHeader },
    body: formData5,
  });
  const up5Data = await up5Res.json();
  console.log('Authenticated Upload Status:', up5Res.status);
  console.log('Authenticated Upload Response:', JSON.stringify(up5Data, null, 2));

  if (up1.status === 200 && up2.status === 200 && up3.status === 200 && up4.status === 403 && up5Res.status === 200) {
    console.log('\n✅ PHASE 5 TRIAL GATING TESTS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ PHASE 5 TESTS FAILED');
  }
}

testPhase5().catch(console.error);
