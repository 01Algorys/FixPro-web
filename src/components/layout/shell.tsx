'use client';

import { createContext, useContext, useMemo } from 'react';
import type { AccessLevel, AdminMe, AdminSection } from '@/types';
import { canAccess } from '@/lib/access';

interface Shell {
  // Lets the top bar's menu button open the sidebar drawer on small screens
  openSidebar: () => void;
  // Unread admin alerts (e.g. reviews under 3 stars), polled by the dashboard layout
  alertCount: number;
  refreshAlerts: () => void;
  // The signed-in admin and their access (null until loaded, or if the API can't say)
  me: AdminMe | null;
}

export const ShellContext = createContext<Shell>({ openSidebar: () => {}, alertCount: 0, refreshAlerts: () => {}, me: null });

export const useShell = () => useContext(ShellContext);

/** can('payments', 'edit') — whether to show an action; the API checks it again */
export function useAccess() {
  const { me } = useShell();
  // Stable while the access doesn't change, so pages can use `can` in effect dependencies
  return useMemo(() => ({
    me,
    full: !me || me.full,
    can: (section: AdminSection, level: AccessLevel = 'view') => canAccess(me, section, level),
  }), [me]);
}
