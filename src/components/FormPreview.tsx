/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConvertedForm, FormTheme, FormSection, FormField, FormPage, BilingualText, FieldType } from '../types';
import { 
  Printer, 
  Settings2, 
  Globe, 
  Trash2, 
  Plus, 
  Maximize, 
  Edit, 
  ArrowLeft, 
  CheckSquare, 
  PenTool, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
  Sliders,
  Type as FontIcon,
  Palette,
  Layout,
  HelpCircle
} from 'lucide-react';
import { DEFAULT_LOGO_SVG, DEFAULT_WATERMARK_SVG } from '../constants';

interface FormPreviewProps {
  initialForm: ConvertedForm;
  logoDataUrl: string;
  watermarkDataUrl: string;
  onBack: () => void;
}

export default function FormPreview({ initialForm, logoDataUrl, watermarkDataUrl, onBack }: FormPreviewProps) {
  // Application Language state (EN vs ES)
  const [appLang, setAppLang] = useState<'en' | 'es'>('es');
  // Form Language state (EN vs ES)
  const [formLang, setFormLang] = useState<'en' | 'es'>('es');

  // Form State - allows users to edit sections, fields, etc.
  const [form, setForm] = useState<ConvertedForm>(initialForm);
  // Theme State
  const [theme, setTheme] = useState<FormTheme>(initialForm.theme);
  // Logo & Watermark state
  const [logo, setLogo] = useState<string>(logoDataUrl || DEFAULT_LOGO_SVG);
  const [watermark, setWatermark] = useState<string>(watermarkDataUrl || DEFAULT_WATERMARK_SVG);

  // Form Submission answers (to display filled forms)
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Mode: Fill (for filling answers) vs Edit (for modifying structure)
  const [mode, setMode] = useState<'fill' | 'edit'>('fill');
  // Option: Print with answers vs Print empty
  const [printWithAnswers, setPrintWithAnswers] = useState(true);
  // Option: Continuous flow (removes gaps/splits sections naturally) vs Strict Page-by-page
  const [continuousFlow, setContinuousFlow] = useState(true);

  // Active edit section / field pointers
  const [activeTab, setActiveTab] = useState<'theme' | 'sections' | 'answers'>('theme');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  // Auto-select first section to edit
  useEffect(() => {
    if (form.pages[0]?.sections[0]) {
      setSelectedSectionId(form.pages[0].sections[0].id);
      if (form.pages[0].sections[0].fields[0]) {
        setSelectedFieldId(form.pages[0].sections[0].fields[0].id);
      }
    }
  }, []);

  // Update form theme when local theme changes
  useEffect(() => {
    setForm(prev => ({ ...prev, theme }));
  }, [theme]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Helper to translate text dynamically
  const t = (bilingual: BilingualText | undefined, lang: 'en' | 'es') => {
    if (!bilingual) return '';
    return bilingual[lang] || bilingual['en'] || '';
  };

  // Border radius map
  const getRoundingClass = (radius: string) => {
    switch (radius) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case 'full': return 'rounded-full';
      default: return 'rounded-lg';
    }
  };

  // Font family map
  const getFontFamilyClass = (family: string) => {
    switch (family) {
      case 'sans': return 'form-font-sans';
      case 'serif': return 'form-font-serif';
      case 'mono': return 'form-font-mono';
      default: return 'form-font-sans';
    }
  };

  // Update theme colors
  const handleColorChange = (key: keyof FormTheme, value: string | number) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  // Handlers for Form Editing
  const updateFormTitle = (val: string, lang: 'en' | 'es') => {
    setForm(prev => ({
      ...prev,
      formTitle: { ...prev.formTitle, [lang]: val }
    }));
  };

  const updateFormDescription = (val: string, lang: 'en' | 'es') => {
    setForm(prev => ({
      ...prev,
      formDescription: prev.formDescription 
        ? { ...prev.formDescription, [lang]: val }
        : { en: lang === 'en' ? val : '', es: lang === 'es' ? val : '' }
    }));
  };

  const updateFormCode = (val: string) => {
    setForm(prev => ({
      ...prev,
      formCode: val
    }));
  };

  const updateSectionTitle = (sectionId: string, val: string, lang: 'en' | 'es') => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => {
          if (sec.id === sectionId) {
            return { ...sec, sectionTitle: { ...sec.sectionTitle, [lang]: val } };
          }
          return sec;
        })
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  const updateSectionDescription = (sectionId: string, val: string, lang: 'en' | 'es') => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => {
          if (sec.id === sectionId) {
            return {
              ...sec,
              sectionDescription: sec.sectionDescription
                ? { ...sec.sectionDescription, [lang]: val }
                : { en: lang === 'en' ? val : '', es: lang === 'es' ? val : '' }
            };
          }
          return sec;
        })
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  const updateFieldLabel = (fieldId: string, val: string, lang: 'en' | 'es') => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => ({
          ...sec,
          fields: sec.fields.map(field => {
            if (field.id === fieldId) {
              return { ...field, label: { ...field.label, [lang]: val } };
            }
            return field;
          })
        }))
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  const updateFieldPlaceholder = (fieldId: string, val: string, lang: 'en' | 'es') => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => ({
          ...sec,
          fields: sec.fields.map(field => {
            if (field.id === fieldId) {
              return {
                ...field,
                placeholder: field.placeholder
                  ? { ...field.placeholder, [lang]: val }
                  : { en: lang === 'en' ? val : '', es: lang === 'es' ? val : '' }
              };
            }
            return field;
          })
        }))
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  const updateFieldType = (fieldId: string, type: FieldType) => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => ({
          ...sec,
          fields: sec.fields.map(field => {
            if (field.id === fieldId) {
              // Add generic options if switching to multiple choice
              const options = (type === 'select' || type === 'radio') && !field.options
                ? [
                    { value: 'option1', label: { en: 'Option 1', es: 'Opción 1' } },
                    { value: 'option2', label: { en: 'Option 2', es: 'Opción 2' } }
                  ]
                : field.options;
              return { ...field, type, options };
            }
            return field;
          })
        }))
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  const updateFieldGridWidth = (fieldId: string, width: number) => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => ({
          ...sec,
          fields: sec.fields.map(field => {
            if (field.id === fieldId) {
              return { ...field, gridWidth: width };
            }
            return field;
          })
        }))
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  const updateFieldRequired = (fieldId: string, required: boolean) => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => ({
          ...sec,
          fields: sec.fields.map(field => {
            if (field.id === fieldId) {
              return { ...field, required };
            }
            return field;
          })
        }))
      }));
      return { ...prev, pages: updatedPages };
    });
  };

  // Add field to section
  const addFieldToSection = (sectionId: string) => {
    const newId = `field_${Date.now()}`;
    const newField: FormField = {
      id: newId,
      label: { en: 'New Question', es: 'Nueva Pregunta' },
      type: 'text',
      placeholder: { en: 'Enter answer...', es: 'Ingrese respuesta...' },
      required: false,
      gridWidth: 6
    };

    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => {
          if (sec.id === sectionId) {
            return { ...sec, fields: [...sec.fields, newField] };
          }
          return sec;
        })
      }));
      return { ...prev, pages: updatedPages };
    });
    setSelectedFieldId(newId);
  };

  // Remove field
  const removeField = (fieldId: string) => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.map(sec => ({
          ...sec,
          fields: sec.fields.filter(field => field.id !== fieldId)
        }))
      }));
      return { ...prev, pages: updatedPages };
    });
    setSelectedFieldId('');
  };

  // Add Section to Page
  const addSectionToPage = (pageIndex: number) => {
    const newSecId = `section_${Date.now()}`;
    const newSection: FormSection = {
      id: newSecId,
      sectionTitle: { en: 'New Section', es: 'Nueva Sección' },
      fields: []
    };

    setForm(prev => {
      const updatedPages = prev.pages.map((page, idx) => {
        if (idx === pageIndex) {
          return { ...page, sections: [...page.sections, newSection] };
        }
        return page;
      });
      return { ...prev, pages: updatedPages };
    });
    setSelectedSectionId(newSecId);
  };

  // Remove Section
  const removeSection = (sectionId: string) => {
    setForm(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        sections: page.sections.filter(sec => sec.id !== sectionId)
      }));
      return { ...prev, pages: updatedPages };
    });
    setSelectedSectionId('');
  };

  // Reorder section in flat reading order (may cross page boundaries)
  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setForm(prev => {
      const pageSizes = prev.pages.map(page => page.sections.length);
      const flatSections = prev.pages.flatMap(page => page.sections);

      const idx = flatSections.findIndex(sec => sec.id === sectionId);
      if (idx === -1) return prev;

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= flatSections.length) return prev;

      const reordered = [...flatSections];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

      const newPages: FormPage[] = [];
      let offset = 0;
      let pageNum = 1;

      for (const size of pageSizes) {
        if (size === 0) continue;
        const sections = reordered.slice(offset, offset + size);
        offset += size;
        if (sections.length > 0) {
          newPages.push({ pageNumber: pageNum++, sections });
        }
      }

      return { ...prev, pages: newPages };
    });
  };

  // Add Page
  const addPage = () => {
    const newPageNum = form.pages.length + 1;
    const newPage: FormPage = {
      pageNumber: newPageNum,
      sections: []
    };
    setForm(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
  };

  // Remove Page
  const removePage = (pageNum: number) => {
    if (form.pages.length <= 1) return;
    setForm(prev => ({
      ...prev,
      pages: prev.pages
        .filter(p => p.pageNumber !== pageNum)
        .map((p, idx) => ({ ...p, pageNumber: idx + 1 }))
    }));
  };

  // Handle individual answer changes (for mockup demonstration)
  const handleAnswerChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  // Find currently selected section
  const getSelectedSection = (): FormSection | undefined => {
    for (const page of form.pages) {
      const found = page.sections.find(sec => sec.id === selectedSectionId);
      if (found) return found;
    }
    return undefined;
  };

  // Find currently selected field
  const getSelectedField = (): FormField | undefined => {
    for (const page of form.pages) {
      for (const sec of page.sections) {
        const found = sec.fields.find(field => field.id === selectedFieldId);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeSection = getSelectedSection();
  const flatSectionIds = form.pages.flatMap(page => page.sections.map(sec => sec.id));
  const activeSectionFlatIndex = activeSection ? flatSectionIds.indexOf(activeSection.id) : -1;
  const isFirstSection = activeSectionFlatIndex === 0;
  const isLastSection = activeSectionFlatIndex === flatSectionIds.length - 1;
  const activeField = getSelectedField();

  const allSections = form.pages.flatMap(page => page.sections);
  const paperSheetClassName = `paper-sheet bg-white p-8 shadow-lg border border-slate-200 relative overflow-hidden flex flex-col justify-between ${getFontFamilyClass(theme.fontFamily)}`;
  const paperSheetScreenStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    minHeight: '1035px',
  };
  const paperSheetPrintStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
  };

  const renderScreenWatermark = () =>
    theme.watermarkStyle === 'tiled' ? (
      <div
        className="screen-watermark absolute inset-0 pointer-events-none z-0 select-none"
        style={{
          opacity: theme.watermarkOpacity,
          backgroundImage: `url(${watermark})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '160px 160px',
        }}
      />
    ) : (
      <div
        className="screen-watermark absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-100 select-none"
        style={{ opacity: theme.watermarkOpacity }}
      >
        <img
          src={watermark}
          alt="Watermark"
          referrerPolicy="no-referrer"
          className="w-4/5 h-4/5 object-contain"
        />
      </div>
    );

  const renderPrintWatermark = () => {
    const watermarkLayer = (
      <div
        aria-hidden="true"
        className={`print-watermark-layer hidden print:block ${
          theme.watermarkStyle === 'tiled'
            ? 'print-watermark-layer--tiled'
            : 'print-watermark-layer--centered'
        }`}
        style={
          {
            '--watermark-url': `url(${watermark})`,
            '--watermark-opacity': theme.watermarkOpacity,
          } as React.CSSProperties
        }
      />
    );

    if (typeof document !== 'undefined') {
      return createPortal(watermarkLayer, document.body);
    }
    return null;
  };

  const renderFormHeader = () => (
    <div
      className="flex flex-col md:flex-row items-center justify-between border-b pb-4 mb-4"
      style={{ borderColor: theme.primaryColor + '30' }}
    >
      {theme.logoPosition === 'left' && (
        <div className="mb-2 md:mb-0">
          <img
            src={logo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="object-contain"
            style={{
              height: `${40 * ((theme.logoScale || 100) / 100)}px`,
              maxWidth: `${120 * ((theme.logoScale || 100) / 100)}px`,
            }}
          />
        </div>
      )}

      <div
        className={`flex-1 text-center ${
          theme.logoPosition === 'left'
            ? 'md:text-left md:pl-4'
            : theme.logoPosition === 'right'
              ? 'md:text-right md:pr-4'
              : 'text-center'
        }`}
      >
        <h2 className="text-xl font-bold tracking-tight" style={{ color: theme.primaryColor }}>
          {t(form.formTitle, formLang)}
        </h2>
        {form.formDescription && (
          <p className="text-[10px] mt-0.5 text-slate-500 max-w-xl mx-auto md:mx-0 font-medium">
            {t(form.formDescription, formLang)}
          </p>
        )}
      </div>

      {theme.logoPosition === 'right' && (
        <div className="mt-2 md:mt-0">
          <img
            src={logo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="object-contain"
            style={{
              height: `${40 * ((theme.logoScale || 100) / 100)}px`,
              maxWidth: `${120 * ((theme.logoScale || 100) / 100)}px`,
            }}
          />
        </div>
      )}

      {theme.logoPosition === 'center' && (
        <div className="order-first w-full flex justify-center mb-2">
          <img
            src={logo}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="object-contain"
            style={{
              height: `${40 * ((theme.logoScale || 100) / 100)}px`,
              maxWidth: `${120 * ((theme.logoScale || 100) / 100)}px`,
            }}
          />
        </div>
      )}
    </div>
  );

  const renderField = (field: FormField) => {
    const ansVal = answers[field.id] || '';
    const showAnswers = printWithAnswers;

    return (
      <div
        key={field.id}
        className="flex flex-col field-container"
        style={{ gridColumn: `span ${field.gridWidth}` }}
      >
        <label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-0.5 flex items-center">
          <span>{t(field.label, formLang)}</span>
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            value={showAnswers ? ansVal : ''}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            placeholder={showAnswers ? t(field.placeholder, formLang) : ''}
            rows={1}
            className="w-full text-xs py-1 bg-transparent border-b outline-none transition-all resize-none"
            style={{
              borderColor: theme.primaryColor + '30',
            }}
          />
        ) : field.type === 'select' ? (
          <select
            value={showAnswers ? ansVal : ''}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className="w-full text-xs py-1 bg-transparent border-b outline-none transition-all cursor-pointer"
            style={{
              borderColor: theme.primaryColor + '30',
            }}
          >
            <option value="">--</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label, formLang)}
              </option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <div className="flex items-center space-x-1.5 py-1">
            <input
              type="checkbox"
              checked={showAnswers ? !!ansVal : false}
              onChange={(e) => handleAnswerChange(field.id, e.target.checked)}
              className="w-3 h-3 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              style={{ accentColor: theme.primaryColor }}
            />
            <span className="text-[11px] text-slate-700 font-medium">
              {t(field.placeholder, formLang) ||
                (formLang === 'en' ? 'Select if applicable' : 'Seleccionar si aplica')}
            </span>
          </div>
        ) : field.type === 'radio' ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 py-1">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center space-x-1 text-[11px] text-slate-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={showAnswers ? ansVal === opt.value : false}
                  onChange={() => handleAnswerChange(field.id, opt.value)}
                  className="w-3 h-3 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  style={{ accentColor: theme.primaryColor }}
                />
                <span>{t(opt.label, formLang)}</span>
              </label>
            ))}
          </div>
        ) : field.type === 'signature' ? (
          <div className="flex flex-col gap-1 mt-1 signature-container">
            <div
              className="h-8 border-b flex items-end text-xs italic font-serif relative"
              style={{ borderColor: theme.primaryColor + '40' }}
            >
              {showAnswers && ansVal ? (
                <span className="text-indigo-950 font-serif italic text-sm absolute bottom-0.5 left-1 transform rotate-[-1deg] select-none tracking-wider">
                  {ansVal}
                </span>
              ) : (
                <input
                  type="text"
                  placeholder={
                    showAnswers
                      ? formLang === 'en'
                        ? 'Type name to sign...'
                        : 'Escriba nombre para firmar...'
                      : ''
                  }
                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                  className="w-full text-left text-[11px] text-slate-400 font-mono border-none bg-transparent outline-none pb-0.5"
                />
              )}
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
              {formLang === 'en' ? 'Authorized Signature / Date' : 'Firma Autorizada / Fecha'}
            </div>
          </div>
        ) : (
          <input
            type={field.type}
            value={showAnswers ? ansVal : ''}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            placeholder={showAnswers ? t(field.placeholder, formLang) : ''}
            className="w-full text-xs py-1 bg-transparent border-b outline-none transition-all"
            style={{
              borderColor: theme.primaryColor + '30',
            }}
          />
        )}
      </div>
    );
  };

  const renderSection = (section: FormSection) => (
    <div key={section.id} className="space-y-2 section-container">
      <div
        className="border-b pb-0.5 flex items-center justify-between"
        style={{ borderColor: theme.primaryColor + '50' }}
      >
        <h3
          className="text-[10px] font-bold uppercase tracking-widest flex items-center"
          style={{ color: theme.primaryColor }}
        >
          {t(section.sectionTitle, formLang)}
        </h3>
        {section.sectionDescription && (
          <span className="text-[9px] italic text-slate-400">
            {t(section.sectionDescription, formLang)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-x-4 gap-y-2.5">
        {section.fields.map((field) => renderField(field))}
      </div>
    </div>
  );

  const renderSections = (sections: FormSection[], spacingClass = 'space-y-6') => (
    <div className={spacingClass}>{sections.map((section) => renderSection(section))}</div>
  );

  const renderDocumentFooter = () => (
    <footer className="relative z-10 mt-auto pt-4 border-t border-slate-150 flex justify-start items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
      {form.formCode ? <span>{form.formCode}</span> : <span />}
    </footer>
  );

  const renderScreenPaperSheet = (
    sections: FormSection[],
    pageNum: number,
    totalPages: number,
    options?: { key?: number; sectionSpacing?: 'space-y-4' | 'space-y-6' }
  ) => (
    <div
      key={options?.key ?? 'screen-sheet'}
      className={paperSheetClassName}
      style={paperSheetScreenStyle}
    >
      {renderScreenWatermark()}
      <div className="relative z-10 space-y-4 flex-grow flex flex-col justify-start">
        {renderFormHeader()}
        {renderSections(sections, options?.sectionSpacing ?? 'space-y-6')}
      </div>
      {renderDocumentFooter()}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 overflow-x-hidden" id="form-preview-root">
      {renderPrintWatermark()}

      {/* 1. Dynamic head styles injected for variables */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --form-primary: ${theme.primaryColor};
          --form-secondary: ${theme.secondaryColor};
          --form-accent: ${theme.accentColor};
          --form-bg: ${theme.backgroundColor};
          --form-text: ${theme.textColor};
          --watermark-url: url(${watermark});
          --watermark-opacity: ${theme.watermarkOpacity};
        }
        .form-font-sans { font-family: "Inter", system-ui, -apple-system, sans-serif; }
        .form-font-serif { font-family: "Playfair Display", Georgia, Cambria, serif; }
        .form-font-mono { font-family: "JetBrains Mono", "Fira Code", monospace; }

        @media print {
          @page {
            margin: 0.75in;
            size: letter;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          #print-sidebar, #control-navbar {
            display: none !important;
          }
          #print-paper-container {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
          }
          .paper-sheet {
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: auto !important;
            break-after: auto !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            position: relative !important;
          }
          .screen-watermark {
            display: none !important;
          }
          .print-watermark-layer {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: var(--watermark-opacity);
          }
          .print-watermark-layer--centered {
            background-image: var(--watermark-url);
            background-repeat: no-repeat;
            background-position: center center;
            background-size: 80% auto;
          }
          .print-watermark-layer--tiled {
            background-image: var(--watermark-url);
            background-repeat: repeat;
            background-size: 160px 160px;
          }
          .print-content-layer {
            position: relative;
            z-index: 1;
          }
          .field-container {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .signature-container {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Ensure backgrounds print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* Control Navbar (Top navigation) - Screen only */}
      <div id="control-navbar" className="w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-40 print:hidden shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 font-semibold text-xs transition-all hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{appLang === 'en' ? 'Back' : 'Volver'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">F</div>
            <div>
              <h1 className="text-sm font-bold leading-none text-slate-900">DiALOGA Forms</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Bilingual Form Engine</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* App Translation Swapper */}
          <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setAppLang('en')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                appLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setAppLang('es')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                appLang === 'es' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              ES
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{appLang === 'en' ? 'Print / Printar' : 'Imprimir / Imprimir'}</span>
            </button>
            <button
              onClick={handlePrint}
              title={appLang === 'en' ? 'Save as PDF via print dialog' : 'Guardar como PDF mediante el diálogo de impresión'}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-indigo-100"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>{appLang === 'en' ? 'Export PDF' : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area - Sidebar + Document */}
      <div className="w-full flex flex-col lg:flex-row pt-16 min-h-screen">
        
        {/* SIDEBAR: Configuration & Editor (Screen only) */}
        <div id="print-sidebar" className="w-full lg:w-[420px] bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] fixed lg:sticky top-16 left-0 z-30 print:hidden overflow-y-auto">
          
          {/* Sidebar tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'theme' 
                  ? 'border-indigo-600 text-indigo-600 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>{appLang === 'en' ? 'Design Style' : 'Estilo de Marca'}</span>
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'sections' 
                  ? 'border-indigo-600 text-indigo-600 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>{appLang === 'en' ? 'Fields Editor' : 'Editor de Campos'}</span>
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                activeTab === 'answers' 
                  ? 'border-indigo-600 text-indigo-600 bg-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{appLang === 'en' ? 'Form Controls' : 'Controles'}</span>
            </button>
          </div>

          <div className="p-6 space-y-6 flex-grow">
            
            {/* TAB 1: Theme Style customization */}
            {activeTab === 'theme' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Active Assets block matching the High Density design template */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Draft Assets / Activos</label>
                  <div className="space-y-3">
                    <div className="p-3 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A1 1 0 0112 2.586L15.414 6A1 1 0 0116 6.586V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"></path></svg>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold truncate text-slate-700">form_draft.docx</p>
                        <p className="text-[10px] text-slate-400 font-medium">{appLang === 'en' ? 'Imported • Ready' : 'Importado • Listo'}</p>
                      </div>
                    </div>
                    <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50 flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-indigo-500 text-white rounded flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold truncate text-indigo-900">{logoDataUrl ? 'brand_logo_active.png' : 'clinic_logo_default.png'}</p>
                        <p className="text-[10px] text-indigo-500 font-bold">{appLang === 'en' ? 'Active Brand • Matches Theme' : 'Marca Activa • Combina Estilo'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Form Styling / Estilo</label>
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
                    <Palette className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    {appLang === 'en' ? 'Color Scheme' : 'Esquema de Colores'}
                  </h3>
                  <div className="space-y-4">
                    {/* Primary Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{appLang === 'en' ? 'Primary (Buttons/Header)' : 'Primario (Botones/Cabecera)'}</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          value={theme.primaryColor}
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          className="w-8 h-8 rounded-full border border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-500">{theme.primaryColor}</span>
                      </div>
                    </div>
                    {/* Secondary Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{appLang === 'en' ? 'Secondary Accent' : 'Secundario'}</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          value={theme.secondaryColor}
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          className="w-8 h-8 rounded-full border border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-500">{theme.secondaryColor}</span>
                      </div>
                    </div>
                    {/* Background Color */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{appLang === 'en' ? 'Page Paper Tint' : 'Tinta de Papel'}</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          value={theme.backgroundColor}
                          onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                          className="w-8 h-8 rounded-full border border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-500">{theme.backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Settings */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
                    <FontIcon className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    {appLang === 'en' ? 'Typography & Border' : 'Tipografía y Bordes'}
                  </h3>
                  <div className="space-y-4">
                    {/* Font Family selection */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-600 block">{appLang === 'en' ? 'Font Family:' : 'Familia Tipográfica:'}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['sans', 'serif', 'mono'] as const).map(font => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => handleColorChange('fontFamily', font)}
                            className={`py-1.5 px-3 rounded text-xs font-bold border capitalize transition-all cursor-pointer ${
                              theme.fontFamily === font 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border radius selector */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-600 block">{appLang === 'en' ? 'Input Corners Rounding:' : 'Esquinas de Entradas:'}</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['none', 'sm', 'md', 'lg'] as const).map(radius => (
                          <button
                            key={radius}
                            type="button"
                            onClick={() => handleColorChange('borderRadius', radius)}
                            className={`py-1.5 rounded text-xs font-bold border capitalize transition-all cursor-pointer ${
                              theme.borderRadius === radius 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {radius}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo & Watermark parameters */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center">
                    <Maximize className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    {appLang === 'en' ? 'Watermark & Logo' : 'Marca de Agua y Logo'}
                  </h3>
                  <div className="space-y-4">
                    {/* Watermark opacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-slate-600">{appLang === 'en' ? 'Watermark Opacity:' : 'Opacidad de Marca de Agua:'}</span>
                        <span className="text-xs font-mono text-slate-500">{(theme.watermarkOpacity * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="0.25" 
                        step="0.01"
                        value={theme.watermarkOpacity}
                        onChange={(e) => handleColorChange('watermarkOpacity', parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    {/* Watermark style */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-600 block">
                        {appLang === 'en' ? 'Watermark Layout Style:' : 'Estilo de Marca de Agua:'}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleColorChange('watermarkStyle', 'centered')}
                          className={`py-1 px-2 text-xs font-bold border transition-all cursor-pointer rounded ${
                            (theme.watermarkStyle || 'centered') === 'centered'
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {appLang === 'en' ? 'Centered' : 'Centrado'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleColorChange('watermarkStyle', 'tiled')}
                          className={`py-1 px-2 text-xs font-bold border transition-all cursor-pointer rounded ${
                            theme.watermarkStyle === 'tiled'
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {appLang === 'en' ? 'Tiled (Mosaic)' : 'Mosaico / Repetido'}
                        </button>
                      </div>
                    </div>

                    {/* Logo alignment */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-600 block">{appLang === 'en' ? 'Logo Header Position:' : 'Posición del Logotipo:'}</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['left', 'center', 'right'] as const).map(pos => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => handleColorChange('logoPosition', pos)}
                            className={`py-1 px-2.5 rounded text-xs font-bold border capitalize transition-all cursor-pointer ${
                              theme.logoPosition === pos 
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-700' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Scale slider */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-slate-600">{appLang === 'en' ? 'Logo Scale:' : 'Escala del Logotipo:'}</span>
                        <span className="text-xs font-mono text-slate-500">{theme.logoScale || 100}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="300" 
                        step="5"
                        value={theme.logoScale || 100}
                        onChange={(e) => handleColorChange('logoScale', parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Section & Fields Editor */}
            {activeTab === 'sections' && (
              <div className="space-y-6 animate-fade-in">
                {/* Form metadata title/desc editor */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {appLang === 'en' ? 'Global Title Settings' : 'Configuración de Título Global'}
                  </span>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">TITLE (EN)</span>
                      <input 
                        type="text" 
                        value={form.formTitle.en}
                        onChange={(e) => updateFormTitle(e.target.value, 'en')}
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">TÍTULO (ES)</span>
                      <input 
                        type="text" 
                        value={form.formTitle.es}
                        onChange={(e) => updateFormTitle(e.target.value, 'es')}
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        {appLang === 'en' ? 'Form Code' : 'Código de Formulario'}
                      </span>
                      <input
                        type="text"
                        value={form.formCode ?? ''}
                        onChange={(e) => updateFormCode(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Section selection drop-down */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">{appLang === 'en' ? 'Select Section to Edit:' : 'Seleccione Sección a Editar:'}</span>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => {
                      setSelectedSectionId(e.target.value);
                      // Auto-select first field of selected section
                      const sec = form.pages.flatMap(p => p.sections).find(s => s.id === e.target.value);
                      if (sec?.fields[0]) {
                        setSelectedFieldId(sec.fields[0].id);
                      } else {
                        setSelectedFieldId('');
                      }
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    {form.pages.map(page => (
                      <optgroup key={page.pageNumber} label={`${appLang === 'en' ? 'Page' : 'Página'} ${page.pageNumber}`}>
                        {page.sections.map(sec => (
                          <option key={sec.id} value={sec.id}>
                            {t(sec.sectionTitle, appLang) || `[${appLang === 'en' ? 'Untitled Section' : 'Sección sin título'}]`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Section titles edit */}
                {activeSection && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {appLang === 'en' ? 'Section Header Settings' : 'Ajustes del Encabezado de Sección'}
                      </span>
                      <div className="flex items-center space-x-0.5">
                        <button
                          type="button"
                          onClick={() => moveSection(activeSection.id, 'up')}
                          disabled={isFirstSection}
                          className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                          title={appLang === 'en' ? 'Move Section Up' : 'Mover Sección Arriba'}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(activeSection.id, 'down')}
                          disabled={isLastSection}
                          className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                          title={appLang === 'en' ? 'Move Section Down' : 'Mover Sección Abajo'}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(activeSection.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title={appLang === 'en' ? 'Delete Section' : 'Eliminar Sección'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">TITLE (EN)</span>
                        <input 
                          type="text" 
                          value={activeSection.sectionTitle.en}
                          onChange={(e) => updateSectionTitle(activeSection.id, e.target.value, 'en')}
                          className="w-full text-xs p-2 border border-slate-200 rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">TÍTULO (ES)</span>
                        <input 
                          type="text" 
                          value={activeSection.sectionTitle.es}
                          onChange={(e) => updateSectionTitle(activeSection.id, e.target.value, 'es')}
                          className="w-full text-xs p-2 border border-slate-200 rounded"
                        />
                      </div>
                    </div>

                    {/* Select field from current section to edit */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 block">
                          {appLang === 'en' ? 'Section Fields/Questions:' : 'Campos/Preguntas de Sección:'}
                        </span>
                        <button
                          type="button"
                          onClick={() => addFieldToSection(activeSection.id)}
                          className="bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 font-bold px-2 py-1 rounded text-[10px] flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{appLang === 'en' ? 'Add Field' : 'Añadir Campo'}</span>
                        </button>
                      </div>

                      {activeSection.fields.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">{appLang === 'en' ? 'No fields in this section yet.' : 'Aún no hay campos en esta sección.'}</p>
                      ) : (
                        <select
                          value={selectedFieldId}
                          onChange={(e) => setSelectedFieldId(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500"
                        >
                          {activeSection.fields.map(field => (
                            <option key={field.id} value={field.id}>
                              {t(field.label, appLang) || `[${appLang === 'en' ? 'Untitled Field' : 'Campo sin título'}]`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Field settings */}
                {activeField && (
                  <div className="space-y-4 border-t border-slate-150 pt-5 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        {appLang === 'en' ? 'Active Question Settings' : 'Ajustes de Pregunta Activa'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeField(activeField.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title={appLang === 'en' ? 'Delete Question' : 'Eliminar Pregunta'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Field Labels (Bilingual) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">QUESTION LABEL (EN)</span>
                        <input 
                          type="text" 
                          value={activeField.label.en}
                          onChange={(e) => updateFieldLabel(activeField.id, e.target.value, 'en')}
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">ETIQUETA (ES)</span>
                        <input 
                          type="text" 
                          value={activeField.label.es}
                          onChange={(e) => updateFieldLabel(activeField.id, e.target.value, 'es')}
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                        />
                      </div>
                    </div>

                    {/* Field Placeholders (Bilingual) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">PLACEHOLDER (EN)</span>
                        <input 
                          type="text" 
                          value={activeField.placeholder?.en || ''}
                          onChange={(e) => updateFieldPlaceholder(activeField.id, e.target.value, 'en')}
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">RESERVA (ES)</span>
                        <input 
                          type="text" 
                          value={activeField.placeholder?.es || ''}
                          onChange={(e) => updateFieldPlaceholder(activeField.id, e.target.value, 'es')}
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                        />
                      </div>
                    </div>

                    {/* Field type & Grid Width (Compress layout!) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">{appLang === 'en' ? 'FIELD TYPE' : 'TIPO DE CAMPO'}</span>
                        <select
                          value={activeField.type}
                          onChange={(e) => updateFieldType(activeField.id, e.target.value as FieldType)}
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded"
                        >
                          <option value="text">Text / Línea</option>
                          <option value="number">Number / Número</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone / Teléfono</option>
                          <option value="date">Date / Fecha</option>
                          <option value="textarea">Textarea / Nota</option>
                          <option value="select">Dropdown / Lista</option>
                          <option value="checkbox">Checkbox / Casilla</option>
                          <option value="radio">Radio Options</option>
                          <option value="signature">Signature Pad</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block flex items-center">
                          {appLang === 'en' ? 'GRID WIDTH (1-12)' : 'ANCHO REJILLA'}
                        </span>
                        <select
                          value={activeField.gridWidth}
                          onChange={(e) => updateFieldGridWidth(activeField.id, parseInt(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-200 bg-white rounded font-semibold text-indigo-600"
                        >
                          <option value={12}>12 ({appLang === 'en' ? 'Full Width' : 'Ancho Total'})</option>
                          <option value={8}>8 (2/3 Width)</option>
                          <option value={6}>6 (1/2 {appLang === 'en' ? 'Side-by-side' : 'Mitad'})</option>
                          <option value={4}>4 (1/3 {appLang === 'en' ? '3-in-a-row' : 'Tercio'})</option>
                          <option value={3}>3 (1/4 {appLang === 'en' ? '4-in-a-row' : 'Cuarto'})</option>
                        </select>
                      </div>
                    </div>

                    {/* Required validator check */}
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="field-required-checkbox"
                        checked={activeField.required}
                        onChange={(e) => updateFieldRequired(activeField.id, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="field-required-checkbox" className="text-xs font-semibold text-slate-600 cursor-pointer">
                        {appLang === 'en' ? 'Required field (Mandatory)' : 'Campo requerido (Obligatorio)'}
                      </label>
                    </div>
                  </div>
                )}

                {/* Add Page structure helper */}
                <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {appLang === 'en' ? `Total Document Pages: ${form.pages.length}` : `Páginas del documento: ${form.pages.length}`}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => removePage(form.pages.length)}
                      disabled={form.pages.length <= 1}
                      className="px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded disabled:opacity-40 cursor-pointer"
                    >
                      - {appLang === 'en' ? 'Remove Page' : 'Eliminar'}
                    </button>
                    <button
                      type="button"
                      onClick={addPage}
                      className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold rounded flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{appLang === 'en' ? 'Add Page' : 'Añadir'}</span>
                    </button>
                  </div>
                </div>

                {/* Section insertion to any page */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    {appLang === 'en' ? 'New Section on Page:' : 'Nueva Sección en Página:'}
                  </span>
                  <div className="flex space-x-1">
                    {form.pages.map(p => (
                      <button
                        key={p.pageNumber}
                        type="button"
                        onClick={() => addSectionToPage(p.pageNumber - 1)}
                        className="bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-xs font-bold w-7 h-7 rounded flex items-center justify-center transition-all cursor-pointer"
                        title={`${appLang === 'en' ? 'Add Section to Page' : 'Añadir sección a la página'} ${p.pageNumber}`}
                      >
                        {p.pageNumber}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Answers & Output controls */}
            {activeTab === 'answers' && (
              <div className="space-y-6 animate-fade-in">
                {/* Print parameters */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <Printer className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    {appLang === 'en' ? 'Document Print Options' : 'Opciones de Impresión'}
                  </h3>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      {appLang === 'en' ? 'Output Mode' : 'Modo de Salida'}
                    </span>
                    
                    <div className="space-y-2">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="print-answers"
                          checked={printWithAnswers}
                          onChange={() => setPrintWithAnswers(true)}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">
                            {appLang === 'en' ? 'Print FILLED Form (With Answers)' : 'Imprimir Formulario LLENO (Con Respuestas)'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {appLang === 'en' ? 'Answers filled in preview are generated on the PDF' : 'Las respuestas dadas en la vista previa se guardan en el PDF'}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 cursor-pointer border-t border-slate-200 pt-2.5 mt-2.5">
                        <input
                          type="radio"
                          name="print-answers"
                          checked={!printWithAnswers}
                          onChange={() => setPrintWithAnswers(false)}
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">
                            {appLang === 'en' ? 'Print EMPTY Form (Blank Fields)' : 'Imprimir Formulario VACÍO (Campos Vacíos)'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {appLang === 'en' ? 'Produces standard blank physical/printable form sheets' : 'Produce hojas de formularios físicos en blanco estándares'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Page Layout Mode Toggle */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <Layout className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    {appLang === 'en' ? 'Page Layout Flow' : 'Flujo de Diseño de Páginas'}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {appLang === 'en'
                      ? 'Choose how sections split between pages. Continuous flow removes empty spaces by splitting sections naturally across pages.'
                      : 'Elija cómo se dividen las secciones. El flujo continuo elimina los espacios vacíos dividiendo secciones de forma natural.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setContinuousFlow(true)}
                      className={`py-2 px-2.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        continuousFlow ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {appLang === 'en' ? 'Continuous' : 'Continuo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContinuousFlow(false)}
                      className={`py-2 px-2.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        !continuousFlow ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {appLang === 'en' ? 'Strict Pages' : 'Páginas Estrictas'}
                    </button>
                  </div>
                </div>

                {/* Form Language Toggle */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                    <Globe className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                    {appLang === 'en' ? 'Form Sheet Language' : 'Idioma de Hoja de Formulario'}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {appLang === 'en'
                      ? 'Switch the rendered form language in real-time. This flips headers, text, labels, and placeholders on the paper sheet!'
                      : 'Cambie el idioma del formulario renderizado en tiempo real. ¡Esto invierte encabezados, textos, etiquetas y marcadores de posición!'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormLang('en')}
                      className={`py-2 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                        formLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      English (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormLang('es')}
                      className={`py-2 px-3 rounded text-xs font-bold transition-all cursor-pointer ${
                        formLang === 'es' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Español (SP)
                    </button>
                  </div>
                </div>

                {/* Clear answers button */}
                <div className="border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setAnswers({})}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center justify-center space-x-1 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <span>{appLang === 'en' ? 'Clear Preview Answers' : 'Limpiar Respuestas de Vista Previa'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Premium Bento Optimization Card (Dark and sleek!) */}
            <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] font-bold opacity-60 uppercase tracking-wider">{appLang === 'en' ? 'Layout Engine' : 'Motor de Diseño'}</p>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">{appLang === 'en' ? 'Optimized' : 'Optimizado'}</span>
                </div>
                <p className="text-xl font-light tracking-tight">{appLang === 'en' ? 'Compressed to' : 'Comprimido a'} <span className="font-extrabold text-indigo-400">{form.pages.length} {form.pages.length === 1 ? 'Page' : 'Pages'}</span></p>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{appLang === 'en' ? 'Applying high density grid layout variables automatically.' : 'Aplicando variables de cuadrícula de alta densidad automáticamente.'}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>{appLang === 'en' ? 'Density: High' : 'Densidad: Alta'}</span>
                <span>{96 - form.pages.length * 3}%</span>
              </div>
            </div>

          </div>

          {/* Footer of Sidebar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
            {appLang === 'en' ? 'Tip: Hit Ctrl+P (Cmd+P) to save directly as PDF.' : 'Sugerencia: Pulse Ctrl+P (Cmd+P) para guardar como PDF.'}
          </div>
        </div>

        {/* DOCUMENT: Interactive Form Sheets (Dual screen/print) */}
        <div className="flex-grow flex flex-col items-center p-4 lg:p-8 bg-slate-100 print:bg-white overflow-y-auto min-h-screen">
          
          <div className="w-full max-w-[800px] mb-4 print:hidden flex items-center justify-between text-xs text-slate-500 px-2">
            <span>
              {appLang === 'en' 
                ? `📄 Visualizing ${form.pages.length} Pages • Real-time Style Inherited` 
                : `📄 Visualizando ${form.pages.length} Páginas • Estilo Inherente de Marca`}
            </span>
            <span className="flex items-center text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-500 animate-pulse" />
              {formLang === 'en' ? 'Bilingual Form: English Rendering' : 'Formulario Bilingüe: Renderizado en Español'}
            </span>
          </div>

          {/* Page stack representation */}
          <div id="print-paper-container" className="space-y-8 w-full max-w-[800px] print:space-y-0 print:w-full">
            <div className="print:hidden">
              {continuousFlow
                ? renderScreenPaperSheet(allSections, 1, form.pages.length)
                : form.pages.map((page) =>
                    renderScreenPaperSheet(page.sections, page.pageNumber, form.pages.length, {
                      key: page.pageNumber,
                      sectionSpacing: 'space-y-4',
                    })
                  )}
            </div>

            <div className="hidden print:block">
              <div className={paperSheetClassName} style={paperSheetPrintStyle}>
                <div className="print-content-layer space-y-4 flex flex-col justify-start">
                  {renderFormHeader()}
                  {renderSections(allSections)}
                </div>
                {renderDocumentFooter()}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
