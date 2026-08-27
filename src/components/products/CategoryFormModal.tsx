import React, { useState, useEffect } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { type ProductCategory, type CreateCategoryInput } from '../../types/product.ts';
import { Modal } from '../common/Modal.tsx';
import { Input } from '../common/Input.tsx';
import { Button } from '../common/Button.tsx';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateCategoryInput) => Promise<void>;
  editingCategory?: ProductCategory | null;
  shopName?: string;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCategory,
  shopName,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setErrorMessage(null);
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSave({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : 'Create New Category'}
      description={
        shopName
          ? `Manage categories for branch: ${shopName}`
          : 'Categories organize products for quick lookup and inventory filtering.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Input
          label="Category Name"
          placeholder="e.g. Router, Computer Parts, Electrical, Beverages..."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Brief description or classification notes for this category..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Tag className="w-4 h-4" />}
          >
            {editingCategory ? 'Update Category' : 'Save Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
