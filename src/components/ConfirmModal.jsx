// src/components/ui/ConfirmationModal.jsx
import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmLabel = "Ya, Lanjutkan", 
    cancelLabel = "Batal",
    variant = "danger", // 'danger' (merah) atau 'primary' (indigo)
    isLoading = false 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop Blur */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onClose : undefined}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                
                {/* Header dengan Icon */}
                <div className="p-6 pb-0 flex gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 flex gap-3 mt-2">
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    
                    <button 
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 ${
                            variant === 'danger' 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-100' 
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                        }`}
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>

                {/* Close Button Absolute (Optional) */}
                <button 
                    onClick={onClose} 
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmationModal;
