import React, { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';

/**
 * Day Container Creation & Edit Form Modal
 * @param {{ initialDay?: object, nextDayNumber?: number, onSubmit: (data: { title: string, description: string }) => Promise<void>, onClose: () => void }} props
 */
export const DayFormModal = ({ initialDay, nextDayNumber = 1, onSubmit, onClose }) => {
  const [title, setTitle] = useState(initialDay?.title || `Day ${nextDayNumber}: `);
  const [description, setDescription] = useState(initialDay?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(initialDay);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Day title is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ title: title.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save day.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {isEditing ? 'Edit Day' : `Add Day ${nextDayNumber}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="day-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Day Title *
            </label>
            <input
              id="day-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. Day ${nextDayNumber}: Product Launch Setup`}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label htmlFor="day-description" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Day Overview / Description (Optional)
            </label>
            <textarea
              id="day-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the core objective for this day's task list..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Save Day' : 'Create Day'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
