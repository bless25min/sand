import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('system breaker board mobile rules', () => {
  it('does not hide deployed module rules at narrow widths', async () => {
    const css = await readFile(
      fileURLToPath(new URL('./system-breaker-board.css', import.meta.url)),
      'utf8',
    );

    expect(css).not.toMatch(/\.sb-module-rules\s*\{\s*display:\s*none/);
  });
});
