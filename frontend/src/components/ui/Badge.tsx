import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-[#4F7FFF]/15 dark:text-[#4F7FFF] dark:border-[#4F7FFF]/30',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-[#32D583]/15 dark:text-[#32D583] dark:border-[#32D583]/30',
    warning: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-[#F79009]/15 dark:text-[#F79009] dark:border-[#F79009]/30',
    danger: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-[#F04438]/15 dark:text-[#F04438] dark:border-[#F04438]/30',
    neutral: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-[#2B2E35] dark:text-[#9CA3AF] dark:border-[#2B2E35]',
    info: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-[#38BDF8]/15 dark:text-[#38BDF8] dark:border-[#38BDF8]/30',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1 font-medium',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </span>
  );
};
