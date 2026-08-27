/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Printer, FileText, Receipt, Check, X } from 'lucide-react';
import { PrintableDocument, PrintPaperFormat } from '../../types/print.ts';
import { PrintableReceipt } from './PrintableReceipt.tsx';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PrintableDocument | null;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  if (!isOpen || !document) return null;

  const [selectedFormat, setSelectedFormat] = useState<PrintPaperFormat>(
    document.paperFormat || 'THERMAL_80MM'
  );

  const activeDoc: PrintableDocument = {
    ...document,
    paperFormat: selectedFormat,
  };

  const handlePrint = () => {
    // Triggers standard browser print dialog
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 no-print-backdrop">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-800/80 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Print Preview</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 bg-slate-700 text-slate-300 rounded-md">
                  #{document.referenceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Review receipt layout before sending to connected thermal or desktop printer
              </p>
            </div>
          </div>

          {/* Paper Format Switcher & Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Format Selector Pills */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setSelectedFormat('THERMAL_80MM')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedFormat === 'THERMAL_80MM'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('STANDARD_A4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedFormat === 'STANDARD_A4'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Standard A4</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Canvas Container */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex-1 flex justify-center items-start min-h-[400px]">
          {/* Paper Frame Card */}
          <div className="printable-document-container w-full flex justify-center">
            <PrintableReceipt document={activeDoc} />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 no-print">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready to print standard browser output</span>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
