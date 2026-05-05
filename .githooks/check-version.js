#!/usr/bin/env node
/**
 * Validates that git tags match package.json versions
 * Usage: node .githooks/check-version.js [tag]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getPackageVersion(filePath = '../package.json') {
  const fullPath = path.join(__dirname, filePath);
  const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  return packageJson.version;
}

function getPackageVersions() {
  const rootVersion = getPackageVersion('../package.json');
  const capacitorVersion = getPackageVersion('../src-capacitor/package.json');

  return {
    root: rootVersion,
    capacitor: capacitorVersion,
  };
}

function normalizeVersion(version) {
  // Remove 'v' prefix if present
  return version.replace(/^v/, '');
}

function main() {
  const versions = getPackageVersions();
  const tag = process.argv[2];

  if (!tag) {
    console.log('ℹ️  No tag provided, skipping version check');
    process.exit(0);
  }

  const normalizedTag = normalizeVersion(tag);
  const normalizedRootVersion = normalizeVersion(versions.root);
  const normalizedCapacitorVersion = normalizeVersion(versions.capacitor);

  // Check if both package.json files have the same version
  if (normalizedRootVersion !== normalizedCapacitorVersion) {
    console.error(`✗ Version mismatch between package.json files!`);
    console.error(`  package.json:             "${versions.root}"`);
    console.error(`  src-capacitor/package.json: "${versions.capacitor}"`);
    console.error(``);
    console.error(`Please ensure both package.json files have the same version.`);
    process.exit(1);
  }

  // Check if tag matches package.json versions
  if (normalizedTag === normalizedRootVersion) {
    console.log(
      `✓ Version match: tag "${tag}" matches both package.json files (version "${versions.root}")`,
    );
    process.exit(0);
  } else {
    console.error(`✗ Version mismatch!`);
    console.error(`  Git tag:                    "${tag}" (normalized: "${normalizedTag}")`);
    console.error(
      `  package.json:               "${versions.root}" (normalized: "${normalizedRootVersion}")`,
    );
    console.error(
      `  src-capacitor/package.json: "${versions.capacitor}" (normalized: "${normalizedCapacitorVersion}")`,
    );
    console.error(``);
    console.error(`Please ensure your git tag and both package.json files have matching versions.`);
    process.exit(1);
  }
}

main();
