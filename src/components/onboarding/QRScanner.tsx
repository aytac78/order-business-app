'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startScanner();
    
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Arka kamera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR başarıyla okundu
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Tarama devam ediyor, hata değil
        }
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setIsScanning(false);
      
      if (err.toString().includes('NotAllowedError')) {
        setError('Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.');
      } else if (err.toString().includes('NotFoundError')) {
        setError('Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.');
      } else {
        setError('Kamera başlatılamadı. Lütfen tekrar deneyin.');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Stop scanner error:', err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // URL mi kontrol et
    const isUrl = decodedText.startsWith('http://') || decodedText.startsWith('https://');
    
    if (isUrl) {
      setScannedUrl(decodedText);
      await stopScanner();
      setIsScanning(false);
      
      // 1 saniye bekle, kullanıcıya göster
      setTimeout(() => {
        onScan(decodedText);
      }, 1500);
    } else {
      // URL değilse hata göster
      setError('Bu QR kod bir menü linki içermiyor. Lütfen işletmenin menü QR kodunu okutun.');
    }
  };

  const handleRetry = () => {
    setError(null);
    setScannedUrl(null);
    startScanner();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="text-white">
          <h2 className="font-semibold">QR Menü Tara</h2>
          <p className="text-sm text-gray-300">İşletmenin menü QR kodunu okutun</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm">
          {/* QR Reader Container */}
          <div 
            id="qr-reader" 
            ref={containerRef}
            className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-900"
          />

          {/* Scanning Overlay */}
          {isScanning && !scannedUrl && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-orange-500 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-orange-500 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-orange-500 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-orange-500 rounded-br-lg" />
              
              {/* Scanning line animation */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-scan" />
            </div>
          )}

          {/* Success State */}
          {scannedUrl && (
            <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center rounded-2xl">
              <CheckCircle className="w-16 h-16 text-white mb-4" />
              <p className="text-white font-semibold text-lg">QR Kod Okundu!</p>
              <p className="text-white/80 text-sm mt-2 px-4 text-center truncate max-w-full">
                {scannedUrl.substring(0, 50)}...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isScanning && (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center rounded-2xl p-6">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-white text-center mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black/50">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <Camera className="w-5 h-5" />
            <span>QR kodu çerçeve içine hizalayın</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm mt-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Otomatik algılanacak...</span>
          </div>
        </div>
      </div>

      {/* CSS for scanning animation */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 1rem; }
          50% { top: calc(100% - 1rem); }
          100% { top: 1rem; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
