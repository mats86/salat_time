import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const resDir = join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

for (const entry of readdirSync(resDir)) {
  if (!entry.startsWith('mipmap-')) continue;

  const dir = join(resDir, entry);
  if (!statSync(dir).isDirectory()) continue;

  const launcher = join(dir, 'ic_launcher.png');
  const foreground = join(dir, 'ic_launcher_foreground.png');

  if (!existsSync(launcher)) continue;

  copyFileSync(launcher, foreground);
  console.log(`Updated ${entry}/ic_launcher_foreground.png`);
}
