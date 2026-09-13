import React, { useMemo, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { PopoutLayout } from './components/layout/PopoutLayout';

import { getChromeAPI } from './lib/chrome';

export const App: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevTools =
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') ||
        e.key === 'F12';
      const api = getChromeAPI();
      if (isDevTools && api?.window?.toggleDevTools) {
        e.preventDefault();
        api.window.toggleDevTools();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const popoutPanel = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('popout');
    } catch {
      return null;
    }
  }, []);

  if (popoutPanel) {
    return <PopoutLayout panel={popoutPanel} />;
  }

  return <AppLayout />;
};

export default App;

