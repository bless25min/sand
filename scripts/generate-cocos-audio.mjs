import { mkdir, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const sampleRate = 22_050;

const deterministicNoise = (index, tier) => {
  const value = Math.imul(index + 1, 1_103_515_245) + tier * 12_345;
  return ((value >>> 8) & 65_535) / 32_767.5 - 1;
};

export function encodeImpactWave({ tier, finisher = false }) {
  const safeTier = Math.max(1, Math.min(6, Math.trunc(tier)));
  const duration = finisher ? 0.56 : 0.1 + safeTier * 0.018;
  const sampleCount = Math.ceil(sampleRate * duration);
  const dataSize = sampleCount * 2;
  const output = Buffer.alloc(44 + dataSize);
  output.write('RIFF', 0, 'ascii');
  output.writeUInt32LE(36 + dataSize, 4);
  output.write('WAVE', 8, 'ascii');
  output.write('fmt ', 12, 'ascii');
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * 2, 28);
  output.writeUInt16LE(2, 32);
  output.writeUInt16LE(16, 34);
  output.write('data', 36, 'ascii');
  output.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const progress = index / sampleCount;
    const attack = Math.min(1, progress * 42);
    const decay = Math.pow(1 - progress, finisher ? 1.7 : 3.1);
    const envelope = attack * decay;
    const pitch = (95 + safeTier * 33) * (1 - progress * 0.48);
    const body =
      Math.sin(2 * Math.PI * pitch * time) * 0.62 +
      Math.sin(2 * Math.PI * pitch * 2.03 * time) * 0.18;
    const transient =
      deterministicNoise(index, safeTier) * Math.pow(1 - progress, 8) * (0.22 + safeTier * 0.025);
    const rumble = finisher ? Math.sin(2 * Math.PI * 48 * time) * (1 - progress) * 0.28 : 0;
    const value = Math.max(-1, Math.min(1, (body + transient + rumble) * envelope));
    output.writeInt16LE(Math.round(value * 32_767), 44 + index * 2);
  }
  return output;
}

async function writeCocosAudioAssets(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const files = [
    ...Array.from({ length: 6 }, (_, index) => ({
      name: `impact-${index + 1}.wav`,
      data: encodeImpactWave({ tier: index + 1 }),
    })),
    { name: 'finisher.wav', data: encodeImpactWave({ tier: 6, finisher: true }) },
  ];
  await Promise.all(
    files.map(({ name, data }) => writeFile(path.join(outputDirectory, name), data)),
  );
  return files.map(({ name }) => path.join(outputDirectory, name));
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const outputDirectory =
    process.argv[2] ?? path.resolve('apps/game-client-cocos/assets/resources/audio');
  const files = await writeCocosAudioAssets(outputDirectory);
  process.stdout.write(`${files.join('\n')}\n`);
}
