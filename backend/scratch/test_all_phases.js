import { execSync } from 'child_process';
import path from 'path';

console.log('====================================================');
console.log('🚀 RUNNING ALL LECTURESCRIBE BACKEND PHASE TESTS');
console.log('====================================================\n');

const scripts = [
  'scratch/verify_all.js',
  'scratch/test_phase4.js',
  'scratch/test_phase5.js',
  'scratch/test_phase6.js',
  'scratch/test_phase7.js',
  'scratch/test_phase8.js',
];

try {
  for (const script of scripts) {
    console.log(`\n▶️ Executing ${script}...`);
    execSync(`node ${script}`, { stdio: 'inherit', cwd: process.cwd() });
  }
  console.log('\n====================================================');
  console.log('🎉 ALL PHASES (1 THROUGH 8) VERIFIED SUCCESSFULLY!');
  console.log('====================================================');
} catch (err) {
  console.error('\n❌ Test suite failed:', err.message);
  process.exit(1);
}
