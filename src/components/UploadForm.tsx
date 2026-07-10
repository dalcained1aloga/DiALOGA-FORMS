/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { Upload, FileText, Image as ImageIcon, Sparkles, Languages, RefreshCw, FileCode } from 'lucide-react';
import { SAMPLE_DRAFTS, DEFAULT_LOGO_SVG, DEFAULT_WATERMARK_SVG } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface UploadFormProps {
  onConvert: (formData: FormData) => void;
  isLoading: boolean;
}

function sanitizeBlobPathname(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  const stem = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const extension = lastDot > 0 ? filename.slice(lastDot + 1) : '';

  const sanitizedStem = stem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const sanitizedName = extension
    ? `${sanitizedStem || 'file'}.${extension.toLowerCase()}`
    : sanitizedStem || 'file';

  return `${Date.now()}-${sanitizedName}`;
}

export default function UploadForm({ onConvert, isLoading }: UploadFormProps) {
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Hover/Drag states for styles
  const [isDragDraft, setIsDragDraft] = useState(false);
  const [isDragLogo, setIsDragLogo] = useState(false);
  const [isDragWatermark, setIsDragWatermark] = useState(false);

  // Hidden file input refs
  const draftInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (index: number) => {
    const sample = SAMPLE_DRAFTS[index];
    setTextDraft(sample.text);
    // Clear draft file if a sample is loaded to avoid confusion
    setDraftFile(null);
    if (draftInputRef.current) draftInputRef.current.value = '';
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDraftFile(file);
      setTextDraft(''); // Clear manual text when a file is uploaded
    }
  };

  const uploadFileToBlob = async (file: File, onProgress?: (loaded: number, total: number) => void) => {
    const pathname = sanitizeBlobPathname(file.name);
    const result = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload-token',
      onUploadProgress: onProgress
        ? ({ loaded, total }) => {
            if (total > 0) onProgress(loaded, total);
          }
        : undefined,
    });
    return result.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!draftFile && !textDraft.trim()) {
      alert(
        language === 'en'
          ? 'Please upload a draft file or select a sample draft.'
          : 'Por favor, suba un archivo de borrador o seleccione un borrador de muestra.'
      );
      return;
    }

    const filesToUpload = [draftFile, logoFile, watermarkFile].filter(Boolean) as File[];
    let completedBytes = 0;
    const totalBytes = filesToUpload.reduce((sum, file) => sum + file.size, 0);

    const trackProgress = (loaded: number, total: number) => {
      if (totalBytes === 0) return;
      const fileShare = total / totalBytes;
      const overall = Math.min(100, Math.round(((completedBytes + loaded * fileShare) / totalBytes) * 100));
      setUploadProgress(overall);
    };

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let draftUrl: string | undefined;
      let draftFilename: string | undefined;
      let draftMimeType: string | undefined;
      let logoUrl: string | undefined;
      let watermarkUrl: string | undefined;

      if (draftFile) {
        draftUrl = await uploadFileToBlob(draftFile, trackProgress);
        completedBytes += draftFile.size;
        draftFilename = draftFile.name;
        draftMimeType = draftFile.type;
      }

      if (logoFile) {
        logoUrl = await uploadFileToBlob(logoFile, trackProgress);
        completedBytes += logoFile.size;
      }

      if (watermarkFile) {
        watermarkUrl = await uploadFileToBlob(watermarkFile, trackProgress);
        completedBytes += watermarkFile.size;
      }

      const payload = {
        draftUrl,
        logoUrl,
        watermarkUrl,
        draftFilename,
        draftMimeType,
        textDraft: draftFile ? undefined : textDraft.trim(),
        customPrompt,
        language,
      };

      onConvert(
        new Blob([JSON.stringify(payload)], { type: 'application/json' }) as unknown as FormData
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'File upload failed';
      alert(
        language === 'en'
          ? `Upload failed: ${message}`
          : `Error al subir archivos: ${message}`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag and drop handlers
  const onDragOver = (e: React.DragEvent, setDrag: (b: boolean) => void) => {
    e.preventDefault();
    setDrag(true);
  };

  const onDragLeave = (setDrag: (b: boolean) => void) => {
    setDrag(false);
  };

  const onDrop = (e: React.DragEvent, setDrag: (b: boolean) => void, setFile: (f: File | null) => void, isDraft = false) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFile(file);
      if (isDraft) {
        setTextDraft('');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="upload-form-container">
      {/* Header section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-100">
          <Sparkles className="w-4 h-4 mr-1.5 text-blue-500 animate-pulse" />
          Powered by Gemini 3.5 Flash
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl leading-none">
          {language === 'en' ? 'Bilingual Form Style Converter' : 'Convertidor de Formularios Bilingüe'}
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          {language === 'en'
            ? 'Convert unstructured Word, Excel, or text drafts into elegant, bilingual, print-optimized digital forms with automatic brand design adaptation.'
            : 'Convierta borradores desestructurados de Word, Excel o texto en elegantes formularios digitales bilingües y optimizados para impresión con adaptación automática de diseño de marca.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border border-slate-150 shadow-xl shadow-slate-100/50">
        {/* Language Selection */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-700">
              {language === 'en' ? 'Application Language:' : 'Idioma de la aplicación:'}
            </span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                language === 'es' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Español
            </button>
          </div>
        </div>

        {/* 1. Main Draft Upload or Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <label className="block text-base font-bold text-slate-800">
              1. {language === 'en' ? 'Form Draft Source' : 'Origen del Borrador del Formulario'}
            </label>
            <span className="text-xs text-slate-400">
              {language === 'en' ? 'Support Word, Excel, PDF, CSV, TXT' : 'Soporta Word, Excel, PDF, CSV, TXT'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Drag and Drop */}
            <div
              onDragOver={(e) => onDragOver(e, setIsDragDraft)}
              onDragLeave={() => onDragLeave(setIsDragDraft)}
              onDrop={(e) => onDrop(e, setIsDragDraft, (f) => setDraftFile(f), true)}
              onClick={() => draftInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                isDragDraft
                  ? 'border-blue-500 bg-blue-50/50'
                  : draftFile
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={draftInputRef}
                onChange={handleDraftChange}
                accept=".docx,.xlsx,.xls,.pdf,.txt,.csv"
                className="hidden"
              />
              {draftFile ? (
                <>
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 mb-2">
                    <FileCode className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 max-w-full truncate px-4">{draftFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(draftFile.size / 1024).toFixed(1)} KB • {language === 'en' ? 'Click to change' : 'Clic para cambiar'}
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-slate-100 p-3 rounded-full text-slate-500 mb-2">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {language === 'en' ? 'Drag & drop form draft' : 'Arrastre y suelte el borrador'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === 'en' ? 'or click to browse from device' : 'o haga clic para buscar en su dispositivo'}
                  </p>
                </>
              )}
            </div>

            {/* Quick Sample Selector */}
            <div className="border border-slate-150 rounded-xl p-5 bg-slate-50/50 flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 block">
                {language === 'en' ? 'Or pick a quick sample draft:' : 'O elija un borrador de muestra rápido:'}
              </span>
              <div className="space-y-2 flex-grow flex flex-col justify-center">
                {SAMPLE_DRAFTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(idx)}
                    className="flex items-start text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-white transition-all group"
                  >
                    <FileText className="w-4 h-4 text-blue-500 mt-0.5 mr-2.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                        {language === 'en' ? sample.name : sample.nameEs}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {language === 'en' ? sample.description : sample.descriptionEs}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Draft editor as backup */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 block">
              {language === 'en' ? 'Draft Text Preview & Edit Area:' : 'Área de vista previa y edición de texto del borrador:'}
            </span>
            <textarea
              value={textDraft}
              onChange={(e) => {
                setTextDraft(e.target.value);
                setDraftFile(null); // Clear file if text is manually typed
              }}
              rows={6}
              placeholder={
                language === 'en'
                  ? "Enter questions, field names, sections, options, or paste Excel columns/Word content here..."
                  : "Ingrese preguntas, nombres de campos, secciones, opciones o pegue columnas de Excel/contenido de Word aquí..."
              }
              className="w-full text-sm font-mono p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all resize-y"
            />
          </div>
        </div>

        {/* 2. Style inheritance: Logo & Watermark */}
        <div className="border-t border-slate-100 pt-6">
          <label className="block text-base font-bold text-slate-800 mb-1">
            2. {language === 'en' ? 'Brand Visual Assets' : 'Activos Visuales de Marca'}
          </label>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'en'
              ? 'Our AI will scan your logo to extract its color palette and apply it cleanly to the form layout.'
              : 'Nuestra IA escaneará su logotipo para extraer su paleta de colores y aplicarla limpiamente al diseño del formulario.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 block">
                {language === 'en' ? 'Company Brand Logo (Optional)' : 'Logotipo de Marca de la Empresa (Opcional)'}
              </span>
              <div
                onDragOver={(e) => onDragOver(e, setIsDragLogo)}
                onDragLeave={() => onDragLeave(setIsDragLogo)}
                onDrop={(e) => onDrop(e, setIsDragLogo, setLogoFile)}
                onClick={() => logoInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                  isDragLogo
                    ? 'border-blue-500 bg-blue-50/50'
                    : logoFile
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                {logoFile ? (
                  <>
                    <ImageIcon className="w-6 h-6 text-emerald-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{logoFile.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{language === 'en' ? 'Click to change' : 'Clic para cambiar'}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700">{language === 'en' ? 'Upload Logo' : 'Subir Logotipo'}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG</span>
                  </>
                )}
              </div>
            </div>

            {/* Watermark Upload */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 block flex items-center">
                {language === 'en' ? 'Custom Watermark (Optional)' : 'Marca de Agua Personalizada (Opcional)'}
                <span className="ml-1 text-[10px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                  {language === 'en' ? 'Fallback: Logo used' : 'Fallo: Se usa el Logo'}
                </span>
              </span>
              <div
                onDragOver={(e) => onDragOver(e, setIsDragWatermark)}
                onDragLeave={() => onDragLeave(setIsDragWatermark)}
                onDrop={(e) => onDrop(e, setIsDragWatermark, setWatermarkFile)}
                onClick={() => watermarkInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                  isDragWatermark
                    ? 'border-blue-500 bg-blue-50/50'
                    : watermarkFile
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={watermarkInputRef}
                  onChange={(e) => setWatermarkFile(e.target.files?.[0] || null)}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                {watermarkFile ? (
                  <>
                    <ImageIcon className="w-6 h-6 text-emerald-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{watermarkFile.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{language === 'en' ? 'Click to change' : 'Clic para cambiar'}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700">{language === 'en' ? 'Upload Watermark' : 'Subir Marca de Agua'}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, SVG</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Custom AI constraints / directions */}
        <div className="border-t border-slate-100 pt-6 space-y-2">
          <label className="block text-base font-bold text-slate-800">
            3. {language === 'en' ? 'Custom Conversion Directives' : 'Directivas de Conversión Personalizadas'}
          </label>
          <p className="text-xs text-slate-500">
            {language === 'en'
              ? 'Tell the AI any specific styling rules, additional fields to inject, or formatting preferences.'
              : 'Indique a la IA cualquier regla de estilo específica, campos adicionales a inyectar o preferencias de formato.'}
          </p>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={
              language === 'en'
                ? "e.g., 'Make primary color emerald green', 'Add a multi-line terms and conditions section at the end', 'Keep it to exactly 1 page'"
                : "ej., 'Haga que el color primario sea verde esmeralda', 'Agregue una sección de términos y condiciones al final', 'Manténgalo en exactamente 1 página'"
            }
            className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        {/* Submit action */}
        <div className="border-t border-slate-100 pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isUploading || (!draftFile && !textDraft.trim())}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all duration-150 cursor-pointer text-base hover:scale-[1.02] active:scale-[0.98]"
            id="convert-button"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>
                  {language === 'en'
                    ? `Uploading files... ${uploadProgress}%`
                    : `Subiendo archivos... ${uploadProgress}%`}
                </span>
              </>
            ) : isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>{language === 'en' ? 'Converting with Gemini...' : 'Convirtiendo con Gemini...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-blue-200" />
                <span>{language === 'en' ? 'Generate Bilingual Webform' : 'Generar Formulario Web Bilingüe'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading state overlays/cards with fun status lines */}
      <AnimatePresence>
        {(isLoading || isUploading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100 mx-auto animate-pulse">
                  <Sparkles className="w-10 h-10 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-white shadow">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {isUploading
                  ? language === 'en'
                    ? 'Uploading Files'
                    : 'Subiendo Archivos'
                  : language === 'en'
                    ? 'AI Conversion In Progress'
                    : 'Conversión de IA en Progreso'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {isUploading
                  ? language === 'en'
                    ? `Securely uploading your files to storage (${uploadProgress}%).`
                    : `Subiendo sus archivos de forma segura al almacenamiento (${uploadProgress}%).`
                  : language === 'en'
                    ? 'Gemini is reading your draft, extracting sections, optimizing grid alignments, matching logo colors, and building a fully translated bilingual form.'
                    : 'Gemini está leyendo su borrador, extrayendo secciones, optimizando alineaciones de cuadrícula, haciendo coincidir los colores de su logotipo y creando un formulario bilingüe traducido.'}
              </p>

              {/* Fake progress/status text rotation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-xs text-slate-600 text-left space-y-1.5 h-20 flex flex-col justify-center">
                <div className="flex items-center text-blue-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-ping" />
                  <span>[Gemini 3.5] Reading document structure...</span>
                </div>
                <div className="text-slate-400">
                  <span>[Theme] Matching extracted brand palette...</span>
                </div>
                <div className="text-slate-400">
                  <span>[Bilingual] Generating English & Spanish keys...</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
