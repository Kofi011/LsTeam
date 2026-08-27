import { createDummyWavBuffer } from './create_test_files.js';

const API_BASE = 'http://localhost:5000/api';

async function testPhase7() {
  console.log('--- TESTING PHASE 7: AI PIPELINE INTEGRATION & MOCKS ---');

  const wavBuffer = createDummyWavBuffer(3);

  // 1. Authenticate user
  const email = `aiuser_${Date.now()}@example.com`;
  const signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const authCookie = signupRes.headers.get('set-cookie')?.split(';')[0];

  // 2. Upload Audio with Auth Cookie (Triggers AI pipeline + auto-save to DB)
  console.log('\n[1] Uploading audio file as authenticated user...');
  const formData = new FormData();
  formData.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'lecture_ai_test.wav');

  const uploadRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Cookie: authCookie },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log('Upload Status:', uploadRes.status);
  console.log('Upload Message:', uploadData.message);
  console.log('Auto-Saved Lecture ID:', uploadData.lecture?.id);
  console.log('Generated Overview:', uploadData.lecture?.overview);
  console.log('Key Concepts Count:', uploadData.lecture?.key_concepts?.length);

  const lectureId = uploadData.lecture?.id;

  // 3. Test AI Tutor Chat (/api/chat)
  console.log('\n[2] Testing POST /api/chat with lectureId context...');
  const chatRes = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
    },
    body: JSON.stringify({
      message: 'Can you summarize binary search tree efficiency?',
      transcript: uploadData.lecture?.transcript,
      lectureId,
    }),
  });

  const chatData = await chatRes.json();
  console.log('Chat Status:', chatRes.status);
  console.log('AI Tutor Reply:', chatData.reply);

  // 4. Verify Tutor History persisted in DB
  console.log(`\n[3] Fetching lecture ${lectureId} to verify tutor history persistence...`);
  const getRes = await fetch(`${API_BASE}/lectures/${lectureId}`, {
    headers: { Cookie: authCookie },
  });
  const getData = await getRes.json();
  console.log('Persisted Tutor History Turns:', getData.lecture?.tutor_history?.length);
  console.log('Tutor History Snippet:', JSON.stringify(getData.lecture?.tutor_history, null, 2));

  if (uploadRes.status === 200 && uploadData.lecture?.id && chatRes.status === 200 && getData.lecture?.tutor_history?.length >= 2) {
    console.log('\n✅ PHASE 7 AI PIPELINE INTEGRATION TESTS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ PHASE 7 TESTS FAILED');
  }
}

testPhase7().catch(console.error);
