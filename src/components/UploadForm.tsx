/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadFormProps {
  onConvert: (formData: FormData) => void;
  isLoading: boolean;
}

const MAX_PAYLOAD_BYTES = 3_000_000;

type CompressionProfile = {
  maxDimension: number;
  quality: number;
  forceJpeg?: boolean;
};

const LOGO_DRAFT_PROFILE: CompressionProfile = {
  maxDimension: 1600,
  quality: 0.8,
};

const WATERMARK_PROFILE: CompressionProfile = {
  maxDimension: 1000,
  quality: 0.5,
  forceJpeg: true,
};

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

async function compressImageFile(file: File, profile: CompressionProfile = LOGO_DRAFT_PROFILE): Promise<File> {
  if (!isImageFile(file)) return file;

  const img = new Image();
  const url = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });

    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > profile.maxDimension) {
      const scale = profile.maxDimension / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    const preferWebP = !profile.forceJpeg && file.type === 'image/webp';
    const mimeType = preferWebP ? 'image/webp' : 'image/jpeg';
    const ext = preferWebP ? 'webp' : 'jpg';

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, profile.quality);
    });

    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, { type: mimeType });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function FacetedHexagon({ step }: { step: number }) {
  return (
    <svg width="34" height="38" viewBox="0 0 34 38" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M17 2 L31.5 10.25 V26.75 L17 35 L2.5 26.75 V10.25 Z"
        stroke="#0d1b34"
        strokeWidth="1.5"
        fill="white"
      />
      <path d="M17 2 L17 35" stroke="#0d1b34" strokeWidth="0.5" opacity="0.25" />
      <path d="M2.5 10.25 L31.5 26.75" stroke="#0d1b34" strokeWidth="0.5" opacity="0.2" />
      <path d="M31.5 10.25 L2.5 26.75" stroke="#0d1b34" strokeWidth="0.5" opacity="0.2" />
      <text
        x="17"
        y="22"
        textAnchor="middle"
        fill="#0d1b34"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {step}
      </text>
    </svg>
  );
}

function CardHeader({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        <FacetedHexagon step={step} />
        <h2 className="text-base font-bold text-[#0d1b34] tracking-tight">{title}</h2>
      </div>
      <span className="text-xs text-[#2f4d7a]/70 shrink-0">{hint}</span>
    </div>
  );
}

