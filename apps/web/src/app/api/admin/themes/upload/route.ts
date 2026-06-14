export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getAuthUser, checkPermission, getActiveWorkspace } from '../../../../../lib/auth';
import { apiSuccess, apiError } from '@opencms/api';
import { getWorkspaceRoot, extractExtensionZip } from '../../../../../lib/scanner';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const payload = await getAuthUser(req);
  if (!payload) return apiError('UNAUTHORIZED', 'Not authenticated', null, 401);

  const hasAccess = await checkPermission('manage_themes', req) || await checkPermission('manage_all', req);
  if (!hasAccess) return apiError('FORBIDDEN', 'No permission to manage themes', null, 403);

  const workspace = await getActiveWorkspace(req);
  if (!workspace) return apiError('WORKSPACE_NOT_FOUND', 'Workspace not found', null, 404);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return apiError('BAD_REQUEST', 'No file was uploaded', null, 400);
    }

    if (!file.name.endsWith('.zip')) {
      return apiError('BAD_REQUEST', 'Only zip archives are supported', null, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const root = getWorkspaceRoot();
    const tempDir = path.join(root, 'apps', 'web', 'src', 'lib', '.temp_uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempZipPath = path.join(tempDir, `${Date.now()}_theme.zip`);
    fs.writeFileSync(tempZipPath, buffer);

    const tempExtractPath = path.join(tempDir, `${Date.now()}_extracted`);

    try {
      extractExtensionZip(tempZipPath, tempExtractPath);

      const manifestPath = path.join(tempExtractPath, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        return apiError('BAD_REQUEST', 'Missing manifest.json inside theme package', null, 400);
      }

      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      if (!manifest.slug || !manifest.name) {
        return apiError('BAD_REQUEST', 'manifest.json must contain slug and name properties', null, 400);
      }

      const finalDest = path.join(root, 'packages', 'themes', 'custom', manifest.slug);
      if (fs.existsSync(finalDest)) {
        fs.rmSync(finalDest, { recursive: true, force: true });
      } else {
        const parent = path.dirname(finalDest);
        if (!fs.existsSync(parent)) {
          fs.mkdirSync(parent, { recursive: true });
        }
      }

      // Rename / move extracted folder to final custom destination
      fs.renameSync(tempExtractPath, finalDest);

      return apiSuccess({ slug: manifest.slug, name: manifest.name }, 'Theme uploaded and extracted successfully');
    } finally {
      // Clean up temp zip
      if (fs.existsSync(tempZipPath)) {
        try { fs.unlinkSync(tempZipPath); } catch {}
      }
      // Clean up temp extract if it still exists
      if (fs.existsSync(tempExtractPath)) {
        try { fs.rmSync(tempExtractPath, { recursive: true, force: true }); } catch {}
      }
    }
  } catch (error: any) {
    console.error('Theme upload error:', error);
    return apiError('UPLOAD_ERROR', error.message || 'Error occurred uploading theme', null, 500);
  }
}
