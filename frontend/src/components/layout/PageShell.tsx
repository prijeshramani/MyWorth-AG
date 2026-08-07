import React from 'react';
import { motion } from 'framer-motion';

export interface PageShellProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`min-h-screen bg-[#0B0B0C] text-[#F3F4F6] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto ${className}`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#2B2E35]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F3F4F6]">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-[#9CA3AF] max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Main Content Slot */}
      <main className="space-y-6">
        {children}
      </main>
    </motion.div>
  );
};
