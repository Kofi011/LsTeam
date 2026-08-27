import fs from 'fs/promises';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BACKEND PHASES 1, 2, 3 VERIFICATION ---');

  // 1. Health Check Test
  console.log('\n[1] Testing GET /api/health ...');
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('Health Check Response Status:', healthRes.status);
    console.log('Health Check Response Body:', JSON.stringify(healthData, null, 2));
  } catch (err) {
    console.error('Health check request failed:', err.message);
  }

  const scratchDir = path.join(process.cwd(), 'scratch');

  // 2. Test Invalid File Upload (TXT file)
  console.log('\n[2] Testing Upload with Invalid File Type (TXT)...');
  try {
    const txtBuffer = await fs.readFile(path.join(scratchDir, 'invalid_test.txt'));
    const formData = new FormData();
    formData.append('audio', new Blob([txtBuffer], { type: 'text/plain' }), 'invalid_test.txt');

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log('Invalid Upload Response Status:', res.status);
    console.log('Invalid Upload Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Invalid file upload test failed:', err.message);
  }

  // 3. Test Long Audio Upload (> 10 mins)
  console.log('\n[3] Testing Upload with Excessive Duration (> 10 min)...');
  try {
    const longBuffer = await fs.readFile(path.join(scratchDir, 'long_test.wav'));
    const formData = new FormData();
    formData.append('audio', new Blob([longBuffer], { type: 'audio/wav' }), 'long_test.wav');

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log('Long Duration Response Status:', res.status);
    console.log('Long Duration Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Long duration audio upload test failed:', err.message);
  }

  // 4. Test Valid Audio Upload
  console.log('\n[4] Testing Upload with Valid Audio (3s WAV)...');
  try {
    const wavBuffer = await fs.readFile(path.join(scratchDir, 'valid_test.wav'));
    const formData = new FormData();
    formData.append('audio', new Blob([wavBuffer], { type: 'audio/wav' }), 'valid_test.wav');

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log('Valid Upload Response Status:', res.status);
    console.log('Valid Upload Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Valid audio upload test failed:', err.message);
  }

  // 5. Verify temp uploads folder is empty
  console.log('\n[5] Checking temp uploads directory cleanup...');
  const uploadsFiles = await fs.readdir(path.join(process.cwd(), 'uploads'));
  const remainingFiles = uploadsFiles.filter((f) => f !== '.gitkeep');
  console.log(`Temp files remaining in uploads/: ${remainingFiles.length}`);
  if (remainingFiles.length === 0) {
    console.log('✅ PASS: Temp upload directory cleaned up successfully!');
  } else {
    console.warn('⚠️ WARNING: Temp files remaining:', remainingFiles);
  }

  console.log('\n--- VERIFICATION COMPLETED ---');
}

runTests().catch(console.error);
