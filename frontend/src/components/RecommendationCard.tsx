import React from 'react';
import type { MovieRecommendation } from '../api/api';

interface RecommendationCardProps {
  recommendation: MovieRecommendation;
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
      onClick={() => onSelect(recommendation.titulo, recommendation.ano)}
      className="relative cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5 transition-colors hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)]"
    >
      {/* Posição */}
      <div className="absolute right-4 top-4 font-mono text-xs text-[var(--color-muted)]">
        #{position}
      </div>

      <div className="flex gap-4">
        {/* Poster */}
        {recommendation.poster_url && (
          <img
            src={recommendation.poster_url}
            alt={recommendation.titulo}
            className="h-24 w-16 rounded-md object-cover shrink-0 shadow"
          />
        )}

        <div className="min-w-0 flex-1">
          {/* Título */}
          <p className="pr-8 font-display text-base font-semibold leading-snug text-[var(--color-foreground)]">
            {recommendation.titulo}
          </p>

          {/* Informações */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
            {recommendation.ano && <span>{recommendation.ano}</span>}
            {recommendation.diretor && <span>• Dir: {recommendation.diretor}</span>}
          </div>


        </div>
      </div>

      {/* Sinopse */}
      {recommendation.sinopse && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-2">
          {recommendation.sinopse}
        </p>
      )}


    </div>
  );
};