// src/components/ConfirmModal.jsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 scale-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
          >
            Batal
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 text-sm transition-transform active:scale-95 ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;