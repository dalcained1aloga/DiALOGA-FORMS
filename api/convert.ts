/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import multer from 'multer';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';

dotenv.config();

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export interface ConvertInput {
  draftFile?: UploadedFile;
  logoFile?: UploadedFile;
  watermarkFile?: UploadedFile;
  textDraft?: string;
  customPrompt?: string;
  userLanguage?: string;
}

export interface ConvertSuccess {
  success: true;
  form: unknown;
  logoDataUrl: string;
  watermarkDataUrl: string;
}

export interface ConvertFailure {
  success: false;
  error: string;
}

export type ConvertResult = ConvertSuccess | ConvertFailure;

// Configure Google Gen AI SDK
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('WARNING: GEMINI_API_KEY environment variable is not set!');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
    });
  }
  return aiClient;
}

// Helper function to handle Gemini content generation with immediate model fallback and fast retry
async function generateContentWithRetry(
  ai: GoogleGenAI,
  contents: unknown[],
  systemInstruction: string,
  responseSchema: Record<string, unknown>
) {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash'];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini SDK] Attempting generation with model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.1,
        },
      });
      console.log(`[Gemini SDK] Success using model: ${model}`);
      return response;
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini SDK] Model ${model} failed. Error: ${errorMessage}`);
    }
  }

  try {
    console.log(
      `[Gemini SDK] All fallback models failed once. Waiting 1500ms before final retry with gemini-3.5-flash...`
    );
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
      },
    });
    console.log(`[Gemini SDK] Success on final retry using gemini-3.5-flash`);
    return response;
  } catch (error: unknown) {
    lastError = error;
  }

  throw (
    lastError ||
    new Error('All Gemini models are currently experiencing high demand. Please try again in a few moments.')
  );
}

function bufferToPart(file: UploadedFile) {
  return {
    inlineData: {
      data: file.buffer.toString('base64'),
      mimeType: file.mimetype,
    },
  };
}

function isQaAuditEnabled(): boolean {
  return process.env.ENABLE_QA_AUDIT === 'true';
}

function toBilingualText(spanish: string | undefined): { en: string; es: string } | undefined {
  if (spanish === undefined) return undefined;
  return { en: spanish, es: spanish };
}

function mapSpanishOnlyToBilingualForm(spanishForm: Record<string, unknown>): Record<string, unknown> {
  const pages = (spanishForm.pages as Array<Record<string, unknown>>) || [];

  return {
    ...spanishForm,
    formTitle: toBilingualText(spanishForm.formTitle as string),
    formDescription: toBilingualText(spanishForm.formDescription as string | undefined),
    hasEnglish: false,
    pages: pages.map((page) => ({
      ...page,
      sections: ((page.sections as Array<Record<string, unknown>>) || []).map((section) => ({
        ...section,
        sectionTitle: toBilingualText(section.sectionTitle as string),
        sectionDescription: toBilingualText(section.sectionDescription as string | undefined),
        fields: ((section.fields as Array<Record<string, unknown>>) || []).map((field) => ({
          ...field,
          label: toBilingualText(field.label as string),
          placeholder: toBilingualText(field.placeholder as string | undefined),
          helpText: toBilingualText(field.helpText as string | undefined),
          options: field.options
            ? ((field.options as Array<Record<string, unknown>>) || []).map((option) => ({
                ...option,
                label: toBilingualText(option.label as string),
              }))
            : undefined,
        })),
      })),
    })),
  };
}

export async function convertForm(input: ConvertInput): Promise<ConvertResult> {
  const ai = getAiClient();
  const {
    draftFile,
    logoFile,
    watermarkFile,
    textDraft,
    customPrompt = '',
    userLanguage = 'en',
  } = input;

  if (!draftFile && !textDraft) {
    return {
      success: false,
      error: 'No form draft provided. Please upload a file or write a draft.',
    };
  }

  const contents: unknown[] = [];

  if (draftFile) {
    const mime = draftFile.mimetype.toLowerCase();
    const filename = draftFile.originalname.toLowerCase();

    let isProcessedAsText = false;
    let extractedText = '';

    if (
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel' ||
      filename.endsWith('.xlsx') ||
      filename.endsWith('.xls')
    ) {
      try {
        const workbook = XLSX.read(draftFile.buffer, { type: 'buffer' });
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          extractedText += `Sheet: ${sheetName}\n${csvContent}\n\n`;
        }
        isProcessedAsText = true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error parsing Excel file:', err);
        throw new Error(`Failed to parse Excel spreadsheet: ${message}`);
      }
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword' ||
      filename.endsWith('.docx') ||
      filename.endsWith('.doc')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: draftFile.buffer });
        extractedText = result.value;
        isProcessedAsText = true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error parsing Word document:', err);
        throw new Error(`Failed to parse Word document: ${message}`);
      }
    } else if (
      mime === 'text/csv' ||
      mime === 'text/plain' ||
      filename.endsWith('.csv') ||
      filename.endsWith('.txt')
    ) {
      try {
        extractedText = draftFile.buffer.toString('utf-8');
        isProcessedAsText = true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Error parsing text/csv file:', err);
        throw new Error(`Failed to read text or CSV file: ${message}`);
      }
    }

    if (isProcessedAsText) {
      contents.push({
        text: `Here is the extracted content from the uploaded draft file (${draftFile.originalname}):\n\n${extractedText}\n\nAnalyze this content, identify the form structure, fields, options, and sections.`,
      });
    } else {
      contents.push(bufferToPart(draftFile));
      contents.push({
        text: `This is the main draft of the form. Analyze this document and extract its full contents, structure, and fields.`,
      });
    }
  } else if (textDraft) {
    contents.push({
      text: `Here is the form draft content provided as text:\n\n${textDraft}`,
    });
  }

  if (logoFile) {
    contents.push(bufferToPart(logoFile));
    contents.push({
      text: `This is the brand logo. Analyze its colors, style, typography, and mood. We must inherit these styles for the form's CSS theme.`,
    });
  }

  const systemInstruction = `You are an expert full-stack developer and UX/UI brand designer specializing in print-ready, high-fidelity corporate, medical, and administrative forms.
Your goal is to parse form drafts (which can be unstructured documents, spreadsheets, lists, or tables) and convert them into a structured, Spanish-only JSON representation of a beautifully styled webform.

CRITICAL DESIGN & CONTENT RULES:
1. 100% CONTENT FIDELITY (NON-NEGOTIABLE): You must respect 100% of the draft content. You are strictly forbidden from omitting, dropping, summarizing, grouping, or combining different fields, options, or questions from the draft. Every single question, field, description, declaration, list of required documents or attachments, checklist, option, instruction block, note, or signature block in the draft must be fully represented. Even small, short, or auxiliary text fields and checkboxes must be preserved. Complete content integrity is non-negotiable.
2. SPANISH-ONLY TEXT: Every field label, section title, description, placeholder, and option MUST be written in Spanish. If the source draft is in another language, translate it professionally into Spanish. Use high-quality, natural Spanish terminology.
3. LAYOUT & GRID ARRANGEMENT: Use the 'gridWidth' field (values 1-12) to place fields side-by-side cleanly and professionally.
   - Fields like 'First Name' & 'Last Name' should have gridWidth: 6.
   - Fields like 'City', 'State', 'Zip' should have gridWidth: 4, 4, 4 or 5, 3, 4.
   - Short fields (e.g., ID, Gender, DOB, Date, Age, Phone) should share rows with other fields to keep the layout looking neat.
   - Only use gridWidth: 12 (full-width) for long fields, textareas, signatures, or grids.
4. CONTEXT & STRUCTURE: Respect the exact semantic structure of the draft. Keep all sections, groups, instructions, statements, disclaimers, and footnotes. Organize fields into highly logical pages and sections. Page optimization is completely flexible: do NOT try to fit everything onto fewer pages if it means compressing fields so much that items are consolidated or omitted. Let the form span across as many pages as naturally required to preserve perfect fidelity and comfortable spacing.
5. THEME DESIGN: Analyze the brand logo (if provided) to extract:
   - 'primaryColor': The main dominant color.
   - 'secondaryColor': A supporting dark color.
   - 'accentColor': A highlight color.
   - 'backgroundColor': A very light, soft background tint (e.g., extremely pale gray, warm cream, or light blue depending on logo). Never pure white, but close to it for clean contrast.
   - 'textColor': A dark gray or slate hex code.
   - 'fontFamily': Choose 'sans' for modern/tech/corporate, 'serif' for classic/legal/editorial, or 'mono' for technical/brutalist.
   - 'borderRadius': Choose 'none', 'sm', 'md', 'lg', 'xl', or 'full' to match the logo styling.
   - If no logo is provided, design a beautiful, highly professional brand identity (e.g. clean deep navy #0f172a primary, soft cool gray backgrounds) that fits the context of the form.
6. INPUT FIELDS OPTIMIZATION: Choose the most appropriate field types:
   - Use 'select' or 'radio' for multiple-choice lists with specific options.
   - Use 'checkbox' for boolean fields.
   - Use 'date' for birthdays, date of signature, etc.
   - Use 'textarea' for comments, notes, or multi-line questions.
   - Use 'signature' for signature blocks (always provide name, signature, and date). Place signature blocks at the very bottom of the last page.
   - Use 'grid' for matrices of radio buttons or checkboxes (like ratings or multi-question reviews).
7. WATERMARK OPACITY: Set 'watermarkOpacity' to a safe, subtle level (e.g., 0.05) so it is visible but does not interfere with the readability of text.
8. REQUIRED DOCUMENTS & ATTACHMENTS CHECKLISTS: If the form contains a list of required documents to attach or checklist of items, do NOT omit them. Represent them as interactive 'checkbox' fields so users can tick them as they provide the files (e.g., in a dedicated section named "Documentos Requeridos" or "Adjuntos").`;

  const userPromptText = `Please convert this form draft into a beautifully structured, Spanish-only webform.
${customPrompt ? `ADDITIONAL USER INSTRUCTIONS: ${customPrompt}` : ''}
${logoFile ? 'The brand logo is attached. Make sure to extract its dominant colors and style for the theme.' : "No logo was attached, so please generate a premium, high-contrast, modern professional color theme appropriate for this form's context."}
The primary language of the input draft is "${userLanguage}". Produce all user-facing text in Spanish (translate from the source language if needed).
IMPORTANT MANDATES FOR 100% RECALL AND COMPLETENESS:
- You MUST capture, transcribe, and represent 100% of the questions, fields, checkboxes, options, list items, and text blocks in the draft.
- Do NOT consolidate, summarize, simplify, drop, or omit ANY part of the draft. Each item should be preserved in its full, exact context.
- This includes final notes, instruction blocks, lists of required documents, checklists of attachments, declarations, informational text, and disclaimers.
- If there is a list of required documents to attach, model them as individual, interactive 'checkbox' fields so the user can check them off inside the form.
- While you should use 'gridWidth' to align fields side-by-side beautifully, page count limits are completely flexible. Do NOT drop or merge any fields to save pages; let the form span as many pages as naturally needed for absolute, perfect, 100% accuracy.`;

  contents.push({ text: userPromptText });

  const responseSchema: Record<string, unknown> = {
    type: Type.OBJECT,
    properties: {
      formTitle: { type: Type.STRING, description: 'Form title in Spanish' },
      formDescription: { type: Type.STRING, description: 'Form description in Spanish' },
      theme: {
        type: Type.OBJECT,
        properties: {
          primaryColor: { type: Type.STRING, description: 'hex code primary brand color (e.g. #1e3a8a)' },
          secondaryColor: { type: Type.STRING, description: 'hex code secondary dark color' },
          accentColor: { type: Type.STRING, description: 'hex code accent color' },
          backgroundColor: { type: Type.STRING, description: 'very soft tint background color, close to off-white' },
          textColor: { type: Type.STRING, description: 'dark charcoal text color' },
          fontFamily: { type: Type.STRING, enum: ['sans', 'serif', 'mono'] },
          borderRadius: { type: Type.STRING, enum: ['none', 'sm', 'md', 'lg', 'xl', 'full'] },
          logoPosition: { type: Type.STRING, enum: ['left', 'center', 'right'] },
          watermarkOpacity: { type: Type.NUMBER, description: 'subtle watermark opacity between 0.02 and 0.08' },
        },
        required: [
          'primaryColor',
          'secondaryColor',
          'accentColor',
          'backgroundColor',
          'textColor',
          'fontFamily',
          'borderRadius',
          'logoPosition',
          'watermarkOpacity',
        ],
      },
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pageNumber: { type: Type.INTEGER },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sectionTitle: { type: Type.STRING, description: 'Section title in Spanish' },
                  sectionDescription: { type: Type.STRING, description: 'Section description in Spanish' },
                  fields: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING, description: 'Field label in Spanish' },
                        type: {
                          type: Type.STRING,
                          enum: [
                            'text',
                            'number',
                            'email',
                            'phone',
                            'date',
                            'textarea',
                            'select',
                            'checkbox',
                            'radio',
                            'signature',
                            'grid',
                          ],
                        },
                        placeholder: { type: Type.STRING, description: 'Placeholder text in Spanish' },
                        required: { type: Type.BOOLEAN },
                        gridWidth: {
                          type: Type.INTEGER,
                          description:
                            'column span (1-12) in grid. Compress fields: use 6 for side-by-side, 4 for 3-in-a-row, 12 for full width.',
                        },
                        helpText: { type: Type.STRING, description: 'Help text in Spanish' },
                        defaultValue: { type: Type.STRING },
                        options: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              value: { type: Type.STRING },
                              label: { type: Type.STRING, description: 'Option label in Spanish' },
                            },
                            required: ['value', 'label'],
                          },
                        },
                      },
                      required: ['id', 'label', 'type', 'required', 'gridWidth'],
                    },
                  },
                },
                required: ['id', 'sectionTitle', 'fields'],
              },
            },
          },
          required: ['pageNumber', 'sections'],
        },
      },
    },
    required: ['formTitle', 'theme', 'pages'],
  };

  const response = await generateContentWithRetry(ai, contents, systemInstruction, responseSchema);

  const formJsonText = response.text || '{}';
  const formJson = JSON.parse(formJsonText);

  let finalFormJson = formJson;

  if (isQaAuditEnabled()) {
    try {
      console.log('[QA Auditor] Constructing draft context for second-pass completeness audit...');
      const draftContents: unknown[] = [];
      if (draftFile) {
        const mime = draftFile.mimetype.toLowerCase();
        const filename = draftFile.originalname.toLowerCase();
        let isProcessedAsText = false;
        let extractedText = '';

        if (
          mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          mime === 'application/vnd.ms-excel' ||
          filename.endsWith('.xlsx') ||
          filename.endsWith('.xls')
        ) {
          try {
            const workbook = XLSX.read(draftFile.buffer, { type: 'buffer' });
            for (const sheetName of workbook.SheetNames) {
              const worksheet = workbook.Sheets[sheetName];
              const csvContent = XLSX.utils.sheet_to_csv(worksheet);
              extractedText += `Sheet: ${sheetName}\n${csvContent}\n\n`;
            }
            isProcessedAsText = true;
          } catch (err: unknown) {
            console.error('[QA Auditor] Error reading sheet:', err);
          }
        } else if (
          mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mime === 'application/msword' ||
          filename.endsWith('.docx') ||
          filename.endsWith('.doc')
        ) {
          try {
            const result = await mammoth.extractRawText({ buffer: draftFile.buffer });
            extractedText = result.value;
            isProcessedAsText = true;
          } catch (err: unknown) {
            console.error('[QA Auditor] Error reading word doc:', err);
          }
        } else if (
          mime === 'text/csv' ||
          mime === 'text/plain' ||
          filename.endsWith('.csv') ||
          filename.endsWith('.txt')
        ) {
          try {
            extractedText = draftFile.buffer.toString('utf-8');
            isProcessedAsText = true;
          } catch (err: unknown) {
            console.error('[QA Auditor] Error reading text file:', err);
          }
        }

        if (isProcessedAsText) {
          draftContents.push({
            text: `Here is the extracted content from the uploaded draft file (${draftFile.originalname}):\n\n${extractedText}`,
          });
        } else {
          draftContents.push(bufferToPart(draftFile));
          draftContents.push({
            text: `This is the main draft of the form.`,
          });
        }
      } else if (textDraft) {
        draftContents.push({
          text: `Here is the form draft content provided as text:\n\n${textDraft}`,
        });
      }

      const auditorPromptText = `You are a strict QA (Quality Assurance) Completeness Inspector.
Compare the original draft (provided above) with the initial generated JSON form below.

Initial Generated JSON Form:
\`\`\`json
${JSON.stringify(formJson, null, 2)}
\`\`\`

YOUR TASK IS TO PERFECT THIS FORM BY RESOLVING ALL ISSUES AND OMISSIONS.

RIGOROUS RULES FOR 100% COMPLETENESS:
1. NO OMISSION ALLOWED: You are strictly forbidden from omitting, dropping, summarizing, grouping, or combining any fields, options, or questions from the draft. Every single question, field, description, declaration, list of required documents or attachments, checklist, option, instruction block, note, or signature block in the draft must be fully represented.
2. DISCOVER MISSING FIELDS: Find every field, checkbox, text label, note, instruction, disclaimer, attachment requirement, or section that was in the draft but is missing or combined in the initial JSON.
3. PREVENT TRUNCATION: Make sure all sections of the form (especially middle and end sections like Required Documents, Attachments, Notes, Agreements, Disclaimers, and Signatures) are completely included as distinct fields.
4. REPRESENT REQUIRED DOCUMENTS: If the form draft lists documents that must be attached (e.g. ID, Proof of Residence, Medical Records), model them as individual, interactive 'checkbox' fields under a distinct section named "Documentos Requeridos" or "Adjuntos" so the user can tick them off.
5. KEEP THE VALID WORK: Keep all the fields, styles, and options that were already correctly generated in the initial JSON. Do not destroy or degrade existing valid form structure; only expand, enrich, and correct any missing parts.
6. SPANISH-ONLY TEXT: For any newly added or corrected field, section, or option, write all user-facing text in Spanish.
${customPrompt ? `7. RESPECT ADDITIONAL USER INSTRUCTIONS: Make sure you also implement these custom rules: "${customPrompt}"` : ''}

Output the final, perfected, 100% complete form JSON according to the schema.`;

      const auditorContents = [...draftContents, { text: auditorPromptText }];

      console.log('[QA Auditor] Running second-pass refinement call to ensure 100% content fidelity...');
      const auditResponse = await generateContentWithRetry(
        ai,
        auditorContents,
        'You are a strict, professional Quality Assurance Auditor for digital form designs. Your primary metric is 100% data recall, completeness, and Spanish-language fidelity.',
        responseSchema
      );

      const auditJsonText = auditResponse.text || '{}';
      const auditedJson = JSON.parse(auditJsonText);

      if (auditedJson && auditedJson.pages && auditedJson.pages.length > 0) {
        console.log('[QA Auditor] Second-pass refinement succeeded and retrieved complete JSON.');
        finalFormJson = auditedJson;
      } else {
        console.warn('[QA Auditor] Returned audited JSON is missing pages. Falling back to first-pass.');
      }
    } catch (auditErr: unknown) {
      console.error('[QA Auditor] QA refinement call failed. Error:', auditErr);
      console.log('[QA Auditor] Resiliently falling back to initial first-pass form JSON.');
    }
  } else {
    console.log('[QA Auditor] Skipped (ENABLE_QA_AUDIT is not true). Single-pass conversion.');
  }

  let logoDataUrl = '';
  if (logoFile) {
    logoDataUrl = `data:${logoFile.mimetype};base64,${logoFile.buffer.toString('base64')}`;
  }

  let watermarkDataUrl = '';
  if (watermarkFile) {
    watermarkDataUrl = `data:${watermarkFile.mimetype};base64,${watermarkFile.buffer.toString('base64')}`;
  }

  const bilingualForm = mapSpanishOnlyToBilingualForm(finalFormJson);

  return {
    success: true,
    form: bilingualForm,
    logoDataUrl,
    watermarkDataUrl,
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function toUploadedFile(file: { buffer: Buffer; mimetype: string; originalname: string }): UploadedFile {
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
  };
}

function runMulter(
  req: Request,
  res: Response,
  middleware: ReturnType<typeof upload.fields>
): Promise<void> {
  return new Promise((resolve, reject) => {
    middleware(req, res, (err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

type VercelRequest = Request & {
  method?: string;
  body?: Record<string, string>;
  files?: {
    [fieldname: string]: Array<{ buffer: Buffer; mimetype: string; originalname: string }>;
  };
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
    await runMulter(
      req,
      res as unknown as Response,
      upload.fields([
        { name: 'draft', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
        { name: 'watermark', maxCount: 1 },
      ])
    );

    const files = req.files;
    const draftFile = files?.['draft']?.[0];
    const logoFile = files?.['logo']?.[0];
    const watermarkFile = files?.['watermark']?.[0];

    const result = await convertForm({
      draftFile: draftFile ? toUploadedFile(draftFile) : undefined,
      logoFile: logoFile ? toUploadedFile(logoFile) : undefined,
      watermarkFile: watermarkFile ? toUploadedFile(watermarkFile) : undefined,
      textDraft: req.body?.textDraft,
      customPrompt: req.body?.customPrompt || '',
      userLanguage: req.body?.language || 'en',
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Conversion Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred during form conversion';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
