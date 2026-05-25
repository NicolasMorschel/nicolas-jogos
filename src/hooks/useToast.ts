import { useCallback, useState } from 'react';

declare global {
  interface Window {
    nicolasToastTimer?: number;
  }
}

export function useToast() {
  const [toast, setToast] = useState('');

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(window.nicolasToastTimer);
    window.nicolasToastTimer = window.setTimeout(() => setToast(''), 2600);
  }, []);

  return { toast, showToast };
}
