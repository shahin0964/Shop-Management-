/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, ShieldCheck, Cpu, Download, CheckCircle2, Layers, Server, Code2, HardDrive, Wifi } from 'lucide-react';
import { Modal } from '../../common/Modal.tsx';
import { useAuth } from '../../../context/AuthContext.tsx';

interface AndroidApkBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkBuildModal: React.FC<AndroidApkBuildModalProps> = ({ isOpen, onClose }) => {
  const { isCloudConnected, user, owner } = useAuth();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Android APK Production Architecture"
      description="Native Android platform compilation status & backend synchronization pipeline"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Status Badge Banner */}
        <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>ShopManagement.apk</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-semibold">
                  v1.0.0 (Build 13)
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Target SDK 34 (Android 14) • Min SDK 24 (Android 7.0 Nougat)
              </p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Release Ready</span>
            </span>
            <span className="text-[10px] text-slate-500">ARM64-v8a / x86_64</span>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>Application Package</span>
            </div>
            <div className="space-y-1 text-slate-600 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Package Name:</span>
                <span className="font-bold text-slate-900">com.shopmanagement.pos</span>
              </div>
              <div className="flex justify-between">
                <span>Build Variant:</span>
                <span className="font-bold text-slate-900">release (Signed)</span>
              </div>
              <div className="flex justify-between">
                <span>Compiler:</span>
                <span className="font-bold text-slate-900">R8 / ProGuard Enabled</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Server className="w-4 h-4 text-purple-600" />
              <span>Backend Synchronization</span>
            </div>
            <div className="space-y-1 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Cloud Auth Pipeline:</span>
                <span className="font-bold text-slate-900">Shared Firebase / REST</span>
              </div>
              <div className="flex justify-between">
                <span>Realtime Persistence:</span>
                <span className="font-bold text-slate-900">Firestore Rules Guarded</span>
              </div>
              <div className="flex justify-between">
                <span>Owner ID Scope:</span>
                <span className="font-mono font-bold text-slate-900 truncate max-w-[120px]">
                  {owner?.id || user?.uid || 'OWNER_AUTHENTICATED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Check List */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Native Android Capabilities Verified</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Camera Barcode Scanner (`html5-qrcode`)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Touch-optimized One-Hand POS Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Shared Firestore Database & Auth Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>80mm Thermal & A4 Invoice Printing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Multi-Shop Branch Switcher</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Realtime Stock & Sales Synchronization</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Security & Data Authorization Guarantee</span>
          </div>
          <p className="text-amber-800">
            Android APK operations use the exact same server-side Firestore security rules as the web platform. Data created on Android (Sales, Customers, Expenses, Transfers) immediately reflects on Web and vice versa.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close Specification
          </button>
        </div>
      </div>
    </Modal>
  );
};
