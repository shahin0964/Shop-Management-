import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Send,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Eye,
  Hash,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useTelecomMfs } from '../../context/TelecomMfsContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { TelecomRecharge, MfsTransaction, MfsProvider, MfsTransactionType } from '../../types/telecomMfs.ts';
import { RecordRechargeModal } from '../telecom/RecordRechargeModal.tsx';
import { RecordMfsModal } from '../telecom/RecordMfsModal.tsx';
import { RechargeDetailModal } from '../telecom/RechargeDetailModal.tsx';
import { MfsDetailModal } from '../telecom/MfsDetailModal.tsx';

type PrimaryTab = 'recharge' | 'mfs';

const OPERATORS = ['All', 'Grameenphone', 'Robi', 'Banglalink', 'Airtel', 'Teletalk', 'Skitto', 'Other'];

const PROVIDERS: { id: string; label: string; badgeClass: string }[] = [
  { id: 'ALL', label: 'All Providers', badgeClass: 'bg-slate-100 text-slate-800' },
  { id: 'BKASH', label: 'bKash', badgeClass: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 'NAGAD', label: 'Nagad', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'ROCKET', label: 'Rocket', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'UPAY', label: 'Upay', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'OTHER', label: 'Other', badgeClass: 'bg-slate-100 text-slate-800' },
];

const MFS_TYPES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Types' },
  { id: 'CASH_IN', label: 'Cash In' },
  { id: 'CASH_OUT', label: 'Cash Out' },
  { id: 'SEND_MONEY', label: 'Send Money' },
  { id: 'RECEIVE_MONEY', label: 'Receive Money' },
  { id: 'PAYMENT', label: 'Payment' },
];

