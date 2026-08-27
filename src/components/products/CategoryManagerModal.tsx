import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type ProductCategory, type CreateCategoryInput } from '../../types/product.ts';
import { useProduct } from '../../context/ProductContext.tsx';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Badge } from '../common/Badge.tsx';
import { CategoryFormModal } from './CategoryFormModal.tsx';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  shopName,
}) => {
  const { categories, products, createCategory, updateCategory, deleteCategory } = useProduct();
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  const getProductCountForCategory = (categoryId: string) => {
    return products.filter((p) => p.categoryId === categoryId).length;
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setIsFormModalOpen(true);
  };

  const handleSaveCategory = async (input: CreateCategoryInput) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, input);
    } else {
      await createCategory(input);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteSuccessMessage(null);
    try {
      const result = await deleteCategory(deletingCategory.id);
      if (result.reassignedProductCount > 0) {
        setDeleteSuccessMessage(
          `Category deleted. ${result.reassignedProductCount} product(s) safely unassigned to "Uncategorized".`
        );
      } else {
        setDeleteSuccessMessage('Category deleted safely.');
      }
      setDeletingCategory(null);
    } catch (err: any) {
      console.error('Failed to delete category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Category Management"
        description={`Organize and manage categories for ${shopName}`}
        maxWidth="lg"
      >
        <div className="p-6 space-y-6">
          {/* Header Action & Stats */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>{categories.length} Categories Registered</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Category
            </Button>
          </div>

          {/* Delete Notice / Success Alert */}
          {deleteSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{deleteSuccessMessage}</span>
            </div>
          )}

          {/* Deletion Confirmation Dialogue (Safe Deletion with Reassignment Guard) */}
          {deletingCategory && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-900">
                  <p className="font-bold">
                    Safe Deletion Confirmation for &ldquo;{deletingCategory.name}&rdquo;
                  </p>
                  <p className="leading-relaxed">
                    This branch currently has{' '}
                    <span className="font-bold underline">
                      {getProductCountForCategory(deletingCategory.id)} product(s)
                    </span>{' '}
                    linked to this category. Deleting it will safely reassign them to{' '}
                    <span className="font-semibold">&ldquo;Uncategorized&rdquo;</span>. No products
                    will ever be deleted.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingCategory(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDelete}
                  isLoading={isDeleting}
                >
                  Proceed with Safe Deletion
                </Button>
              </div>
            </div>
          )}

          {/* Category List */}
          {categories.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-500">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                No Categories Added
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Categories are scoped to this branch. Click &ldquo;Add Category&rdquo; above to
                create your first category.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {categories.map((cat) => {
                const count = getProductCountForCategory(cat.id);
                return (
                  <div
                    key={cat.id}
                    className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {cat.name}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {count} {count === 1 ? 'product' : 'products'}
                        </Badge>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{cat.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteSuccessMessage(null);
                          setDeletingCategory(cat);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Safety & Cross-Platform Integrity Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Categories are strictly scoped to the active branch. Renaming or deleting categories
              maintains stable relationships without affecting other branches or destroying products.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Form Modal for Create / Edit */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
        shopName={shopName}
      />
    </>
  );
};