export default function UploadForm({ onConvert, isLoading }: UploadFormProps) {
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [payloadError, setPayloadError] = useState<string | null>(null);

  // Hover/Drag states for styles
  const [isDragDraft, setIsDragDraft] = useState(false);
  const [isDragLogo, setIsDragLogo] = useState(false);
  const [isDragWatermark, setIsDragWatermark] = useState(false);

  // Hidden file input refs
  const draftInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDraftFile(file);
      setTextDraft(''); // Clear manual text when a file is uploaded
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayloadError(null);

    if (!draftFile && !textDraft.trim()) {
      alert(
        language === 'en'
          ? 'Please upload a draft file or enter draft text.'
          : 'Por favor, suba un archivo de borrador o ingrese texto del borrador.'
      );
      return;
    }

    try {
      const processedDraft = draftFile
        ? isImageFile(draftFile)
          ? await compressImageFile(draftFile)
          : draftFile
        : null;
      const processedLogo = logoFile ? await compressImageFile(logoFile) : null;
      const processedWatermark = watermarkFile
        ? await compressImageFile(watermarkFile, WATERMARK_PROFILE)
        : null;

      const files = [processedDraft, processedLogo, processedWatermark].filter(Boolean) as File[];
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

      if (totalBytes > MAX_PAYLOAD_BYTES) {
        const sizeMb = (totalBytes / (1024 * 1024)).toFixed(2);
        setPayloadError(
          `Files are too large to process (${sizeMb} MB). Please use a smaller logo/watermark or a lighter draft file.`
        );
        return;
      }

      const formData = new FormData();

      if (processedDraft) {
        formData.append('draft', processedDraft);
      } else if (textDraft.trim()) {
        formData.append('textDraft', textDraft);
      }

      if (processedLogo) {
        formData.append('logo', processedLogo);
      }
      if (processedWatermark) {
        formData.append('watermark', processedWatermark);
      }

      formData.append('customPrompt', customPrompt);
      formData.append('language', language);

      onConvert(formData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'File preparation failed';
      alert(
        language === 'en'
          ? `Upload failed: ${message}`
          : `Error al preparar archivos: ${message}`
      );
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
    <div className="min-h-screen bg-[#f7f8fb]" id="upload-form-container">
      {/* Navy header band */}
      <header className="relative w-full bg-[#0d1b34] py-4 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(-52deg, transparent, transparent 14px, rgba(255,255,255,0.04) 14px, rgba(255,255,255,0.04) 15px)',
              'repeating-linear-gradient(38deg, transparent, transparent 22px, rgba(255,255,255,0.025) 22px, rgba(255,255,255,0.025) 23px)',
            ].join(', '),
          }}
        />
        <div className="relative flex justify-center">
          <img
            src="/logo.png"
            alt="DiALOGA"
            className="h-[38px] w-auto brightness-0 invert"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3d7dca] mb-3">
            {language === 'en' ? 'Intelligent form conversion' : 'Conversión inteligente de formularios'}
          </p>
          <h1 className="text-4xl font-bold text-[#0d1b34] tracking-tight sm:text-5xl leading-tight">
            DiALOGA Forms AI
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#132542]/80 max-w-2xl mx-auto leading-relaxed">
            {language === 'en'
              ? 'Convert unstructured Word, Excel, or text drafts into elegant, bilingual, print-optimized digital forms with automatic brand design adaptation.'
              : 'Convierta borradores desestructurados de Word, Excel o texto en elegantes formularios digitales optimizados para impresión con adaptación automática de diseño de marca.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Language Selection — English toggle hidden — Spanish-only mode. Un-comment to re-enable bilingual UI. */}
          {/* <div className="flex items-center justify-between border-b border-[#dde2ea] pb-5">
            <div className="flex items-center space-x-2">
              <Languages className="w-5 h-5 text-[#2f4d7a]/50" />
              <span className="font-semibold text-[#132542]">
                {language === 'en' ? 'Application Language:' : 'Idioma de la aplicación:'}
              </span>
            </div>
            <div className="flex bg-[#f7f8fb] p-1 rounded-lg border border-[#dde2ea]">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  language === 'en' ? 'bg-white text-[#3d7dca] shadow-sm' : 'text-[#2f4d7a] hover:text-[#0d1b34]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  language === 'es' ? 'bg-white text-[#3d7dca] shadow-sm' : 'text-[#2f4d7a] hover:text-[#0d1b34]'
                }`}
              >
                Español
              </button>
            </div>
          </div> */}

          {/* 1. Draft source card */}
          <section className="bg-white border border-[#dde2ea] rounded-[14px] p-6">
            <CardHeader
              step={1}
              title={language === 'en' ? 'Form Draft Source' : 'Origen del Borrador del Formulario'}
              hint={language === 'en' ? 'Word, Excel, PDF, CSV, TXT' : 'Word, Excel, PDF, CSV, TXT'}
            />

            <div
              onDragOver={(e) => onDragOver(e, setIsDragDraft)}
              onDragLeave={() => onDragLeave(setIsDragDraft)}
              onDrop={(e) => onDrop(e, setIsDragDraft, (f) => setDraftFile(f), true)}
              onClick={() => draftInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[14px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                isDragDraft
                  ? 'border-[#3d7dca] bg-[#e8f0fa]'
                  : draftFile
                  ? 'border-[#3d7dca] bg-[#e8f0fa]/60'
                  : 'border-[#dde2ea] hover:border-[#3d7dca] hover:bg-[#e8f0fa]/50'
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
                  <div className="bg-[#e8f0fa] p-3 rounded-full text-[#3d7dca] mb-2">
                    <FileCode className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-[#0d1b34] max-w-full truncate px-4">{draftFile.name}</p>
                  <p className="text-xs text-[#2f4d7a]/70 mt-1">
                    {(draftFile.size / 1024).toFixed(1)} KB • {language === 'en' ? 'Click to change' : 'Clic para cambiar'}
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-[#f7f8fb] p-3 rounded-full text-[#2f4d7a] mb-2">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-[#0d1b34]">
                    {language === 'en' ? 'Drag & drop form draft' : 'Arrastre y suelte el borrador'}
                  </p>
                  <p className="text-xs text-[#2f4d7a]/60 mt-1">
                    {language === 'en' ? 'or click to browse from device' : 'o haga clic para buscar en su dispositivo'}
                  </p>
                </>
              )}
            </div>

            {/* Text draft UI removed — upload-only. State/handler preserved for revival.
            <div className="space-y-1 mt-4">
              <span className="text-xs font-medium text-[#2f4d7a]/70 block">
                {language === 'en' ? 'Draft Text Preview & Edit Area:' : 'Área de vista previa y edición de texto del borrador:'}
              </span>
              <textarea
                value={textDraft}
                onChange={(e) => {
                  setTextDraft(e.target.value);
                  setDraftFile(null);
                }}
                rows={6}
                placeholder={
                  language === 'en'
                    ? "Enter questions, field names, sections, options, or paste Excel columns/Word content here..."
                    : "Ingrese preguntas, nombres de campos, secciones, opciones o pegue columnas de Excel/contenido de Word aquí..."
                }
                className="w-full text-sm p-3 border border-[#dde2ea] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#3d7dca]/30 bg-[#f7f8fb] focus:bg-white transition-all resize-y"
              />
            </div>
            */}
          </section>

          {/* 2. Brand assets card */}
          <section className="bg-white border border-[#dde2ea] rounded-[14px] p-6">
            <CardHeader
              step={2}
              title={language === 'en' ? 'Brand Visual Assets' : 'Activos Visuales de Marca'}
              hint={language === 'en' ? 'Optional' : 'Opcional'}
            />
            <p className="text-xs text-[#2f4d7a]/70 mb-5 -mt-2">
              {language === 'en'
                ? 'Our AI will scan your logo to extract its color palette and apply it cleanly to the form layout.'
                : 'Nuestra IA escaneará su logotipo para extraer su paleta de colores y aplicarla limpiamente al diseño del formulario.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#132542] block">
                  {language === 'en' ? 'Company Brand Logo' : 'Logotipo de Marca'}
                </span>
                <div
                  onDragOver={(e) => onDragOver(e, setIsDragLogo)}
                  onDragLeave={() => onDragLeave(setIsDragLogo)}
                  onDrop={(e) => onDrop(e, setIsDragLogo, setLogoFile)}
                  onClick={() => logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[14px] p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                    isDragLogo
                      ? 'border-[#3d7dca] bg-[#e8f0fa]'
                      : logoFile
                      ? 'border-[#3d7dca] bg-[#e8f0fa]/60'
                      : 'border-[#dde2ea] hover:border-[#3d7dca] hover:bg-[#e8f0fa]/50'
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
                      <ImageIcon className="w-6 h-6 text-[#3d7dca] mb-1" />
                      <span className="text-xs font-semibold text-[#0d1b34] truncate max-w-[200px]">{logoFile.name}</span>
                      <span className="text-[10px] text-[#2f4d7a]/60 mt-0.5">
                        {language === 'en' ? 'Click to change' : 'Clic para cambiar'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-[#2f4d7a]/50 mb-1" />
                      <span className="text-xs font-medium text-[#0d1b34]">
                        {language === 'en' ? 'Upload Logo' : 'Subir Logotipo'}
                      </span>
                      <span className="text-[10px] text-[#2f4d7a]/60 mt-0.5">PNG, JPG, SVG</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#132542] block flex items-center flex-wrap gap-1.5">
                  {language === 'en' ? 'Custom Watermark' : 'Marca de Agua Personalizada'}
                  <span className="text-[10px] font-medium text-[#3d7dca] bg-[#e8f0fa] px-1.5 py-0.5 rounded">
                    {language === 'en' ? 'Fallback: Logo used' : 'Fallo: Se usa el Logo'}
                  </span>
                </span>
                <div
                  onDragOver={(e) => onDragOver(e, setIsDragWatermark)}
                  onDragLeave={() => onDragLeave(setIsDragWatermark)}
                  onDrop={(e) => onDrop(e, setIsDragWatermark, setWatermarkFile)}
                  onClick={() => watermarkInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[14px] p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                    isDragWatermark
                      ? 'border-[#3d7dca] bg-[#e8f0fa]'
                      : watermarkFile
                      ? 'border-[#3d7dca] bg-[#e8f0fa]/60'
                      : 'border-[#dde2ea] hover:border-[#3d7dca] hover:bg-[#e8f0fa]/50'
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
                      <ImageIcon className="w-6 h-6 text-[#3d7dca] mb-1" />
                      <span className="text-xs font-semibold text-[#0d1b34] truncate max-w-[200px]">{watermarkFile.name}</span>
                      <span className="text-[10px] text-[#2f4d7a]/60 mt-0.5">
                        {language === 'en' ? 'Click to change' : 'Clic para cambiar'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-[#2f4d7a]/50 mb-1" />
                      <span className="text-xs font-medium text-[#0d1b34]">
                        {language === 'en' ? 'Upload Watermark' : 'Subir Marca de Agua'}
                      </span>
                      <span className="text-[10px] text-[#2f4d7a]/60 mt-0.5">PNG, JPG, SVG</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 3. Directives card */}
          <section className="bg-white border border-[#dde2ea] rounded-[14px] p-6">
            <CardHeader
              step={3}
              title={language === 'en' ? 'Custom Conversion Directives' : 'Directivas de Conversión Personalizadas'}
              hint={language === 'en' ? 'Optional' : 'Opcional'}
            />
            <p className="text-xs text-[#2f4d7a]/70 mb-4 -mt-2">
              {language === 'en'
                ? 'Tell the AI any specific styling rules, additional fields to inject, or formatting preferences.'
                : 'Indique a la IA cualquier regla de estilo específica, campos adicionales a inyectar o preferencias de formato.'}
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              placeholder={
                language === 'en'
                  ? "e.g., 'Make primary color emerald green', 'Add a multi-line terms and conditions section at the end', 'Keep it to exactly 1 page'"
                  : "ej., 'Haga que el color primario sea verde esmeralda', 'Agregue una sección de términos y condiciones al final', 'Manténgalo en exactamente 1 página'"
              }
              className="w-full text-sm p-3 border border-[#dde2ea] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#3d7dca]/30 focus:border-[#3d7dca] bg-[#f7f8fb] focus:bg-white transition-all resize-y text-[#0d1b34] placeholder:text-[#2f4d7a]/40"
            />
          </section>

          {payloadError && (
            <div className="rounded-[14px] border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <p>{payloadError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!draftFile && !textDraft.trim())}
            className="w-full bg-[#0d1b34] hover:bg-[#1c3358] text-white font-bold px-8 py-3.5 rounded-[14px] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors duration-150 cursor-pointer text-base"
            id="convert-button"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{language === 'en' ? 'Processing your form...' : 'Procesando su formulario...'}</span>
              </>
            ) : (
              <span>{language === 'en' ? 'Generate Bilingual Webform' : 'Generar Formulario'}</span>
            )}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0d1b34]/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[14px] max-w-md w-full shadow-2xl border border-[#dde2ea] text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-full bg-[#e8f0fa] flex items-center justify-center border-4 border-[#dde2ea] mx-auto animate-pulse">
                  <img
                    src="/favicon.png"
                    alt="DiALOGA"
                    className="w-[72px] h-[72px] object-contain animate-spin"
                    style={{ animationDuration: '5s' }}
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#0d1b34] mb-2">
                {language === 'en' ? 'Conversion In Progress' : 'Conversión en Progreso'}
              </h3>
              <p className="text-sm text-[#2f4d7a]/80">
                {language === 'en'
                  ? 'Reading your draft, extracting sections, optimizing layout, matching your logo colors, and building a fully translated bilingual form.'
                  : 'Leyendo su borrador, extrayendo secciones, optimizando el diseño, haciendo coincidir los colores de su logotipo y creando su formulario.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
