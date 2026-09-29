import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 'lg',
  showLabel = false,
  className,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
    xl: 'w-12 h-12 sm:w-14 sm:h-14',
  };

  const currentRating = hoverRating !== null ? hoverRating : value;

  const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
    if (readOnly || !onChange) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(starValue);
    } else if (e.key === 'ArrowRight' && starValue < 5) {
      e.preventDefault();
      onChange(starValue + 1);
    } else if (e.key === 'ArrowLeft' && starValue > 1) {
      e.preventDefault();
      onChange(starValue - 1);
    }
  };

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      <div
        className="flex items-center gap-2 sm:gap-3"
        role="radiogroup"
        aria-label="Star Rating from 1 to 5"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentRating;
          const isSelected = star === value;

          return (
            <motion.button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverRating(star)}
              onMouseLeave={() => !readOnly && setHoverRating(null)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              whileHover={!readOnly ? { scale: 1.15 } : {}}
              whileTap={!readOnly ? { scale: 0.9 } : {}}
              className={clsx(
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-1.5 transition-transform',
                readOnly ? 'cursor-default pointer-events-none' : 'cursor-pointer touch-manipulation'
              )}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              tabIndex={readOnly ? -1 : 0}
            >
              <Star
                className={clsx(
                  starSizes[size],
                  'transition-all duration-200',
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'fill-transparent text-slate-300 hover:text-slate-400'
                )}
              />
            </motion.button>
          );
        })}
      </div>

      {showLabel && value > 0 && (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider animate-fade-in">
          {value === 5 && 'Outstanding experience'}
          {value === 4 && 'Very good experience'}
          {value === 3 && 'Average experience'}
          {value === 2 && 'Needs improvement'}
          {value === 1 && 'Poor experience'}
        </span>
      )}
    </div>
  );
};
