/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import FormPreview from './components/FormPreview';
import { ConvertedForm } from './types';
import { AlertCircle, X } from 'lucide-react';
import { authFetch, LoginScreen, useAuth } from './auth';

export default function App() {
  const { user, idToken, isLoading, signOut } = useAuth();
  const [convertedForm, setConvertedForm] = useState<ConvertedForm | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [watermarkDataUrl, setWatermarkDataUrl] = useState<string>('');
  const [isLoadingConvert, setIsLoadingConvert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1b34] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!user || !idToken) {
    return <LoginScreen />;
  }

  const handleConvert = async (formData: FormData) => {
    setIsLoadingConvert(true);
    setError(null);
    try {
      const response = await authFetch(idToken, '/api/convert', {
        method: 'POST',
        body: formData,
      });

      let data: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseErr) {
          console.error('Failed to parse response JSON:', parseErr);
        }
      }

      if (response.status === 401) {
        signOut();
        throw new Error('Su sesión ha expirado. Inicie sesión nuevamente.');
      }

      if (!response.ok) {
        const errMsg =
          data?.error ||
          `Server returned error (${response.status}): ${response.statusText || 'Unavailable'}`;
        throw new Error(errMsg);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Conversion failed with empty or invalid response');
      }
      setConvertedForm(data.form);
      setLogoDataUrl(data.logoDataUrl || '');
      setWatermarkDataUrl(data.watermarkDataUrl || '');
    } catch (err: any) {
      console.error('Error converting form:', err);
      setError(
        err.message ||
          'An unexpected error occurred during conversion. Please check your file and try again.'
      );
    } finally {
      setIsLoadingConvert(false);
    }
  };

  const handleBackToUpload = () => {
    setConvertedForm(null);
    setLogoDataUrl('');
    setWatermarkDataUrl('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" id="main-application-container">
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-6" id="error-banner">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-bold text-sm">Conversion Error</h4>
              <p className="text-xs mt-1 text-red-700 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-red-100 text-red-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {convertedForm ? (
        <FormPreview
          initialForm={convertedForm}
          logoDataUrl={logoDataUrl}
          watermarkDataUrl={watermarkDataUrl}
          onBack={handleBackToUpload}
          user={user}
          onLogout={signOut}
        />
      ) : (
        <UploadForm onConvert={handleConvert} isLoading={isLoadingConvert} user={user} onLogout={signOut} />
      )}
    </div>
  );
}
