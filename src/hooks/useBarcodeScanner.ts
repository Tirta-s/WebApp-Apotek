import { useEffect, useRef } from 'react';

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keydown if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          onScanRef.current(barcodeBuffer.current);
        }
        barcodeBuffer.current = '';
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Ensure it's a single character
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBuffer.current += e.key;

        // Reset buffer after 50ms of inactivity (scanners are fast, users are slow)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};
