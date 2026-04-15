import { useState, useEffect, useCallback, useRef } from 'react';

interface HardwareEvents {
  onScan?: (barcode: string) => void;
}

export const useHardware = ({ onScan }: HardwareEvents = {}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [scaleWeight, setScaleWeight] = useState<number | null>(null);
  
  // Barcode Scanner Event Buffering (Simulates USB HID keyboard wedge)
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const SCANNER_TIMEOUT = 50; // ms

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field natively
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const now = performance.now();
      
      // If time since last key is too long, it's human typing, reset buffer
      if (now - lastKeyTimeRef.current > SCANNER_TIMEOUT) {
        bufferRef.current = '';
      }
      
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length > 3) {
          e.preventDefault();
          onScan?.(bufferRef.current);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);

  // Thermal Printer Simulator
  const printReceipt = useCallback(async (data: any) => {
    setIsPrinting(true);
    // Simulate ESC/POS rendering time and print speed
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("[PRINTER SIMULATOR] Receipt Printed:", data);
    setIsPrinting(false);
    return true;
  }, []);

  // Scale Simulator
  const readScale = useCallback(async (): Promise<number> => {
    // Simulate COM port reading delay and fluctuation
    const weight = +(Math.random() * (5 - 0.1) + 0.1).toFixed(3); // 0.1kg to 5kg
    setScaleWeight(weight);
    return weight;
  }, []);

  return {
    isPrinting,
    printReceipt,
    scaleWeight,
    readScale
  };
};
