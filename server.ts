/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { convertForm, type UploadedFile } from './api/convert.js';
import { unauthorizedResponse, verifyGoogleIdToken } from './api/verifyAuth.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function toUploadedFile(file: Express.Multer.File): UploadedFile {
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
  };
}

app.post(
  '/api/convert',
  upload.fields([
    { name: 'draft', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'watermark', maxCount: 1 },
  ]),
  async (req, res) => {
    const verifiedUser = await verifyGoogleIdToken(req.headers.authorization);
    if (!verifiedUser) {
      return res.status(401).json(unauthorizedResponse());
    }

    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const draftFile = files?.['draft']?.[0];
      const logoFile = files?.['logo']?.[0];
      const watermarkFile = files?.['watermark']?.[0];

      const result = await convertForm({
        draftFile: draftFile ? toUploadedFile(draftFile) : undefined,
        logoFile: logoFile ? toUploadedFile(logoFile) : undefined,
        watermarkFile: watermarkFile ? toUploadedFile(watermarkFile) : undefined,
        textDraft: req.body.textDraft,
        customPrompt: req.body.customPrompt || '',
        userLanguage: req.body.language || 'en',
      });

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
  }
);

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
