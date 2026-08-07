import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Sparkles className="w-8 h-8 text-[#4F7FFF]" />,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <Card variant="glass" className={`text-center py-12 px-6 ${className}`}>
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-2xl bg-[#15161A] border border-[#2B2E35] shadow-inner">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-bold text-[#F3F4F6] mb-2">{title}</h3>
      <p className="text-sm text-[#9CA3AF] max-w-md mx-auto mb-6">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
