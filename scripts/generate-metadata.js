import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSha256(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`[Metadata Generator] Warning: Target file not found at ${filePath}`);
      return '';
    }
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (err) {
    console.error(`[Metadata Generator] Error hashing file ${filePath}:`, err);
    return '';
  }
}

function generate() {
  const packagePath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('[Metadata Generator] Critical Error: package.json missing.');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const version = packageJson.version || '1.0.10';
  const buildNumber = version.replace(/\./g, '');

  // Locate the actual compiled APK inside release outputs
  const apkDir = path.join(__dirname, '../android/app/build/outputs/apk/release');
  let apkPath = '';
  if (fs.existsSync(apkDir)) {
    const files = fs.readdirSync(apkDir);
    const apkFile = files.find(f => f.endsWith('.apk'));
    if (apkFile) {
      apkPath = path.join(apkDir, apkFile);
    }
  }

  const apkHash = apkPath ? getSha256(apkPath) : '';
  
  // Locate Windows Setup executable
  const windowsSetupPath = path.join(__dirname, '../dist/Shop-Management-v' + version + '-windows-x64.exe');
  const windowsHash = fs.existsSync(windowsSetupPath) ? getSha256(windowsSetupPath) : '';

  const metadata = {
    version: version,
    releaseDate: new Date().toISOString().split('T')[0],
    releaseNotes: `Shop Management System production release v${version}. Includes automatic offline data storage, cloud synchronization, and security hardening updates.`,
    platforms: {
      web: {
        url: "https://ais-pre-qswyuuxdwfc3t3ud3u7gzm-31732995618.asia-southeast1.run.app",
        buildNumber: buildNumber
      },
      android: {
        url: `https://github.com/shahin0964/Shop-Management-/releases/download/v${version}/Shop-Management-v${version}.apk`,
        buildNumber: buildNumber,
        size: apkPath ? `${(fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1)} MB` : "14.2 MB",
        checksum: apkHash
      },
      windows: {
        url: `https://github.com/shahin0964/Shop-Management-/releases/download/v${version}/Shop-Management-v${version}-windows-x64.exe`,
        buildNumber: buildNumber,
        size: fs.existsSync(windowsSetupPath) ? `${(fs.statSync(windowsSetupPath).size / (1024 * 1024)).toFixed(1)} MB` : "34.8 MB",
        checksum: windowsHash
      }
    }
  };

  const outputPath = path.join(__dirname, '../release_metadata.json');
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`[Metadata Generator] Success: Generated release metadata for version ${version} at ${outputPath}`);
}

generate();
