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
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5 transition-all duration-200 hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)] hover:shadow-lg"
    >
      {/* Bloco Superior: Poster à esquerda | Título, Ano e Diretor à direita */}
      <div className="flex items-start gap-4">
        {/* Poster */}
        {recommendation.poster_url && (
          <img
            src={recommendation.poster_url}
            alt={recommendation.titulo}
            className="w-28 aspect-[2/3] shrink-0 rounded-xl object-cover shadow-md border border-[var(--color-border-subtle)] transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}

        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          {/* Cabeçalho com Posição e Título */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold leading-tight text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-amber)]">
              {recommendation.titulo}
            </h3>

            <span className="shrink-0 rounded-md bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-amber)] border border-[var(--color-border-subtle)]">
              #{position}
            </span>
          </div>

          {/* Ano e Diretor */}
          <div className="space-y-0.5 font-mono text-xs text-[var(--color-muted)]">
            {recommendation.ano && (
              <p>
                <strong className="text-[var(--color-foreground)]">Ano:</strong> {recommendation.ano}
              </p>
            )}
            {recommendation.diretor && (
              <p className="truncate">
                <strong className="text-[var(--color-foreground)]">Direção:</strong> {recommendation.diretor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bloco Inferior: Sinopse abaixo de tudo */}
      {recommendation.sinopse && (
        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
          <p className="line-clamp-3 text-xs leading-relaxed text-[var(--color-muted)]">
            {recommendation.sinopse}
          </p>
        </div>
      )}
    </div>
  );
};