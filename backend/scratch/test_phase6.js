const API_BASE = 'http://localhost:5000/api';

async function testPhase6() {
  console.log('--- TESTING PHASE 6: LECTURES CRUD ---');

  // 1. Authenticate user
  const email = `cruduser_${Date.now()}@example.com`;
  const signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const authCookie = signupRes.headers.get('set-cookie')?.split(';')[0];
  const headers = {
    'Content-Type': 'application/json',
    Cookie: authCookie,
  };

  // 2. Create Lecture
  console.log('\n[1] Testing POST /api/lectures (Create Lecture) ...');
  const createRes = await fetch(`${API_BASE}/lectures`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Introduction to Computer Science & Algorithms',
      overview: 'Overview of binary search and sorting algorithm complexity.',
      duration_sec: 240,
      engine_used: 'whisper-large-v3',
      language: 'en',
      file_name: 'cs101_lecture.mp3',
      transcript: 'Welcome to CS101. Today we discuss computational complexity...',
      key_concepts: [{ title: 'Binary Search', summary: 'O(log n) search algorithm' }],
      main_arguments: ['Logarithmic time algorithms scale efficiently.'],
      important_terms: [{ term: 'Big-O', definition: 'Asymptotic notation' }],
      study_notes: ['Review binary search tree properties.'],
      key_takeaways: ['Understanding time complexity is crucial.'],
      revision_questions: ['What is the worst-case time complexity of binary search?'],
      notes_markdown: '# CS101 Notes\n- Binary search runs in O(log n).',
    }),
  });
  const createData = await createRes.json();
  console.log('Create Status:', createRes.status);
  console.log('Create Response:', JSON.stringify(createData, null, 2));

  const lectureId = createData.lecture?.id;

  // 3. List Lectures
  console.log('\n[2] Testing GET /api/lectures (List Lectures) ...');
  const listRes = await fetch(`${API_BASE}/lectures`, { headers });
  const listData = await listRes.json();
  console.log('List Status:', listRes.status);
  console.log('Lectures Count:', listData.lectures?.length);

  // 4. Fetch Single Lecture
  console.log(`\n[3] Testing GET /api/lectures/${lectureId} ...`);
  const getRes = await fetch(`${API_BASE}/lectures/${lectureId}`, { headers });
  const getData = await getRes.json();
  console.log('Get Single Status:', getRes.status);
  console.log('Fetched Title:', getData.lecture?.title);

  // 5. Update Lecture
  console.log(`\n[4] Testing PUT /api/lectures/${lectureId} (Update) ...`);
  const updateRes = await fetch(`${API_BASE}/lectures/${lectureId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      title: 'Updated Title: Advanced Algorithms & Data Structures',
      overview: 'Updated overview focusing on asymptotic upper bounds.',
    }),
  });
  const updateData = await updateRes.json();
  console.log('Update Status:', updateRes.status);
  console.log('Updated Title:', updateData.lecture?.title);

  // 6. Append Tutor History
  console.log(`\n[5] Testing POST /api/lectures/${lectureId}/tutor ...`);
  const tutorRes = await fetch(`${API_BASE}/lectures/${lectureId}/tutor`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: 'Can you explain Big-O notation again?',
      reply: 'Big-O notation describes the upper bound of execution time as input size grows.',
    }),
  });
  const tutorData = await tutorRes.json();
  console.log('Tutor Append Status:', tutorRes.status);
  console.log('Tutor History Turns:', tutorData.tutor_history?.length);

  // 7. Delete Lecture
  console.log(`\n[6] Testing DELETE /api/lectures/${lectureId} ...`);
  const deleteRes = await fetch(`${API_BASE}/lectures/${lectureId}`, {
    method: 'DELETE',
    headers,
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Status:', deleteRes.status);
  console.log('Delete Response:', deleteData);

  // 8. Confirm Delete (404 Not Found)
  console.log(`\n[7] Confirming deletion (GET /api/lectures/${lectureId}) ...`);
  const confirmRes = await fetch(`${API_BASE}/lectures/${lectureId}`, { headers });
  console.log('Confirm Delete Status (expect 404):', confirmRes.status);

  if (createRes.status === 201 && listRes.status === 200 && getRes.status === 200 && updateRes.status === 200 && tutorRes.status === 200 && deleteRes.status === 200 && confirmRes.status === 404) {
    console.log('\n✅ PHASE 6 LECTURES CRUD TESTS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ PHASE 6 TESTS FAILED');
  }
}

testPhase6().catch(console.error);
