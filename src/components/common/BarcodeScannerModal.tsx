/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw, X, CheckCircle2, QrCode } from 'lucide-react';
import { Modal } from './Modal.tsx';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcodeValue: string) => void;
  title?: string;
  description?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Android Camera Barcode Scanner',
  description = 'Align retail product barcode within the frame to scan',
}) => {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const scannedLockRef = useRef<boolean>(false);

  // Supported retail barcode formats
  const supportedFormats = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.QR_CODE,
  ];

  const stopScanner = async () => {
    if (html5QrcodeRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false;
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn('[BarcodeScanner] Scanner stop warning:', err);
      } finally {
        html5QrcodeRef.current = null;
      }
    }
  };

  const startScanner = async (cameraId?: string) => {
    setPermissionError(null);
    setIsInitializing(true);
    setLastScannedBarcode(null);
    scannedLockRef.current = false;

    await stopScanner();

    // Ensure DOM container exists
    const elementId = 'reader-barcode-viewport';
    const element = document.getElementById(elementId);
    if (!element) {
      setIsInitializing(false);
      return;
    }

    try {
      // 1. Check available cameras
      const devices = await Html5Qrcode.getCameras();
      setCameraDevices(devices || []);

      if (!devices || devices.length === 0) {
        setPermissionError('No camera found on this device.');
        setIsInitializing(false);
        return;
      }

      // Pick back camera if available, or given device ID
      let targetCameraConfig: string | { facingMode: string } = { facingMode: 'environment' };
      if (cameraId) {
        targetCameraConfig = cameraId;
      } else {
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          targetCameraConfig = backCamera.id;
          setSelectedCameraId(backCamera.id);
        } else {
          targetCameraConfig = devices[0].id;
          setSelectedCameraId(devices[0].id);
        }
      }

      const html5Qrcode = new Html5Qrcode(elementId, {
        formatsToSupport: supportedFormats,
        verbose: false,
      });
      html5QrcodeRef.current = html5Qrcode;

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Prevent accidental repeated scanning of the exact same barcode frame
        if (scannedLockRef.current) return;
        scannedLockRef.current = true;

        // Preserve exact barcode string representation (including leading zeros)
        const exactBarcode = String(decodedText).trim();
        setLastScannedBarcode(exactBarcode);

        // Vibrate on mobile device if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(100);
          } catch {
            // Ignore vibration errors
          }
        }

        // Trigger parent callback
        onScanSuccess(exactBarcode);

        // Stop scanner after successful scan to free resources
        stopScanner();
      };

      const qrCodeErrorCallback = () => {
        // Silent frame decoding failures are expected until barcode is aligned
      };

      await html5Qrcode.start(
        targetCameraConfig,
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333333,
        },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      isScanningRef.current = true;
      setIsInitializing(false);
    } catch (err: any) {
      console.error('[BarcodeScanner] Initializing error:', err);
      setIsInitializing(false);
      isScanningRef.current = false;

      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('NotAllowedError') ||
        errMsg.includes('Permission denied') ||
        errMsg.includes('Permission')
      ) {
        setPermissionError(
          'Camera access permission was denied. Please grant camera permission in your browser or Android app settings to use barcode scanning.'
        );
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('no camera')) {
        setPermissionError('No accessible camera device was detected on this device.');
      } else {
        setPermissionError(
          `Unable to access camera: ${errMsg || 'Camera stream could not be started.'}`
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow Modal DOM rendering
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCamId = e.target.value;
    setSelectedCameraId(newCamId);
    startScanner(newCamId);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} description={description} maxWidth="md">
      <div className="p-4 sm:p-6 space-y-4">
        {/* Permission / Device Error Banner */}
        {permissionError ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">Camera Access Issue</h4>
              <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">{permissionError}</p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => startScanner()}
                className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-xl text-xs hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera Access
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close Scanner
              </button>
            </div>
          </div>
        ) : (
          /* Live Camera Viewport Container */
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
            {/* Html5Qrcode target div */}
            <div id="reader-barcode-viewport" className="w-full h-full text-white" />

            {/* Scanning Overlay Reticle */}
            {isScanningRef.current && !lastScannedBarcode && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {/* Visual Viewfinder box */}
                <div className="w-[280px] h-[160px] border-2 border-blue-400/80 rounded-2xl relative shadow-2xl bg-blue-500/5">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br-sm" />
                  {/* Laser line animation */}
                  <div className="absolute inset-x-2 top-1/2 h-0.5 bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-4 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-xs">
                  Scanning for EAN-13, EAN-8, UPC, Code 128...
                </span>
              </div>
            )}

            {/* Initialization Loading Spinner */}
            {isInitializing && !permissionError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-2 z-10">
                <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-300 font-medium">Starting camera stream...</span>
              </div>
            )}

            {/* Last Scanned Barcode Overlay State */}
            {lastScannedBarcode && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 z-20 p-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <div>
                  <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                    Barcode Scanned Successfully
                  </span>
                  <div className="text-xl font-mono font-black text-white bg-emerald-900/80 border border-emerald-700/80 px-4 py-2 rounded-xl mt-1 tracking-widest">
                    {lastScannedBarcode}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera Selector Dropdown (if multiple cameras exist) */}
        {!permissionError && cameraDevices.length > 1 && (
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-slate-400" /> Switch Camera:
            </span>
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
            >
              {cameraDevices.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            Preserves exact leading zeros
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
