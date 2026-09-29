import React from 'react';
import type { MovieRecommendation } from '../api/api';

interface RecommendationCardProps {
  recommendation: MovieRecommendation;
  position: number;
  onSelect: (movieId: number) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  position,
  onSelect,
}) => {
  return (
    <div
      onClick={() => onSelect(recommendation.movie_id)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4 transition-all duration-200 hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)] hover:shadow-lg"
    >
      {/* Badge de Posição sobreposta no topo do Pôster */}
      <span className="absolute right-6 top-6 z-10 shrink-0 rounded-md bg-black/70 backdrop-blur-md px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-amber)] border border-white/10 shadow-md">
        #{position}
      </span>

      {/* Bloco Superior: Pôster */}
      {recommendation.poster_url && (
        <div className="relative w-full overflow-hidden rounded-xl border border-[var(--color-border-subtle)]">
          <img
            src={recommendation.poster_url}
            alt={recommendation.titulo}
            className="w-full aspect-[2/3] object-cover shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Bloco Inferior: Título, Ano, Direção e Sinopse */}
      <div className="mt-3 flex flex-1 flex-col justify-between space-y-2">
        <div>
          {/* Título e Ano */}
          <div className="space-y-1">
            <h3 className="break-words font-display text-base font-bold leading-snug text-[var(--color-foreground)] line-clamp-2 transition-colors group-hover:text-[var(--color-amber)]">
              {recommendation.titulo}
            </h3>

            {recommendation.ano && (
              <p className="font-mono text-xs text-[var(--color-muted)]">
                {recommendation.ano}
              </p>
            )}
          </div>

          {/* Direção */}
          {recommendation.diretor && (
            <p className="mt-1.5 truncate font-mono text-xs text-[var(--color-muted)]">
              <strong className="text-[var(--color-foreground)]">Dir:</strong> {recommendation.diretor}
            </p>
          )}
        </div>

        {/* Sinopse na parte inferior */}
        {recommendation.sinopse && (
          <div className="border-t border-[var(--color-border-subtle)] pt-2.5">
            <p className="line-clamp-3 text-xs leading-relaxed text-[var(--color-muted)]">
              {recommendation.sinopse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};