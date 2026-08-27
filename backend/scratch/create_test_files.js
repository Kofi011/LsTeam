import fs from 'fs/promises';
import path from 'path';

export function createDummyWavBuffer(durationSec = 2, sampleRate = 8000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = Math.floor(durationSec * byteRate);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

async function setupTestData() {
  const scratchDir = path.join(process.cwd(), 'scratch');
  await fs.mkdir(scratchDir, { recursive: true });

  // Valid 3-second WAV
  const validWav = createDummyWavBuffer(3);
  await fs.writeFile(path.join(scratchDir, 'valid_test.wav'), validWav);

  // Invalid text file
  await fs.writeFile(path.join(scratchDir, 'invalid_test.txt'), 'This is not audio data');

  // Long 11-minute WAV (660 seconds)
  const longWav = createDummyWavBuffer(660, 1000);
  await fs.writeFile(path.join(scratchDir, 'long_test.wav'), longWav);

  console.log('Created test files in backend/scratch/');
}

setupTestData().catch(console.error);
