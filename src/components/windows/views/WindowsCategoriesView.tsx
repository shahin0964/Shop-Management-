/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, CheckCircle2 } from 'lucide-react';
import { useProduct } from '../../../context/ProductContext.tsx';

export const WindowsCategoriesView: React.FC = () => {
  const { categories, createCategory } = useProduct();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await createCategory({ name, description });
      setName('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Create Category Form (5 cols) */}
      <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Tag className="w-4 h-4 text-blue-600" />
          <span>Create Product Category</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Beverages, Grocery, Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Short category description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium border border-rose-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Add Category'}</span>
          </button>
        </form>
      </div>

      {/* Category List Feed (7 cols) */}
      <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
          Product Categories Catalog ({categories.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {categories.map((cat) => (
            <div key={cat.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>{cat.name}</span>
                <span className="px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded text-[10px]">
                  Active
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                {cat.description || 'No description provided.'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
