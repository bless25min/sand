import { access, cp, copyFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { join } from 'node:path';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const webBuildDirectory = join(repositoryRoot, 'apps', 'web', 'dist');
const sitesBuildDirectory = join(repositoryRoot, 'dist');
const hostingConfig = join(repositoryRoot, '.openai', 'hosting.json');
const stagedHostingDirectory = join(sitesBuildDirectory, '.openai');
const workerEntry = join(webBuildDirectory, 'server', 'index.js');

await Promise.all([access(hostingConfig), access(workerEntry)]);

await rm(sitesBuildDirectory, { force: true, recursive: true });
await cp(webBuildDirectory, sitesBuildDirectory, { recursive: true });
await mkdir(stagedHostingDirectory, { recursive: true });
await copyFile(hostingConfig, join(stagedHostingDirectory, 'hosting.json'));
