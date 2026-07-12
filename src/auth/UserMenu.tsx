/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut } from 'lucide-react';
import type { AuthUser } from './types';

interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
  variant?: 'dark' | 'light';
}

export default function UserMenu({ user, onLogout, variant = 'light' }: UserMenuProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex items-center gap-3 ${
        isDark ? 'text-white/90' : 'text-[#132542]'
      }`}
    >
      {user.picture ? (
        <img
          src={user.picture}
          alt=""
          className="w-8 h-8 rounded-full border border-white/20 object-cover"
        />
      ) : (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            isDark ? 'bg-white/15 text-white' : 'bg-[#e8f0fa] text-[#0d1b34]'
          }`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="hidden sm:block text-left leading-tight min-w-0">
        <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#0d1b34]'}`}>
          {user.name}
        </p>
        <p className={`text-[10px] truncate ${isDark ? 'text-white/70' : 'text-[#2f4d7a]/70'}`}>
          {user.email}
        </p>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-[10px] px-2.5 py-1.5 transition-colors cursor-pointer ${
          isDark
            ? 'text-white/90 hover:bg-white/10 border border-white/20'
            : 'text-[#132542] hover:bg-[#e8f0fa] border border-[#dde2ea]'
        }`}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}
