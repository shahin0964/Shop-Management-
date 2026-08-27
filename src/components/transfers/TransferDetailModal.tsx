import React from 'react';
import {
  ArrowLeftRight,
  Calendar,
  User,
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Modal } from '../common/Modal.tsx';
import { Badge } from '../common/Badge.tsx';
import { useShop } from '../../context/ShopContext.tsx';
import { type StockTransfer } from '../../types/transfer.ts';

interface TransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: StockTransfer | null;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  isOpen,
  onClose,
  transfer,
}) => {
  const { currencySymbol } = useShop();

  if (!transfer) return null;

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const renderStatusBadge = () => {
    switch (transfer.status) {
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
            <span>{transfer.status}</span>
          </Badge>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock Transfer ${transfer.transferNumber}`}
      description="Detailed record of inter-shop inventory movement"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Header Summary Card */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-400">{transfer.transferNumber}</span>
              {renderStatusBadge()}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(transfer.createdAt)}</span>
            </div>
          </div>

          {/* Branch Transfer Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
              <div className="text-[10px] uppercase tracking-wider text-rose-400 font-bold mb-0.5">
                Source Branch (Out)
              </div>
              <div className="text-sm font-semibold text-white">{transfer.sourceShopName}</div>
            </div>

            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-0.5">
                Destination Branch (In)
              </div>
              <div className="text-sm font-semibold text-white">{transfer.destinationShopName}</div>
            </div>
          </div>
        </div>

        {/* Audit Meta Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-semibold uppercase text-slate-500">Initiated By</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{transfer.initiatedBy || transfer.createdBy || 'Owner'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-semibold uppercase text-slate-500">Total Unique Items</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {transfer.totalItemCount || transfer.items.length} Products
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-semibold uppercase text-slate-500">Total Quantity</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5">
              {transfer.totalQuantity || transfer.items.reduce((s, i) => s + i.quantity, 0)} Units
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-semibold uppercase text-slate-500">Cost Valuation</div>
            <div className="text-xs font-bold text-emerald-600 mt-0.5">
              {currencySymbol} {Number(transfer.totalEstimatedValue || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Itemized Transfer Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Transferred Items Manifest</span>
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white divide-y divide-slate-100">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Product Details</div>
              <div className="col-span-2 text-right">Unit Cost</div>
              <div className="col-span-2 text-center">Transferred Qty</div>
              <div className="col-span-3 text-right">Total Cost Value</div>
            </div>

            {transfer.items.map((item, idx) => {
              const lineValuation = item.quantity * Number(item.unitCost || 0);

              return (
                <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 text-xs">
                  <div className="col-span-5 min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 truncate">{item.productName}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      {item.productCode && (
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded">
                          SKU: {item.productCode}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="font-mono bg-blue-50 text-blue-700 px-1 py-0.2 rounded">
                          Bar: {item.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 text-right font-medium text-slate-700">
                    {currencySymbol} {Number(item.unitCost || 0).toFixed(2)}
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md">
                      {item.quantity} {item.unit || 'PCS'}
                    </span>
                  </div>

                  <div className="col-span-3 text-right font-bold text-slate-900">
                    {currencySymbol} {lineValuation.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transfer Notes */}
        {transfer.notes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>Notes & Instructions</span>
            </div>
            <div className="text-xs text-slate-700 whitespace-pre-wrap">{transfer.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Detail
          </button>
        </div>
      </div>
    </Modal>
  );
};
