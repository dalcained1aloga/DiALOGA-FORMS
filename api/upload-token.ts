/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { IncomingMessage } from 'node:http';
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
  'image/webp',
  'image/svg+xml',
];

export async function handleUploadTokenRequest(
  body: HandleUploadBody,
  request: IncomingMessage | Request,
) {
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

type VercelRequest = IncomingMessage & {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function isHandleUploadBody(value: unknown): value is HandleUploadBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as HandleUploadBody).type === 'string'
  );
}

async function readRawRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

export async function parseHandleUploadBody(req: VercelRequest): Promise<HandleUploadBody> {
  const { body } = req;

  if (isHandleUploadBody(body)) {
    return body;
  }

  if (typeof body === 'string') {
    return JSON.parse(body) as HandleUploadBody;
  }

  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString('utf8')) as HandleUploadBody;
  }

  const raw = await readRawRequestBody(req);
  if (!raw) {
    throw new Error('Request body is empty');
  }

  return JSON.parse(raw) as HandleUploadBody;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = await parseHandleUploadBody(req);
    const jsonResponse = await handleUploadTokenRequest(body, req);
    return res.status(200).json(jsonResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload token request failed';
    return res.status(400).json({ error: message });
  }
}
