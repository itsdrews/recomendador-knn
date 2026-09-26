import React from 'react';
import type { Recommendation } from '../api/api';

interface RecommendationCardProps {
  recommendation: Recommendation;
  position: number;
  onSelect: (title: string, year?: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  position,
  onSelect,
}) => {
  return (
    <div
      onClick={() =>
        onSelect(
          recommendation.movie.title,
          recommendation.movie.year?.toString()
        )
      }
      className="relative cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5 transition-colors hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)]"
    >
      {/* Posição da recomendação */}
      <div className="absolute right-4 top-4 font-mono text-xs text-[var(--color-muted)]">
        #{position}
      </div>

      {/* Título */}
      <p className="pr-8 font-display text-base font-semibold leading-snug text-[var(--color-foreground)]">
        {recommendation.movie.title}
      </p>

      {/* Informações do filme */}
      <div className="mt-1.5 flex items-center gap-2">
        {recommendation.movie.year && (
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {recommendation.movie.year}
          </span>
        )}

        {recommendation.movie.genre && (
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]">
            {recommendation.movie.genre}
          </span>
        )}

        {/* Score */}
        {recommendation.score !== undefined && (
          <span className="ml-auto font-mono text-xs text-[var(--color-amber)]">
            {(recommendation.score * 100).toFixed(0)}% match
          </span>
        )}
      </div>

      {/* Motivo da recomendação */}
      {recommendation.reason && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
          {recommendation.reason}
        </p>
      )}
    </div>
  );
};