import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? collectSourceFiles(path) : [path];
  });
}

describe('SpendFox branding', () => {
  it('uses SpendFox in the Expo configuration', () => {
    const appConfig = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')) as {
      expo: { name: string; slug: string; scheme: string };
    };

    expect(appConfig.expo.name).toBe('SpendFox');
    expect(appConfig.expo.slug).toBe('spendfox');
    expect(appConfig.expo.scheme).toBe('spendfox');
  });

  it('does not expose the former product name in application source files', () => {
    const files = [...collectSourceFiles(join(process.cwd(), 'app')), ...collectSourceFiles(join(process.cwd(), 'src'))]
      .filter((path) => /\.(ts|tsx)$/.test(path));

    for (const file of files) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/Kostenkompass/i);
    }
  });
});
