import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(rootDir, 'build', 'webos');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// Copy dist files
fs.cpSync(distDir, outputDir, { recursive: true });

// Generate appinfo.json for LG webOS
const appinfoJson = {
  id: "com.antigravity.iptv.player",
  version: "1.0.0",
  vendor: "Antigravity",
  type: "web",
  main: "index.html",
  title: "IPTV Premium Player",
  icon: "icon.png",
  largeIcon: "icon.png",
  bgImage: "icon.png",
  resolution: "1920x1080",
  transparent: false,
  requiredVersion: "4.0.0",
  handlesRelaunch: true,
  accessibility: {
    supportsAudioGuidance: false
  }
};

fs.writeFileSync(path.join(outputDir, 'appinfo.json'), JSON.stringify(appinfoJson, null, 2), 'utf-8');

// Create placeholder icon.png if not present
const iconPath = path.join(outputDir, 'icon.png');
if (!fs.existsSync(iconPath)) {
  const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(iconPath, png1x1);
}

console.log('✅ LG webOS package generated successfully at: ' + outputDir);
