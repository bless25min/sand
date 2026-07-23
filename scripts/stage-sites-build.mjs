import { access, cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { join } from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const webBuildDirectory = join(repositoryRoot, 'apps', 'web', 'dist');
const sitesBuildDirectory = join(repositoryRoot, 'dist');
const sitesClientDirectory = join(sitesBuildDirectory, 'client');
const sitesWorkerDirectory = join(sitesBuildDirectory, 'server');
const hostingConfig = join(repositoryRoot, '.openai', 'hosting.json');
const stagedHostingDirectory = join(sitesBuildDirectory, '.openai');
const workerEntry = join(webBuildDirectory, 'server', 'index.js');
const stagedWorkerEntry = join(sitesWorkerDirectory, 'index.js');

await Promise.all([access(hostingConfig), access(workerEntry)]);

await rm(sitesBuildDirectory, { force: true, recursive: true });
await cp(webBuildDirectory, sitesClientDirectory, { recursive: true });
await mkdir(sitesWorkerDirectory, { recursive: true });
await copyFile(workerEntry, stagedWorkerEntry);
await rm(join(sitesClientDirectory, 'server'), { force: true, recursive: true });
await mkdir(stagedHostingDirectory, { recursive: true });
await copyFile(hostingConfig, join(stagedHostingDirectory, 'hosting.json'));
