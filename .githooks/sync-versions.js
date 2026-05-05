#!/usr/bin/env node
/**
 * Synchronizes version in src-capacitor/package.json with root package.json
 * Used by `npm version` postversion hook
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function syncVersions() {
  const rootPath = path.join(__dirname, '../package.json');
  const capacitorPath = path.join(__dirname, '../src-capacitor/package.json');

  // Read root package.json
  const rootPackage = JSON.parse(fs.readFileSync(rootPath, 'utf-8'));
  const rootVersion = rootPackage.version;

  // Read capacitor package.json
  const capacitorPackage = JSON.parse(fs.readFileSync(capacitorPath, 'utf-8'));

  // Update version if different
  if (capacitorPackage.version !== rootVersion) {
    capacitorPackage.version = rootVersion;
    fs.writeFileSync(capacitorPath, JSON.stringify(capacitorPackage, null, 2) + '\n', 'utf-8');
    console.log(`✓ Synced src-capacitor/package.json to version ${rootVersion}`);
  } else {
    console.log(`ℹ️  src-capacitor/package.json already at version ${rootVersion}`);
  }
}

syncVersions();
