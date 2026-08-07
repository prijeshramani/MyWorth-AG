import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'bordered' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverEffect = true,
  children,
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    default: 'bg-[#1E2025] border border-[#2B2E35] shadow-xl shadow-black/20 text-[#F3F4F6]',
    glass: 'card-glass text-[#F3F4F6]',
    bordered: 'bg-transparent border border-[#2B2E35] text-[#F3F4F6]',
    ghost: 'bg-[#15161A]/50 border border-transparent text-[#F3F4F6]',
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 hover:border-[#4F7FFF]/40 hover:shadow-lg hover:shadow-[#4F7FFF]/5'
    : '';

  return (
    <motion.div
      className={`rounded-2xl sm:rounded-3xl ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
