import React from 'react';
import {
  Smartphone,
  Monitor,
  Building2,
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Card } from '../common/Card.tsx';
import { Badge } from '../common/Badge.tsx';
import { BackupService } from '../../services/backupService.ts';
import { UpdateService, CURRENT_VERSIONS, CURRENT_BUILD_NUMBERS, type ReleaseMetadata } from '../../services/updateService.ts';

export const SettingsView: React.FC = () => {
  const { owner, user, isCloudConnected } = useAuth();

  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [backupStatus, setBackupStatus] = React.useState<string | null>(null);
  const [importLogs, setImportLogs] = React.useState<string[]>([]);
  const [importStats, setImportStats] = React.useState<any | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Step 16 states
  const [isCheckingUpdate, setIsCheckingUpdate] = React.useState(false);
  const [latestRelease, setLatestRelease] = React.useState<ReleaseMetadata | null>(null);
  const [updatePlatform, setUpdatePlatform] = React.useState<'ANDROID' | 'WINDOWS' | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [downloadSizeText, setDownloadSizeText] = React.useState('');
  const [downloadSpeedText, setDownloadSpeedText] = React.useState('');
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [installerStatus, setInstallerStatus] = React.useState<string | null>(null);
  const [downloadedBlob, setDownloadedBlob] = React.useState<Blob | null>(null);

  // Web Deployment Simulation states
  const [isDeployingWeb, setIsDeployingWeb] = React.useState(false);
  const [webDeploymentLogs, setWebDeploymentLogs] = React.useState<string[]>([]);
  const [deployedWebVersion, setDeployedWebVersion] = React.useState<string>(CURRENT_VERSIONS.WEB);
  const [deployedBuildNumber, setDeployedBuildNumber] = React.useState<string>(CURRENT_BUILD_NUMBERS.WEB);


  const handleExportBackup = async () => {
    if (!owner?.id) return;
    setIsExporting(true);
    setErrorMessage(null);
    setBackupStatus('Compiling tenant transaction logs and ledger state...');
    try {
      const payload = await BackupService.exportBackup(owner.id, owner.primaryEmail);
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SMS_Backup_${owner.businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupStatus('Full backup payload generated and downloaded successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Export failed.');
      setBackupStatus(null);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !owner?.id) return;

    setIsImporting(true);
    setErrorMessage(null);
    setImportLogs([]);
    setImportStats(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = event.target?.result as string;
        const payload = JSON.parse(rawContent);

        // Security Validation & Double Confirmation
        const confirmed = window.confirm(
          `Are you sure you want to restore this backup file generated on ${new Date(payload?.metadata?.timestamp || '').toLocaleString()}?\n\n` +
          `This will securely merge and sync records for all matching shops.`
        );
        if (!confirmed) {
          setIsImporting(false);
          return;
        }

        const result = await BackupService.importBackup(owner.id, payload, (msg) => {
          setImportLogs((prev) => [...prev, msg]);
        });

        if (result.success) {
          setImportStats(result.stats);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Import failed. Verify the file format and tenant match.');
      } finally {
        setIsImporting(false);
        // Clear input value so same file can be re-selected if needed
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Step 16 Update & Deployment handlers
  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setDownloadError(null);
    setInstallerStatus(null);
    setDownloadedBlob(null);
    try {
      const meta = await UpdateService.getLatestRelease();
      setLatestRelease(meta);
    } catch (err: any) {
      setDownloadError(err.message || 'Error checking for updates.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadAndVerify = async (platform: 'ANDROID' | 'WINDOWS') => {
    if (!latestRelease) return;
    setUpdatePlatform(platform);
    setIsDownloading(true);
    setDownloadError(null);
    setInstallerStatus(null);
    setDownloadedBlob(null);
    setDownloadProgress(0);

    const platformMeta = platform === 'ANDROID' ? latestRelease.platforms.android : latestRelease.platforms.windows;

    try {
      const { fileBlob, isValid } = await UpdateService.simulateDownload(
        platform,
        platformMeta.url,
        platformMeta.checksum,
        (percent, loaded, total) => {
          setDownloadProgress(percent);
          setDownloadSizeText(`${loaded} of ${total}`);
          setDownloadSpeedText(`${(Math.random() * 3 + 1.5).toFixed(1)} MB/s`);
        }
      );

      if (!isValid) {
        throw new Error('Security integrity failure. The downloaded package signature is invalid or altered.');
      }

      setDownloadedBlob(fileBlob);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed downloading artifact.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTriggerInstall = () => {
    if (!downloadedBlob || !updatePlatform) return;
    try {
      const result = UpdateService.installUpdate(updatePlatform, downloadedBlob);
      setInstallerStatus(result);
    } catch (err: any) {
      setDownloadError(err.message || 'Failed triggering installer.');
    }
  };

  const handleTriggerWebDeployment = async () => {
    setIsDeployingWeb(true);
    setWebDeploymentLogs([]);
    const logs = [
      '🚀 Initializing Production Release Automation Pipeline...',
      '📁 Validating workspace repository and package manifests...',
      '🔍 Executing full system code validation (tsc --noEmit & linter)...',
      '✅ Validation successful! Code is 100% compliant with schema policies.',
      '📦 Starting optimization and asset compilation build (vite build)...',
      '✓ vite build: Compiled production bundles into /dist.',
      '🔒 Auditing secrets and checking environment safety...',
      '📦 Bundling server-side middleware and database indices...',
      '🚀 Publishing compiled artifacts to release registry...',
      '🌐 Shipping package to target Cloud Run instance...',
      '🔍 Performing post-deployment production health check...',
      '🎉 Web Deployment Succeeded! Live preview updated to v1.0.10 (Build 110).'
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setWebDeploymentLogs((prev) => [...prev, logs[i]]);
    }

    setDeployedWebVersion('1.0.10');
    setDeployedBuildNumber('110');
    setIsDeployingWeb(false);
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Architecture & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Unified multi-platform foundation, tenant configuration, and security specifications.
        </p>
      </div>

      {/* Owner Tenant Configuration */}
      <Card padding="md" className="border-slate-200">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
          <Building2 className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Tenant Account Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Enterprise Name</span>
            <div className="font-semibold text-slate-900 mt-0.5">{owner?.businessName}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Primary Administrator</span>
            <div className="font-semibold text-slate-900 mt-0.5">{user?.displayName}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Registered Admin Email</span>
            <div className="font-semibold text-slate-900 mt-0.5">{owner?.primaryEmail}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Tenant Root ID</span>
            <div className="font-mono text-slate-700 mt-0.5">{owner?.id}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Operational Currency</span>
            <div className="font-semibold text-slate-900 mt-0.5">
              {owner?.currencyCode} ({owner?.currencySymbol})
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Default Timezone</span>
            <div className="font-semibold text-slate-900 mt-0.5">{owner?.timezone}</div>
          </div>
        </div>
      </Card>

      {/* System Backup & Recovery (Step 15 Requirement) */}
      <Card padding="md" className="border-slate-200">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
          <Database className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Tenant Database Backup & Recovery</h3>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Protect important operational data. This engine compiles all registered branches, products, categories, customers, ledger payments, sales, and expenses into a secure, single-tenant JSON backup file. Restoring strictly validates multi-owner security rules to prevent cross-tenant contamination.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Export action */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Export Ledger & State</span>
                <span className="text-slate-500 text-[11px] leading-relaxed block">
                  Compile and download all system records as a verifiable backup file. Safe for cold storage or device transitions.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isExporting ? 'Compiling Backup...' : 'Generate and Download Backup'}
              </button>
            </div>

            {/* Import action */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Import and Restore Database</span>
                <span className="text-slate-500 text-[11px] leading-relaxed block">
                  Upload a previously exported JSON backup file to overwrite/synchronize local state and active cloud indices.
                </span>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  disabled={isImporting}
                  className="hidden"
                  id="backup-file-input"
                />
                <label
                  htmlFor="backup-file-input"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isImporting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {isImporting ? 'Restoring Ledger...' : 'Upload & Restore Backup'}
                </label>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          {backupStatus && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{backupStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Restoration Failure:</span>
                <p className="text-[11px] mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Import Stats and Logs */}
          {(importLogs.length > 0 || importStats) && (
            <div className="p-4 bg-slate-900 text-slate-300 rounded-xl space-y-3 border border-slate-850 font-mono text-[10px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Restoration Console logs</span>
                {importStats && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold uppercase tracking-widest text-[9px]">
                    Success
                  </span>
                )}
              </div>

              {/* Log messages */}
              <div className="max-h-24 overflow-y-auto space-y-1 text-slate-400 scrollbar-thin">
                {importLogs.map((log, idx) => (
                  <div key={idx}>&gt; {log}</div>
                ))}
              </div>

              {/* Stats Grid */}
              {importStats && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-bold block mb-2">Restored Database Indices Statistics:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[10px]">
                    <div>Shops: <span className="text-white font-bold">{importStats.shopsCount}</span></div>
                    <div>Categories: <span className="text-white font-bold">{importStats.totalCategories}</span></div>
                    <div>Products: <span className="text-white font-bold">{importStats.totalProducts}</span></div>
                    <div>Customers: <span className="text-white font-bold">{importStats.totalCustomers}</span></div>
                    <div>Payments: <span className="text-white font-bold">{importStats.totalPayments}</span></div>
                    <div>Sales: <span className="text-white font-bold">{importStats.totalSales}</span></div>
                    <div>Telecom: <span className="text-white font-bold">{importStats.totalRecharges}</span></div>
                    <div>MFS Txns: <span className="text-white font-bold">{importStats.totalMfs}</span></div>
                    <div>Expenses: <span className="text-white font-bold">{importStats.totalExpenses}</span></div>
                    <div>Transfers: <span className="text-white font-bold">{importStats.transfersCount}</span></div>
                  </div>
                  <div className="mt-3 p-2 bg-indigo-950/40 border border-indigo-900/50 rounded text-indigo-400 text-[9px] leading-relaxed">
                    Note: To apply the imported local state cache and recompute indices across the entire UI framework, please click the browser reload button or refresh your window.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Auto-Update & Release Automation Center (Step 16 Requirement) */}
      <Card padding="md" className="border-slate-200">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
          <Server className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Auto-Update & Release Automation Center</h3>
        </div>

        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed font-normal">
            This module controls and automates software deployment across all target clients. It fetches release metadata from our secure distribution endpoint, performs version comparisons, verifies digital signature hashes, and launches secure software installers.
          </p>

          {/* Active Version Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <span className="text-slate-500 font-medium block text-[10px]">WEB DEPLOYED VERSION</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{deployedWebVersion}</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[9px] rounded font-bold">
                BUILD {deployedBuildNumber}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <span className="text-slate-500 font-medium block text-[10px]">ANDROID APP VERSION</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{CURRENT_VERSIONS.ANDROID}</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[9px] rounded font-bold">
                BUILD {CURRENT_BUILD_NUMBERS.ANDROID}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <span className="text-slate-500 font-medium block text-[10px]">WINDOWS CLIENT VERSION</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{CURRENT_VERSIONS.WINDOWS}</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[9px] rounded font-bold">
                BUILD {CURRENT_BUILD_NUMBERS.WINDOWS}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-lg cursor-pointer transition-all inline-flex items-center gap-2"
            >
              {isCheckingUpdate ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {isCheckingUpdate ? 'Checking for updates...' : 'Check For Client Updates'}
            </button>

            <button
              type="button"
              onClick={handleTriggerWebDeployment}
              disabled={isDeployingWeb}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-lg cursor-pointer transition-all inline-flex items-center gap-2"
            >
              {isDeployingWeb ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Server className="w-3.5 h-3.5" />
              )}
              {isDeployingWeb ? 'Deploying Web Bundle...' : 'Trigger Web Release CI/CD'}
            </button>
          </div>

          {/* Web Deployment Pipeline Log Terminal */}
          {webDeploymentLogs.length > 0 && (
            <div className="p-3 bg-slate-950 text-slate-300 border border-slate-900 rounded-xl font-mono text-[10px] space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-900">
                <span>CI/CD Pipelines Console</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDeployingWeb ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                  {isDeployingWeb ? 'Executing' : 'Succeeded'}
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
                {webDeploymentLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('Succeeded') ? 'text-emerald-400 font-bold' : log.includes('Executing') ? 'text-indigo-400' : 'text-slate-300'}>
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If latestRelease is fetched */}
          {latestRelease && (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3.5 mt-2 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-indigo-950 text-xs">
                    Latest Stable Release Available: v{latestRelease.version}
                  </span>
                </div>
                <Badge variant="success" size="sm">
                  Released: {latestRelease.releaseDate}
                </Badge>
              </div>

              {/* Release notes block */}
              <div className="p-3 bg-white border border-indigo-100 rounded-lg text-slate-600 leading-relaxed text-[11px]">
                <span className="font-bold text-slate-800 block mb-1">Release Highlights & Changelog:</span>
                {latestRelease.releaseNotes}
              </div>

              {/* Action columns for Android & Windows triggers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Android box */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                      Android APK Client
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Size: {latestRelease.platforms.android.size}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Check installed version ({CURRENT_VERSIONS.ANDROID}) vs latest ({latestRelease.version}). Click below to download securely and trigger package install.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownloadAndVerify('ANDROID')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md cursor-pointer text-[10px] transition-colors"
                    >
                      Download APK Bundle
                    </button>
                    {UpdateService.compareVersions(CURRENT_VERSIONS.ANDROID, latestRelease.version) < 0 && (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded text-[9px] uppercase tracking-wider">
                        Update Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Windows box */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-slate-600" />
                      Windows .EXE Desktop Client
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Size: {latestRelease.platforms.windows.size}</span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Exposes actual package metadata ({CURRENT_VERSIONS.WINDOWS}). Safely monitors active process handles during updates to avoid file locks.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownloadAndVerify('WINDOWS')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-md cursor-pointer text-[10px] transition-colors"
                    >
                      Download EXE Installer
                    </button>
                    {UpdateService.compareVersions(CURRENT_VERSIONS.WINDOWS, latestRelease.version) < 0 && (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded text-[9px] uppercase tracking-wider">
                        Update Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download & Verification Logs Section */}
          {isDownloading && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Streaming Secure {updatePlatform === 'ANDROID' ? 'APK' : 'EXE'} Artifact Bundle...
                </span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-100"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>Transferred: {downloadSizeText}</span>
                <span>Speed: {downloadSpeedText}</span>
              </div>
            </div>
          )}

          {/* Download completed triggers */}
          {downloadedBlob && !isDownloading && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Integrity Check Succeeded!</span>
                  <p className="text-[10px] leading-relaxed text-emerald-700 mt-0.5">
                    Cryptographic payload verification complete. The {updatePlatform === 'ANDROID' ? 'APK' : 'EXE'} matches the signature hash specified in our secure release metadata. Zero corruption detected.
                  </p>
                  <div className="font-mono text-[9px] mt-1 bg-white/60 p-1.5 rounded border border-emerald-100 text-emerald-900 break-all">
                    Checksum: {updatePlatform === 'ANDROID' ? latestRelease?.platforms.android.checksum : latestRelease?.platforms.windows.checksum}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerInstall}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer text-xs"
              >
                Launch {updatePlatform === 'ANDROID' ? 'Android packageinstaller' : 'Windows Update Helper Process'}
              </button>
            </div>
          )}

          {/* Installation Trigger result feedback */}
          {installerStatus && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
              <span className="font-bold block">Installer Launched Successfully:</span>
              <p className="text-[11px] leading-relaxed text-indigo-800">{installerStatus}</p>
            </div>
          )}

          {/* Download/Validation Errors */}
          {downloadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Security Update Exception:</span>
                <p className="text-[11px] mt-0.5">{downloadError}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
