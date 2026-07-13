/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DOMAIN_RESTRICTED_MESSAGE, isAllowedEmail } from './constants';
import { decodeGoogleIdToken } from './decodeJwt';
import { clearStoredSession, loadStoredSession, saveStoredSession } from './session';
import type { AuthUser } from './types';

interface AuthContextValue {
  user: AuthUser | null;
  idToken: string | null;
  isLoading: boolean;
  loginError: string | null;
  signInWithCredential: (credential: string) => void;
  signOut: () => void;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const signOut = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setIdToken(null);
    setLoginError(null);
  }, []);

  const signInWithCredential = useCallback((credential: string) => {
    const payload = decodeGoogleIdToken(credential);
    const email = payload?.email?.trim();

    if (!email || !isAllowedEmail(email)) {
      setLoginError(DOMAIN_RESTRICTED_MESSAGE);
      return;
    }

    const expiresAt = payload?.exp ?? Math.floor(Date.now() / 1000) + 3600;
    const nextUser: AuthUser = {
      email,
      name: payload?.name?.trim() || email.split('@')[0],
      picture: payload?.picture,
    };

    saveStoredSession({
      ...nextUser,
      idToken: credential,
      expiresAt,
    });

    setUser(nextUser);
    setIdToken(credential);
    setLoginError(null);
  }, []);

  const clearLoginError = useCallback(() => {
    setLoginError(null);
  }, []);

  useEffect(() => {
    const session = loadStoredSession();
    if (session) {
      setUser({
        email: session.email,
        name: session.name,
        picture: session.picture,
      });
      setIdToken(session.idToken);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!idToken) {
      return;
    }

    const session = loadStoredSession();
    if (!session) {
      signOut();
      return;
    }

    const msUntilExpiry = session.expiresAt * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      signOut();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signOut();
    }, msUntilExpiry);

    return () => window.clearTimeout(timeoutId);
  }, [idToken, signOut]);

  const value = useMemo(
    () => ({
      user,
      idToken,
      isLoading,
      loginError,
      signInWithCredential,
      signOut,
      clearLoginError,
    }),
    [user, idToken, isLoading, loginError, signInWithCredential, signOut, clearLoginError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