export const TelecomMfsView: React.FC = () => {
  const { owner } = useAuth();
  const { activeShop, shops } = useShop();
  const {
    recharges,
    mfsTransactions,
    isLoading,
    error,
    refreshData,
    dailySummary,
  } = useTelecomMfs();

  const currencySymbol = owner?.currencySymbol || '৳';

  const [activeTab, setActiveTab] = useState<PrimaryTab>('recharge');

  // Modals
  const [isRecordRechargeOpen, setIsRecordRechargeOpen] = useState<boolean>(false);
  const [isRecordMfsOpen, setIsRecordMfsOpen] = useState<boolean>(false);
  const [selectedRecharge, setSelectedRecharge] = useState<TelecomRecharge | null>(null);
  const [selectedMfs, setSelectedMfs] = useState<MfsTransaction | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Filtered Recharges
  const filteredRecharges = useMemo(() => {
    return recharges.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.reference && r.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.note && r.note.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesOperator = selectedOperator === 'All' || r.operator === selectedOperator;

      return matchesSearch && matchesOperator;
    });
  }, [recharges, searchQuery, selectedOperator]);

  // Filtered MFS Transactions
  const filteredMfs = useMemo(() => {
    return mfsTransactions.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.reference && m.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.note && m.note.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProvider = selectedProvider === 'ALL' || m.provider === selectedProvider;
      const matchesType = selectedType === 'ALL' || m.type === selectedType;

      return matchesSearch && matchesProvider && matchesType;
    });
  }, [mfsTransactions, searchQuery, selectedProvider, selectedType]);

  const getProviderBadge = (provider: MfsProvider) => {
    switch (provider) {
      case 'BKASH':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">bKash</span>;
      case 'NAGAD':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">Nagad</span>;
      case 'ROCKET':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">Rocket</span>;
      case 'UPAY':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Upay</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Other</span>;
    }
  };

  const getTypeBadge = (type: MfsTransactionType) => {
    switch (type) {
      case 'CASH_IN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Cash In</span>;
      case 'CASH_OUT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Cash Out</span>;
      case 'SEND_MONEY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Send Money</span>;
      case 'RECEIVE_MONEY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Receive Money</span>;
      case 'PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Payment</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  if (!activeShop) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 my-6 max-w-xl mx-auto shadow-xs">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No Active Branch Selected</h3>
        <p className="text-sm text-slate-500 mt-1">
          Please select a branch or shop from the top branch selector to record and view telecom recharge and mobile financial service transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {activeShop.name} ({activeShop.code})
            </span>
            <span className="text-xs text-slate-400">• Step 9 Telecom & MFS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Telecom Recharge & Mobile Financial Services
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log financial transaction accounting for mobile load, bKash, Nagad, and Rocket
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsRecordRechargeOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Recharge</span>
          </button>

          <button
            onClick={() => setIsRecordMfsOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record MFS</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Recharges */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recharge Volume Today</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {currencySymbol} {dailySummary.totalRechargeAmountToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dailySummary.rechargeCountToday} mobile loads today
          </p>
        </div>

        {/* Card 2: Today's Cash In */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MFS Cash In Today</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {currencySymbol} {dailySummary.totalMfsCashInToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Deposits into customer accounts</p>
        </div>

        {/* Card 3: Today's Cash Out */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MFS Cash Out Today</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {currencySymbol} {dailySummary.totalMfsCashOutToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cash dispensed to customers</p>
        </div>

        {/* Card 4: Total MFS Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total MFS Volume Today</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {currencySymbol} {dailySummary.totalMfsVolumeToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {dailySummary.mfsCountToday} MFS transactions
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3">
          <button
            onClick={() => {
              setActiveTab('recharge');
              setSearchQuery('');
            }}
            className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'recharge'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Recharge ({recharges.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('mfs');
              setSearchQuery('');
            }}
            className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'mfs'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>bKash / Nagad / Rocket ({mfsTransactions.length})</span>
          </button>
        </div>

        {/* Tab 1: Telecom Recharge */}
        {activeTab === 'recharge' && (
          <div className="p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search mobile number or ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Operator:
                </span>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Customer Phone</th>
                    <th className="py-3 px-4">Ref / Request ID</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {isLoading && recharges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                        <span>Loading recharge transaction history...</span>
                      </td>
                    </tr>
                  ) : filteredRecharges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No Recharge Transactions Found</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Click &quot;Record Recharge&quot; to add your first mobile load entry for this shop.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecharges.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {record.operator}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {record.customerPhone}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {record.reference || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-base">
                          {currencySymbol} {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{record.createdBy}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedRecharge(record)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                            title="View Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: MFS (bKash, Nagad, Rocket) */}
        {activeTab === 'mfs' && (
          <div className="p-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer phone or TRX ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                />
              </div>

              {/* Provider Quick Pills & Type Filter */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {PROVIDERS.map((p) => {
                    const isSelected = selectedProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  {MFS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer Phone</th>
                    <th className="py-3 px-4">TRX ID / Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {isLoading && mfsTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2" />
                        <span>Loading MFS transaction history...</span>
                      </td>
                    </tr>
                  ) : filteredMfs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No MFS Transactions Found</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Click &quot;Record MFS&quot; to log bKash, Nagad, or Rocket shop transactions.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMfs.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4">{getProviderBadge(record.provider)}</td>
                        <td className="py-3 px-4">{getTypeBadge(record.type)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {record.customerPhone}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-blue-700">
                          {record.reference || <span className="text-slate-300 font-normal">—</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-base">
                          {currencySymbol} {record.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{record.createdBy}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedMfs(record)}
                            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                            title="View Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Modals */}
      <RecordRechargeModal
        isOpen={isRecordRechargeOpen}
        onClose={() => setIsRecordRechargeOpen(false)}
        currencySymbol={currencySymbol}
      />

      <RecordMfsModal
        isOpen={isRecordMfsOpen}
        onClose={() => setIsRecordMfsOpen(false)}
        currencySymbol={currencySymbol}
      />

      {/* Detail Modals */}
      <RechargeDetailModal
        recharge={selectedRecharge}
        onClose={() => setSelectedRecharge(null)}
        currencySymbol={currencySymbol}
        shopName={activeShop.name}
      />

      <MfsDetailModal
        mfsTransaction={selectedMfs}
        onClose={() => setSelectedMfs(null)}
        currencySymbol={currencySymbol}
        shopName={activeShop.name}
      />
    </div>
  );
};
