/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import { ALLOWED_EMAIL_DOMAINS, formatAllowedDomainsLabel } from './constants';

export default function LoginScreen() {
  const { signInWithCredential, loginError, clearLoginError } = useAuth();
  const allowedDomainsLabel = formatAllowedDomainsLabel();
  const singleHostedDomain =
    ALLOWED_EMAIL_DOMAINS.length === 1 ? ALLOWED_EMAIL_DOMAINS[0] : undefined;

  const handleSuccess = (response: CredentialResponse) => {
    if (!response.credential) {
      return;
    }
    signInWithCredential(response.credential);
  };

  return (
    <div className="min-h-screen bg-[#0d1b34] flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(-52deg, transparent, transparent 14px, rgba(255,255,255,0.04) 14px, rgba(255,255,255,0.04) 15px)',
            'repeating-linear-gradient(38deg, transparent, transparent 22px, rgba(255,255,255,0.025) 22px, rgba(255,255,255,0.025) 23px)',
          ].join(', '),
        }}
      />

      <div className="relative w-full max-w-md bg-white border border-[#dde2ea] rounded-[20px] shadow-2xl px-8 py-10 text-center">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="DiALOGA" className="h-10 w-auto" />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3d7dca] mb-3">
          Acceso interno
        </p>
        <h1 className="text-2xl font-bold text-[#0d1b34] tracking-tight mb-2">DiALOGA Forms AI</h1>
        <p className="text-sm text-[#2f4d7a]/80 leading-relaxed mb-8">
          {ALLOWED_EMAIL_DOMAINS.length === 1 ? (
            <>
              Inicie sesión con su cuenta de Google Workspace de <strong>{allowedDomainsLabel}</strong> para
              acceder a la plataforma.
            </>
          ) : (
            <>Inicie sesión con su cuenta de Google corporativa autorizada para acceder a la plataforma.</>
          )}
        </p>

        <div className="relative inline-flex justify-center mb-4 min-w-[280px]">
          <div className="pointer-events-none flex items-center justify-center gap-2 w-full bg-[#0d1b34] hover:bg-[#1c3358] text-white font-bold px-8 py-3.5 rounded-[14px] text-base">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#fff"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92a8.78 8.78 0 0 0 2.68-6.61z"
              />
              <path
                fill="#fff"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#fff"
                d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.29-1.71V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33z"
              />
              <path
                fill="#fff"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            <span>Iniciar sesión con Google</span>
          </div>
          <div className="absolute inset-0 opacity-0 cursor-pointer">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => clearLoginError()}
              {...(singleHostedDomain ? { hosted_domain: singleHostedDomain } : {})}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="280"
            />
          </div>
        </div>

        <p className="text-xs text-[#2f4d7a]/70">
          {ALLOWED_EMAIL_DOMAINS.length === 1 ? (
            <>
              Solo cuentas corporativas{' '}
              <span className="font-semibold text-[#0d1b34]">{allowedDomainsLabel}</span>
            </>
          ) : (
            <>Solo cuentas corporativas autorizadas ({allowedDomainsLabel})</>
          )}
        </p>

        {loginError && (
          <div className="mt-6 rounded-[14px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loginError}
          </div>
        )}
      </div>
    </div>
  );
}
