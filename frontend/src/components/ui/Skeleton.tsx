import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      className={`animate-pulse bg-[#252830]/70 border border-[#2B2E35]/40 ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-[#1E2025] border border-[#2B2E35] space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton width="40%" height={16} />
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    <Skeleton width="70%" height={32} />
    <Skeleton width="50%" height={14} />
  </div>
);
