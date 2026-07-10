/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { handleConvertRequest } from './api/convert';
import { handleUploadTokenRequest } from './api/upload-token';
import type { HandleUploadBody } from '@vercel/blob/client';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/api/upload-token', async (req, res) => {
  try {
    const jsonResponse = await handleUploadTokenRequest(req.body as HandleUploadBody, req);
    return res.json(jsonResponse);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload token request failed';
    return res.status(400).json({ error: message });
  }
});

app.post('/api/convert', async (req, res) => {
  try {
    const result = await handleConvertRequest(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: unknown) {
    console.error('Conversion Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during form conversion';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  };
  startVite();
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bilingual Form App Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});
