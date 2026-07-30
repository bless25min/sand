import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(repositoryRoot, 'apps/game-client-cocos');
const targets = ['web-mobile', 'web-desktop', 'windows'];

const fileExists = async (candidate) => {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
};

export async function findCreatorExecutable(options = {}) {
  const candidates = [
    options.environmentPath ?? process.env.COCOS_CREATOR_PATH ?? '',
    path.join(repositoryRoot, '.cocos-cache', 'creator-3.8.8', 'CocosCreator.exe'),
    'C:/CocosDashboard/resources/.editors/Creator/3.8.8/CocosCreator.exe',
    'C:/Program Files/Cocos/Creator/3.8.8/CocosCreator.exe',
  ].filter(Boolean);
  const exists = options.exists ?? fileExists;
  for (const candidate of candidates) {
    const absolute = path.resolve(candidate);
    if (await exists(absolute)) return absolute;
  }
  throw new Error(
    'Cocos Creator 3.8.8 is not installed. Install it with Cocos Dashboard or set COCOS_CREATOR_PATH.',
  );
}

export function serializeBuildArguments(config) {
  const buildPath = config.buildPath.startsWith('project://')
    ? config.buildPath
    : `project://${config.buildPath.replaceAll('\\', '/')}`;
  return [
    `platform=${config.platform}`,
    `debug=${String(config.debug)}`,
    `md5Cache=${String(config.md5Cache)}`,
    `buildPath=${buildPath}`,
    `outputName=${config.outputName}`,
  ].join(';');
}

export const terminateProcessTree = (child) =>
  new Promise((resolve) => {
    if (!child.pid || child.exitCode !== null) {
      resolve();
      return;
    }
    if (process.platform !== 'win32') {
      child.kill('SIGTERM');
      resolve();
      return;
    }
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    killer.once('error', () => {
      child.kill();
      resolve();
    });
    killer.once('exit', () => resolve());
  });

export const runProcess = (executable, arguments_, options = {}) =>
  new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs ?? 12 * 60_000;
    let outputTail = '';
    let settled = false;
    const remember = (chunk) => {
      outputTail = `${outputTail}${chunk}`.slice(-16_000);
    };
    const child = spawn(executable, arguments_, {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let timeout;
    const cleanup = () => {
      if (timeout !== undefined) globalThis.clearTimeout(timeout);
      options.signal?.removeEventListener('abort', onAbort);
      process.off('SIGINT', onParentSignal);
      process.off('SIGTERM', onParentSignal);
    };
    const failAfterTermination = async (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      await terminateProcessTree(child);
      reject(error);
    };
    const onAbort = () => {
      void failAfterTermination(new Error(`${path.basename(executable)} was aborted`));
    };
    const onParentSignal = () => {
      void failAfterTermination(
        new Error(`${path.basename(executable)} was aborted by parent signal`),
      );
    };
    child.stdout.on('data', remember);
    child.stderr.on('data', remember);
    timeout = globalThis.setTimeout(() => {
      void failAfterTermination(
        new Error(`${path.basename(executable)} timed out after ${timeoutMs}ms`),
      );
    }, timeoutMs);
    options.signal?.addEventListener('abort', onAbort, { once: true });
    process.once('SIGINT', onParentSignal);
    process.once('SIGTERM', onParentSignal);
    if (options.signal?.aborted) onAbort();
    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    });
    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (code) process.stderr.write(outputTail);
      resolve(code ?? 1);
    });
  });

export async function buildCocosTarget(target, options = {}) {
  if (!targets.includes(target)) throw new Error(`Unknown Cocos build target: ${target}`);
  const config = JSON.parse(
    await readFile(path.join(projectRoot, 'build-config', `${target}.json`), 'utf8'),
  );
  const run = options.run ?? runProcess;
  const syncExitCode = await run(process.execPath, [
    path.join(repositoryRoot, 'scripts/sync-cocos-runtime.mjs'),
    '--out-dir',
    path.join(projectRoot, 'assets/runtime'),
  ]);
  if (syncExitCode !== 0)
    throw new Error(`Cocos runtime sync failed with exit code ${syncExitCode}`);
  const audioExitCode = await run(process.execPath, [
    path.join(repositoryRoot, 'scripts/generate-cocos-audio.mjs'),
    path.join(projectRoot, 'assets/resources/audio'),
  ]);
  if (audioExitCode !== 0)
    throw new Error(`Cocos audio generation failed with exit code ${audioExitCode}`);
  const creator = options.creatorExecutable ?? (await findCreatorExecutable());
  const buildExitCode = await run(creator, [
    '--project',
    projectRoot,
    '--build',
    serializeBuildArguments(config),
  ]);
  if (buildExitCode !== 0 && buildExitCode !== 36) {
    throw new Error(`Cocos ${target} build failed with exit code ${buildExitCode}`);
  }
  const outputRoot = path.join(projectRoot, config.buildPath, config.outputName);
  if (target !== 'windows') return outputRoot;

  const cmake = path.join(path.dirname(creator), 'resources', 'tools', 'cmake', 'bin', 'cmake.exe');
  const compileExitCode = await run(cmake, [
    '--build',
    path.join(outputRoot, 'proj'),
    '--config',
    'Release',
    '--target',
    'CocosGame',
    '--',
    '/m',
  ]);
  if (compileExitCode !== 0) {
    throw new Error(`Cocos Windows native compile failed with exit code ${compileExitCode}`);
  }
  const executable = path.join(outputRoot, 'proj', 'Release', 'CocosGame.exe');
  const verifyWindowsExecutable = options.verifyWindowsExecutable ?? fileExists;
  if (!(await verifyWindowsExecutable(executable))) {
    throw new Error(`Cocos Windows build did not produce ${executable}`);
  }
  return executable;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const requested = process.argv[2] ?? 'all';
  const selectedTargets = requested === 'all' ? targets : [requested];
  for (const target of selectedTargets) {
    process.stdout.write(`${await buildCocosTarget(target)}\n`);
  }
}
