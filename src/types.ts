/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BilingualText {
  en: string;
  es: string;
}

export interface FormOption {
  value: string;
  label: BilingualText;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'signature'
  | 'grid'; // grid representation

export interface FormField {
  id: string;
  label: BilingualText;
  type: FieldType;
  placeholder?: BilingualText;
  required: boolean;
  options?: FormOption[];
  gridWidth: number; // 1 to 12 columns for Tailwind grid
  helpText?: BilingualText;
  defaultValue?: string;
}

export interface FormSection {
  id: string;
  sectionTitle: BilingualText;
  sectionDescription?: BilingualText;
  fields: FormField[];
}

export interface FormPage {
  pageNumber: number;
  sections: FormSection[];
}

export interface FormTheme {
  primaryColor: string; // hex
  secondaryColor: string; // hex
  accentColor: string; // hex
  backgroundColor: string; // hex
  textColor: string; // hex
  fontFamily: 'sans' | 'serif' | 'mono';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  logoPosition: 'left' | 'center' | 'right';
  watermarkOpacity: number; // 0 to 1
  logoScale?: number; // 30 to 300 percent
  watermarkStyle?: 'centered' | 'tiled';
}

export interface ConvertedForm {
  formTitle: BilingualText;
  formDescription?: BilingualText;
  formCode?: string;
  theme: FormTheme;
  pages: FormPage[];
}
