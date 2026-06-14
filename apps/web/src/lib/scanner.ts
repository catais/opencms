import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Finds the root directory of the monorepo by traversing upwards
export function getWorkspaceRoot(): string {
  let current = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(current, 'packages')) && fs.existsSync(path.join(current, 'apps'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

// Scans packages/themes/custom/ directory for dynamically uploaded themes
export function getCustomThemes(): any[] {
  const root = getWorkspaceRoot();
  const customDir = path.join(root, 'packages', 'themes', 'custom');
  if (!fs.existsSync(customDir)) {
    try {
      fs.mkdirSync(customDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create custom themes directory:', e);
    }
    return [];
  }

  const folders = fs.readdirSync(customDir);
  const themes: any[] = [];

  for (const folder of folders) {
    const fullPath = path.join(customDir, folder);
    if (fs.statSync(fullPath).isDirectory()) {
      const manifestPath = path.join(fullPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const content = fs.readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(content);
          if (manifest.slug && manifest.name) {
            themes.push({
              ...manifest,
              isCustom: true,
            });
          }
        } catch (e) {
          console.error(`Failed to parse custom theme manifest in "${folder}":`, e);
        }
      }
    }
  }
  return themes;
}

// Scans packages/plugins/custom/ directory for dynamically uploaded plugins
export function getCustomPlugins(): any[] {
  const root = getWorkspaceRoot();
  const customDir = path.join(root, 'packages', 'plugins', 'custom');
  if (!fs.existsSync(customDir)) {
    try {
      fs.mkdirSync(customDir, { recursive: true });
    } catch (e) {
      console.error('Failed to create custom plugins directory:', e);
    }
    return [];
  }

  const folders = fs.readdirSync(customDir);
  const plugins: any[] = [];

  for (const folder of folders) {
    const fullPath = path.join(customDir, folder);
    if (fs.statSync(fullPath).isDirectory()) {
      const manifestPath = path.join(fullPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const content = fs.readFileSync(manifestPath, 'utf8');
          const manifest = JSON.parse(content);
          if (manifest.slug && manifest.name) {
            plugins.push({
              ...manifest,
              isCustom: true,
            });
          }
        } catch (e) {
          console.error(`Failed to parse custom plugin manifest in "${folder}":`, e);
        }
      }
    }
  }
  return plugins;
}

// Extracts a .zip archive using Windows native PowerShell Expand-Archive
export function extractExtensionZip(zipPath: string, destPath: string): void {
  fs.mkdirSync(destPath, { recursive: true });
  
  // Construct PowerShell command
  const cmd = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destPath}' -Force"`;
  execSync(cmd, { stdio: 'inherit' });

  // Hoist nested single directories (so that manifest.json is on the root)
  const items = fs.readdirSync(destPath).filter(i => i !== '__MACOSX');
  if (items.length === 1 && !fs.existsSync(path.join(destPath, 'manifest.json'))) {
    const singleSubdir = path.join(destPath, items[0]);
    if (fs.statSync(singleSubdir).isDirectory()) {
      const subitems = fs.readdirSync(singleSubdir);
      for (const subitem of subitems) {
        fs.renameSync(path.join(singleSubdir, subitem), path.join(destPath, subitem));
      }
      try {
        fs.rmdirSync(singleSubdir);
      } catch (e) {
        console.warn(`Could not clean up subdirectory ${singleSubdir}:`, e);
      }
    }
  }
}
