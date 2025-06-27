import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startScanner = async () => {
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsScanning(true);
            setScannerReady(true);
            
            // Start scanning for barcodes
            scanIntervalRef.current = window.setInterval(() => {
              scanBarcode();
            }, 200); // Scan every 200ms for better performance
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please make sure you have granted camera permissions.');
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const scanBarcode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || !scannerReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Only process if video is playing
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // In a real implementation, we would use a barcode scanning library here
        // For example, with ZXing or QuaggaJS
        
        // For this demo, we'll simulate finding a barcode after a random delay
        // In a real app, this would be replaced with actual barcode detection logic
        if (Math.random() < 0.05) { // 5% chance of "detecting" a barcode on each scan
          const simulatedBarcode = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
          handleBarcodeDetected(simulatedBarcode);
        }
      } catch (err) {
        console.error('Error processing barcode:', err);
      }
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsScanning(false);
    
    // Play a success sound
    const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMD4+Pj4+Pj4+Pj4+Pj4+Pj4//////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYAAAAAAAAAAbBk6S2rAAAAAAAAAAAAAAAAAAAA/+MYxAANmAKwQAUAAAOAeBD5IP///wiIiL+IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiI//MUxBUMUAKwAAAAACIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIg==');
    audio.play();
    
    // Call the onScan callback with the detected barcode
    onScan(barcode);
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('manualBarcode') as HTMLInputElement;
    const barcode = input.value.trim();
    
    if (barcode) {
      handleBarcodeDetected(barcode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Barcode</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative">
          {error ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="relative bg-black w-full h-64">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full opacity-0"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-64">
                    {/* Scanner animation */}
                    <div className="absolute inset-0 border-2 border-blue-500 dark:border-blue-400 rounded-lg"></div>
                    
                    {/* Scanning line animation */}
                    {isScanning && (
                      <div 
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                        style={{
                          animation: 'scanLine 2s linear infinite',
                          top: '50%'
                        }}
                      ></div>
                    )}
                    
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 dark:border-blue-400 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 dark:border-blue-400 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 dark:border-blue-400 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 dark:border-blue-400 rounded-br"></div>
                  </div>
                </div>
                
                {/* Scanning animation styles */}
                <style jsx>{`
                  @keyframes scanLine {
                    0% { transform: translateY(-120px); }
                    50% { transform: translateY(120px); }
                    100% { transform: translateY(-120px); }
                  }
                `}</style>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            {isScanning ? 'Position barcode within the box...' : 'Initializing camera...'}
          </p>
          
          {/* Manual entry form */}
          <form onSubmit={handleManualEntry} className="flex space-x-2">
            <input
              type="text"
              name="manualBarcode"
              placeholder="Enter barcode manually"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}