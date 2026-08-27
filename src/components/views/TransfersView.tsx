import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Package,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../common/Card.tsx';
import { Button } from '../common/Button.tsx';
import { Badge } from '../common/Badge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { useTransfer } from '../../context/TransferContext.tsx';
import { type StockTransfer } from '../../types/transfer.ts';
import { CreateTransferModal } from '../transfers/CreateTransferModal.tsx';
import { TransferDetailModal } from '../transfers/TransferDetailModal.tsx';

export const TransfersView: React.FC = () => {
  const { shops, currencySymbol } = useShop();
  const { transfers, isLoading, refreshTransfers } = useTransfer();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedTransferForDetail, setSelectedTransferForDetail] = useState<StockTransfer | null>(null);

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Branch filter
      if (selectedBranchFilter !== 'ALL') {
        if (t.sourceShopId !== selectedBranchFilter && t.destinationShopId !== selectedBranchFilter) {
          return false;
        }
      }

      // Search query
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const numberMatch = t.transferNumber.toLowerCase().includes(query);
      const sourceMatch = t.sourceShopName.toLowerCase().includes(query);
      const destMatch = t.destinationShopName.toLowerCase().includes(query);
      const creatorMatch = (t.initiatedBy || t.createdBy || '').toLowerCase().includes(query);
      const itemMatch = t.items.some(
        (i) =>
          i.productName.toLowerCase().includes(query) ||
          (i.productCode && i.productCode.toLowerCase().includes(query)) ||
          (i.barcode && i.barcode.toLowerCase().includes(query))
      );

      return numberMatch || sourceMatch || destMatch || creatorMatch || itemMatch;
    });
  }, [transfers, selectedBranchFilter, searchQuery]);

  // Overall Statistics Metrics
  const summaryMetrics = useMemo(() => {
    let totalItemsCount = 0;
    let totalQuantityCount = 0;
    let totalValuation = 0;

    transfers.forEach((t) => {
      totalItemsCount += t.totalItemCount || t.items.length;
      totalQuantityCount += t.totalQuantity || t.items.reduce((sum, i) => sum + i.quantity, 0);
      totalValuation += Number(t.totalEstimatedValue || 0);
    });

    return {
      totalTransfers: transfers.length,
      totalItemsCount,
      totalQuantityCount,
      totalValuation: Math.round(totalValuation * 100) / 100,
    };
  }, [transfers]);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="danger" size="sm" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{status}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Stock Transfers</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inter-shop inventory movements, branch replenishment, and transfer audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshTransfers()}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Transfers List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Stock Transfer
          </Button>
        </div>
      </div>

      {/* Inter-Branch Transfer Security Architecture Notification */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Tenant & Branch Multi-Shop Protection
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Transfers execute atomically across branches under your owner tenant. Source stock decreases while destination inventory updates instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-center">
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400">Total Transferred</div>
            <div className="font-bold text-emerald-400">{currencySymbol} {summaryMetrics.totalValuation.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Transfer Orders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summaryMetrics.totalTransfers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Inter-branch shipments</div>
        </Card>

        <Card padding="md" className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Items Transferred</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summaryMetrics.totalQuantityCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">{summaryMetrics.totalItemsCount} unique catalog products</div>
        </Card>

        <Card padding="md" className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Valuation Transferred</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {currencySymbol} {summaryMetrics.totalValuation.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cost value of moved stock</div>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transfer reference, branch, or product..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Owner Branches</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transfers Data List */}
      {isLoading ? (
        <Card padding="lg" className="border-slate-200">
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Fetching stock transfer records...
          </div>
        </Card>
      ) : filteredTransfers.length === 0 ? (
        <Card padding="lg" className="border-slate-200">
          <EmptyState
            icon={<ArrowLeftRight className="w-6 h-6" />}
            badgeText="Inter-Shop Pipeline"
            title={transfers.length === 0 ? "No Stock Transfers Created Yet" : "No Transfers Match Filter"}
            description={
              transfers.length === 0
                ? "Initiate stock movements between branches to replenish low inventory, rebalance stock, or transfer items."
                : "No transfer records match your current search query or branch filter."
            }
            actionButton={
              transfers.length === 0 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Stock Transfer
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Transfer Ref</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Route (Source → Destination)</th>
                  <th className="px-4 py-3 text-center">Items & Qty</th>
                  <th className="px-4 py-3 text-right">Cost Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransfers.map((transfer) => {
                  const itemsCount = transfer.totalItemCount || transfer.items.length;
                  const totalQty = transfer.totalQuantity || transfer.items.reduce((sum, i) => sum + i.quantity, 0);

                  return (
                    <tr key={transfer.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {transfer.transferNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-600 text-[11px]">
                        {formatDate(transfer.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-slate-800">{transfer.sourceShopName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-900 font-bold">{transfer.destinationShopName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          By: {transfer.initiatedBy || transfer.createdBy || 'Owner'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-slate-900">{totalQty} Units</div>
                        <div className="text-[10px] text-slate-500">{itemsCount} products</div>
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {currencySymbol} {Number(transfer.totalEstimatedValue || 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {renderStatusBadge(transfer.status)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedTransferForDetail(transfer)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          View Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Transfer Modal */}
      <CreateTransferModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refreshTransfers();
        }}
      />

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        isOpen={!!selectedTransferForDetail}
        onClose={() => setSelectedTransferForDetail(null)}
        transfer={selectedTransferForDetail}
      />
    </div>
  );
};
