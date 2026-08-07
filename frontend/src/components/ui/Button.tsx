import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0B0C] disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl';

  const variantStyles = {
    primary: 'bg-[#4F7FFF] hover:bg-[#3B6EEF] text-white focus:ring-[#4F7FFF] shadow-lg shadow-[#4F7FFF]/20 border border-[#4F7FFF]/30',
    secondary: 'bg-[#1E2025] hover:bg-[#252830] text-[#F3F4F6] border border-[#2B2E35] focus:ring-[#4F7FFF]',
    ghost: 'bg-transparent hover:bg-[#1E2025] text-[#9CA3AF] hover:text-[#F3F4F6] focus:ring-[#4F7FFF]',
    danger: 'bg-[#F04438] hover:bg-[#D9382E] text-white focus:ring-[#F04438] shadow-lg shadow-[#F04438]/20',
    outline: 'bg-transparent hover:bg-[#1E2025] text-[#4F7FFF] border border-[#4F7FFF]/40 focus:ring-[#4F7FFF]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex items-center">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex items-center">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};
