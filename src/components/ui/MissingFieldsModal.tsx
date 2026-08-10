import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  title?: string;
}

export const MissingFieldsModal: React.FC<MissingFieldsModalProps> = ({
  isOpen,
  onClose,
  missingFields,
  title = 'Missing Required Fields',
}) => {
  if (!isOpen || missingFields.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-surface border border-red-500/40 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
          <AlertTriangle size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-text-primary uppercase tracking-wide">
          {title}
        </h3>
        <p className="font-mono text-xs text-text-secondary">
          Please complete all mandatory fields marked with a red asterisk (<span className="text-red-500 font-bold">*</span>) before submitting:
        </p>
        
        <div className="bg-elevated/70 border border-red-500/20 rounded-xl p-3.5 text-left font-mono text-xs text-red-400 space-y-1.5 max-h-48 overflow-y-auto">
          {missingFields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span className="font-bold text-text-primary">{field}</span>
            </div>
          ))}
        </div>

        <Button variant="primary" className="w-full" onClick={onClose}>
          Complete Required Fields
        </Button>
      </div>
    </div>
  );
};
