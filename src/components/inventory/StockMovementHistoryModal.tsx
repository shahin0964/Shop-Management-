import React, { useState, useMemo } from 'react';
import { History, Search, Filter, ArrowUpRight, ArrowDownRight, Layers, FileText } from 'lucide-react';
import { type InventoryMovement, type InventoryMovementType } from '../../types/inventory.ts';
import { type Product } from '../../types/product.ts';
import { Modal } from '../common/Modal.tsx';
import { Badge } from '../common/Badge.tsx';
import { Input } from '../common/Input.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { useInventory } from '../../context/InventoryContext.tsx';
import { useShop } from '../../context/ShopContext.tsx';

interface StockMovementHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const StockMovementHistoryModal: React.FC<StockMovementHistoryModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { movements } = useInventory();
  const { activeShop } = useShop();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const relevantMovements = useMemo(() => {
    let list = movements;
    if (product) {
      list = list.filter((m) => m.productId === product.id);
    }
    if (filterType !== 'ALL') {
      list = list.filter((m) => m.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.productName.toLowerCase().includes(q) ||
          m.reason?.toLowerCase().includes(q) ||
          m.note?.toLowerCase().includes(q) ||
          m.referenceId?.toLowerCase().includes(q) ||
          m.productCode?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [movements, product, filterType, searchQuery]);

  const getMovementBadge = (type: InventoryMovementType) => {
    switch (type) {
      case 'OPENING_STOCK':
        return <Badge variant="info" size="sm">Opening Stock</Badge>;
      case 'PURCHASE':
        return <Badge variant="success" size="sm">Purchase / Stock In</Badge>;
      case 'ADJUSTMENT':
        return <Badge variant="warning" size="sm">Stock Adjustment</Badge>;
      case 'SALE':
        return <Badge variant="neutral" size="sm">POS Sale</Badge>;
      case 'TRANSFER_IN':
        return <Badge variant="info" size="sm">Transfer In</Badge>;
      case 'TRANSFER_OUT':
        return <Badge variant="danger" size="sm">Transfer Out</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const title = product
    ? `Stock Audit History: ${product.name}`
    : 'Shop Stock Movement Audit Log';

  const description = product
    ? `Complete traceable ledger of stock additions, purchases, and adjustments for ${product.name} at ${activeShop?.name || 'this branch'}.`
    : `All chronological inventory movements recorded at ${activeShop?.name || 'this branch'}.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Product Quick Stat Banner if single product */}
        {product && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-900">{product.name}</span>
              <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                <span>SKU: {product.code || 'N/A'}</span>
                {product.barcode && <span>• Barcode: {product.barcode}</span>}
                <span>• Unit: {product.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[11px]">Current In-Hand Stock</div>
              <span className="font-bold text-slate-900 text-sm">
                {product.currentStock} {product.unit}
              </span>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-64">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reasons, notes, invoices..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Movement Types</option>
              <option value="PURCHASE">Purchases / Stock In</option>
              <option value="ADJUSTMENT">Stock Adjustments</option>
              <option value="OPENING_STOCK">Opening Stock</option>
            </select>
          </div>
        </div>

        {/* Audit Movements Table / List */}
        {relevantMovements.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<History className="w-6 h-6" />}
              badgeText="Zero Movements"
              title="No Movement Records Found"
              description={
                searchQuery || filterType !== 'ALL'
                  ? 'No inventory movements match the active filters.'
                  : 'No stock movements recorded yet. Movements are generated automatically on purchases, adjustments, and initial stock entries.'
              }
            />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Date & Time</th>
                  {!product && <th className="px-4 py-2.5 font-semibold">Product</th>}
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Change</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Stock Level</th>
                  <th className="px-4 py-2.5 font-semibold">Reason & Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {relevantMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  const isNegative = mov.quantity < 0;
                  const dateFormatted = new Date(mov.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {dateFormatted}
                      </td>
                      {!product && (
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{mov.productName}</div>
                          {mov.productCode && (
                            <span className="text-[11px] text-slate-400">{mov.productCode}</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getMovementBadge(mov.type)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`font-bold inline-flex items-center gap-1 ${
                            isPositive
                              ? 'text-emerald-600'
                              : isNegative
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : isNegative ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : null}
                          {isPositive ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-slate-400">{mov.previousStock}</span>
                        <span className="text-slate-300 mx-1.5">→</span>
                        <span className="font-semibold text-slate-900">{mov.newStock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{mov.reason || '—'}</div>
                        {mov.note && <div className="text-slate-500 text-[11px]">{mov.note}</div>}
                        {mov.referenceId && (
                          <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                            Ref: {mov.referenceId}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Close Button */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </Modal>
  );
};
