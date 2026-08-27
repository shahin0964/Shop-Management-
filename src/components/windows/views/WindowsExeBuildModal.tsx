/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Laptop, Cpu, HardDrive, ShieldCheck, Terminal, Download, FileCode, CheckCircle2, X } from 'lucide-react';

interface WindowsExeBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsExeBuildModal: React.FC<WindowsExeBuildModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Windows Desktop Application (.EXE) Build Specifications</h3>
              <p className="text-[11px] text-slate-400">Electron 30+ / Tauri 2.0 Native Windows x64 Executable</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Release Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Target OS</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">Windows 10 / 11 (x64)</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Wrapper Framework</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">Electron v30.0 / Node v20</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Installer Type</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">NSIS 1-Click Installer</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Barcode Integration</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">USB Serial / HID Scanner</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Receipt Printer</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">Windows Thermal / ESC/POS</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Local Caching</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block">SQLite3 / IndexedDB Sync</span>
            </div>
          </div>

          {/* Architecture Highlights */}
          <div className="p-4 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-2">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Unified Cross-Platform Engine & Security</span>
            </h4>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              This Windows PC Desktop application compiles the exact same React + TypeScript codebase into a standalone native Windows executable container (`ShopManager-Setup.exe`). All API network calls, authentication tokens, Firestore security rules, multi-shop boundaries, and POS calculations are shared verbatim with Web and Android APK platforms.
            </p>
          </div>

          {/* Build Terminal Commands */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Windows Package Compilation Commands</span>
            </h4>
            <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
              <div className="text-slate-500"># Step 1: Install Electron & Builder tools</div>
              <div>npm install --save-dev electron electron-builder</div>
              <div className="text-slate-500 pt-1"># Step 2: Build bundled web static distribution</div>
              <div>npm run build</div>
              <div className="text-slate-500 pt-1"># Step 3: Package native 64-bit Windows EXE installer</div>
              <div>npx electron-builder --win nsis --x64</div>
            </div>
          </div>

          {/* Feature Checklist */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900">Supported Desktop Features</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>USB Plug-and-Play Barcode Scanner</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Keyboard Shortcuts (F1 - F10)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>System Thermal Receipt Spooling</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Shop Real-Time Data Sync</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Wide Multi-Column Data Tables</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Native Windows Window Frame</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Output: dist/ShopManager-Setup-2.4.0.exe</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
