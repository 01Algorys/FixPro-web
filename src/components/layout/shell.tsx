'use client';

import { createContext, useContext } from 'react';

interface Shell {
  // Lets the top bar's menu button open the sidebar drawer on small screens
  openSidebar: () => void;
  // Unread admin alerts (e.g. reviews under 3 stars), polled by the dashboard layout
  alertCount: number;
  refreshAlerts: () => void;
}

export const ShellContext = createContext<Shell>({ openSidebar: () => {}, alertCount: 0, refreshAlerts: () => {} });

export const useShell = () => useContext(ShellContext);
