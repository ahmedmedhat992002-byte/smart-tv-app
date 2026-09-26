import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const outputDir = path.join(rootDir, 'build', 'tizen');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

// Copy dist files
fs.cpSync(distDir, outputDir, { recursive: true });

// Generate config.xml for Samsung Tizen
const configXml = `<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" id="http://antigravity.tv/IPTVPremiumPlayer" version="1.0.0" viewmodes="maximized">
    <tizen:application id="XqN0E4l2gP.IPTVPremiumPlayer" package="XqN0E4l2gP" exec="index.html" screen-orientation="landscape" required_version="3.0"/>
    <content src="index.html"/>
    <feature name="http://tizen.org/feature/screen.size.all"/>
    <feature name="http://tizen.org/feature/network.internet"/>
    <icon src="icon.png"/>
    <name>IPTV Premium Player</name>
    <tizen:privilege name="http://tizen.org/privilege/application.launch"/>
    <tizen:privilege name="http://tizen.org/privilege/internet"/>
    <tizen:privilege name="http://tizen.org/privilege/tv.inputdevice"/>
    <tizen:privilege name="http://tizen.org/privilege/mediastorage"/>
    <tizen:profile name="tv-samsung"/>
    <tizen:setting screen-orientation="landscape" context-menu="enable" background-support="disable" encryption="disable" install-location="auto"/>
    <tizen:metadata key="http://samsung.com/tv/metadata/use.avplayer" value="true"/>
</widget>
`;

fs.writeFileSync(path.join(outputDir, 'config.xml'), configXml, 'utf-8');

// Create placeholder icon.png if not present
const iconPath = path.join(outputDir, 'icon.png');
if (!fs.existsSync(iconPath)) {
  // Create 1x1 transparent PNG buffer
  const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(iconPath, png1x1);
}

console.log('✅ Samsung Tizen package generated successfully at: ' + outputDir);
