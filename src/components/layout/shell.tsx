'use client';

import { createContext, useContext } from 'react';

// Lets the top bar's menu button open the sidebar drawer on small screens
export const ShellContext = createContext<{ openSidebar: () => void }>({ openSidebar: () => {} });

export const useShell = () => useContext(ShellContext);
