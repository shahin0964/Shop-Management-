import React, { useState } from 'react';
import { Store, Plus, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Card } from '../common/Card.tsx';
import { Button } from '../common/Button.tsx';
import { Badge } from '../common/Badge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { Modal } from '../common/Modal.tsx';
import { Input } from '../common/Input.tsx';

export const ShopsView: React.FC = () => {
  const { shops, activeShopId, setActiveShopId, createShop } = useShop();
  const { owner } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isMainBranch, setIsMainBranch] = useState(shops.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMsg('Branch name and unique code are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createShop({
        name,
        code,
        address,
        phone,
        isMainBranch,
      });
      setName('');
      setCode('');
      setAddress('');
      setPhone('');
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Branches & Shops</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical outlets and retail locations under {owner?.businessName}.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Register New Branch
        </Button>
      </div>

      {/* Hierarchy Explanation Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
            1:N
          </div>
          <div>
            <span className="font-semibold text-slate-900">Owner Hierarchy Rule: </span>
            <span className="text-slate-600">
              One Owner can manage multiple branches. All shops share the central product catalog, while inventory and sales remain isolated per shop.
            </span>
          </div>
        </div>
        <Badge variant="neutral">Owner Isolation Active</Badge>
      </div>

      {/* Real Branches List or Empty State */}
      {shops.length === 0 ? (
        <Card padding="lg" className="border-slate-200">
          <EmptyState
            icon={<Store className="w-6 h-6" />}
            badgeText="Zero Branches"
            title="No Branches Registered Yet"
            description="You haven't created any shops under this owner account. Click below to register your primary branch or warehouse."
            action={
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Register First Branch
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => {
            const isSelected = activeShopId === shop.id;
            return (
              <Card
                key={shop.id}
                padding="md"
                className={`relative transition-all cursor-pointer hover:border-slate-300 ${
                  isSelected ? 'ring-2 ring-blue-600 border-blue-600 shadow-sm' : 'border-slate-200'
                }`}
                onClick={() => setActiveShopId(shop.id)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                        {shop.name}
                      </h3>
                      <span className="font-mono text-[11px] font-semibold text-slate-400">
                        {shop.code}
                      </span>
                    </div>
                  </div>
                  {shop.isMainBranch && <Badge variant="platform">Main Branch</Badge>}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  {shop.address ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{shop.address}</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">No address specified</div>
                  )}

                  {shop.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{shop.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Branch</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    ID: {shop.id.slice(-6)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal to create real branch */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Branch / Shop"
        description="Add a physical shop, outlet, or warehouse under this Owner account."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Branch / Shop Name"
            placeholder="e.g. Uttara Outlet, Dhanmondi Branch"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Branch Code / Identifier"
            placeholder="e.g. DHK-02, UTR-MAIN"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            helperText="Short unique uppercase code used for receipts and inventory tracking."
          />
          <Input
            label="Physical Location / Address"
            placeholder="e.g. Sector 3, Uttara, Dhaka"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            label="Branch Phone Number"
            placeholder="e.g. +880 1812 345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isMainBranchCheck"
              checked={isMainBranch}
              onChange={(e) => setIsMainBranch(e.target.checked)}
              className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4"
            />
            <label htmlFor="isMainBranchCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Set as Principal / Main Branch
            </label>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Save Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
