/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { Request } from 'express';

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/csv',
  'text/plain',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
];

export async function handleUploadTokenRequest(body: HandleUploadBody, request: Request) {
  return handleUpload({
    body,
    request,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ALLOWED_UPLOAD_CONTENT_TYPES,
      addRandomSuffix: true,
    }),
  });
}

type VercelRequest = Request & {
  method?: string;
  body?: HandleUploadBody;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const jsonResponse = await handleUploadTokenRequest(req.body as HandleUploadBody, req);
    return res.status(200).json(jsonResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload token request failed';
    return res.status(400).json({ error: message });
  }
}
