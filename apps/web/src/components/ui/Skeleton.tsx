import { cn } from '@/lib/cn';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width, height, className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-shimmer rounded bg-neutral-200', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
