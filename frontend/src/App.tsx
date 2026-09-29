import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { RatingEntry, Movie, MovieRecommendation, MovieDetails, User } from './api/api';
import { RecommendationCard } from './components/RecommendationCard';
import { api } from './api/api';
import { UserSelectionScreen } from './pages/UserSelectionScreen';


type Tab = 'history' | 'rate' | 'recommend';
type SortOption = 'RECENT' | 'OLD' | 'YEAR_DESC' | 'YEAR_ASC';

function MovieDetailsModal({
  identifier,
  onClose,
}: {
  identifier: { id?: number; title?: string; year?: string };
  onClose: () => void;
}) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Validação estrita para verificar se o ID é um número válido e não-NaN
    const hasValidId =
      identifier.id !== undefined &&
      identifier.id !== null &&
      !Number.isNaN(Number(identifier.id));

    const query = hasValidId
      ? String(identifier.id)
      : identifier.year
        ? `${identifier.title} (${identifier.year})`
        : identifier.title || '';

    if (!query || query === 'undefined') {
      setLoading(false);
      return;
    }
    api
      .getMovieDetails(query)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar detalhes:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [identifier]);



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer font-mono text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          ✕ Fechar
        </button>

        {loading ? (
          <div className="animate-pulse py-12 text-center font-mono text-sm text-[var(--color-muted)]">
            Carregando detalhes do filme…
          </div>
        ) : details ? (
          <div className="flex gap-5">
            {details.poster && (
              <img
                src={details.poster}
                alt={details.titulo_formatado}
                className="h-52 w-36 shrink-0 rounded-lg object-cover shadow-md"
              />
            )}
            <div className="flex-1 space-y-2">
              <h3 className="font-display text-xl font-bold text-[var(--color-foreground)]">
                {details.titulo_formatado}
              </h3>
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
                <span>Ano: {details.ano}</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                <strong>Direção:</strong> {details.diretor}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-foreground)]">
                {details.sinopse}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[var(--color-muted)]">
            <p className="font-display italic">Não foi possível carregar os detalhes do filme.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          disabled={readonly}
          className={`star-btn text-lg leading-none ${readonly ? 'cursor-default' : 'cursor-pointer'
            } ${s <= display ? 'text-[var(--color-amber)]' : 'text-[var(--color-border)]'}`}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={(e) => {
            e.stopPropagation();
            !readonly && onChange?.(s);
          }}
          aria-label={`Rate ${s} out of 5`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function RatingHistoryTab({
  userId,
  onSelectMovieId,
}: {
  userId: number;
  onSelectMovieId: (movieId: number) => void;
}) {
  const [entries, setEntries] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('RECENT');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    api
      .getRatings(userId)
      .then(setEntries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const filteredAndSortedEntries = useMemo(() => {
    return entries
      .filter((e) => {
        const matchesName = e.movie.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesRating =
          starFilter === 'ALL' || Math.round(e.rating) === starFilter;

        return matchesName && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === 'RECENT') {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === 'OLD') {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateA - dateB;
        }
        if (sortBy === 'YEAR_DESC') {
          return (Number(b.movie.year) || 0) - (Number(a.movie.year) || 0);
        }
        if (sortBy === 'YEAR_ASC') {
          return (Number(a.movie.year) || 0) - (Number(b.movie.year) || 0);
        }
        return 0;
      });
  }, [entries, searchTerm, starFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, starFilter, sortBy]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-[var(--color-muted)]">
        <span className="animate-pulse font-mono text-sm">Loading ratings…</span>
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
        <p className="font-mono text-sm text-[var(--color-red-rate)]">{error}</p>
      </div>
    );

  if (!entries.length)
    return (
      <div className="py-16 text-center text-[var(--color-muted)]">
        <p className="font-display text-xl italic">No ratings yet.</p>
        <p className="mt-1 text-sm">Switch to the Rate tab to get started.</p>
      </div>
    );

  const totalPages = Math.ceil(filteredAndSortedEntries.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = filteredAndSortedEntries.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block font-mono text-xs text-[var(--color-muted)]">
            Buscar por nome
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o título..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-amber)]"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs text-[var(--color-muted)]">
            Avaliação
          </label>
          <select
            value={starFilter}
            onChange={(e) =>
              setStarFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-amber)]"
          >
            <option value="ALL">Todas as notas</option>
            <option value="5">★ 5 estrelas</option>
            <option value="4">★ 4 estrelas</option>
            <option value="3">★ 3 estrelas</option>
            <option value="2">★ 2 estrelas</option>
            <option value="1">★ 1 estrela</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-mono text-xs text-[var(--color-muted)]">
            Ordenar por
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-xs text-[var(--color-foreground)] outline-none focus:border-[var(--color-amber)]"
          >
            <option value="RECENT">Últimos avaliados (Mais recentes)</option>
            <option value="OLD">Primeiros avaliados (Mais antigos)</option>
            <option value="YEAR_DESC">Ano de lançamento (Mais novo → Antigo)</option>
            <option value="YEAR_ASC">Ano de lançamento (Mais antigo → Novo)</option>
          </select>
        </div>
      </div>

      {currentEntries.length === 0 ? (
        <div className="py-12 text-center text-[var(--color-muted)]">
          <p className="font-mono text-sm">Nenhum filme encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentEntries.map((e, i) => {
            const globalIndex = startIndex + i + 1;
            return (
              <div
                key={`${e.movie.id}-${globalIndex}`}
                onClick={() => onSelectMovieId(e.movie.id)}
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-5 py-4 transition-colors hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] font-mono text-xs text-[var(--color-muted)]">
                  {globalIndex}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-semibold leading-tight text-[var(--color-foreground)]">
                    {e.movie.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3">
                    {e.movie.year && (
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        {e.movie.year}
                      </span>
                    )}
                    {e.movie.genre && (
                      <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]">
                        {e.movie.genre}
                      </span>
                    )}
                    {e.timestamp && (
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        {e.timestamp}
                      </span>
                    )}
                  </div>
                </div>
                <StarRating value={e.rating} readonly />
                <span className="font-mono text-sm font-medium text-[var(--color-amber)]">
                  {e.rating}/5
                </span>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-foreground)] transition-opacity hover:border-[var(--color-amber)] disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Página {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="cursor-pointer rounded-lg border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-foreground)] transition-opacity hover:border-[var(--color-amber)] disabled:opacity-30"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}

function RateMovieTab({
  userId,
  onSelectMovieId,
}: {
  userId: number;
  onSelectMovieId: (movieId: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError(null);
    api
      .searchMovies(q)
      .then(setResults)
      .catch((e: Error) => setSearchError(e.message))
      .finally(() => setSearching(false));
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 400);
  };

  const submitRating = async (movie: Movie) => {
    const r = ratings[movie.id];
    if (!r) return;
    setSubmitting((p) => ({ ...p, [movie.id]: true }));
    try {
      await api.rateMovie(userId, movie.id, r);
      setDone((p) => ({ ...p, [movie.id]: true }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting((p) => ({ ...p, [movie.id]: false }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Procure por um filme"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-3.5 pl-11 pr-4 font-body text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-amber)] focus:ring-1 focus:ring-[var(--color-amber-glow)]"
        />
        {searching && (
          <span className="animate-pulse absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--color-muted)]">
            searching…
          </span>
        )}
      </div>

      {searchError && (
        <p className="font-mono text-xs text-[var(--color-red-rate)]">{searchError}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((movie) => (
            <div
              key={movie.id}
              onClick={() => onSelectMovieId(movie.id)}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] px-5 py-4 transition-colors hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-semibold text-[var(--color-foreground)]">
                  {movie.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  {movie.year && (
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {movie.year}
                    </span>
                  )}
                  {movie.genre && (
                    <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]">
                      {movie.genre}
                    </span>
                  )}
                </div>
              </div>

              {done[movie.id] ? (
                <span className="font-mono text-xs text-[var(--color-green-rate)]">✓ Rated</span>
              ) : (
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <StarRating
                    value={ratings[movie.id] ?? 0}
                    onChange={(v) => setRatings((p) => ({ ...p, [movie.id]: v }))}
                  />
                  <button
                    disabled={!ratings[movie.id] || submitting[movie.id]}
                    onClick={() => submitRating(movie)}
                    className="cursor-pointer rounded-lg bg-[var(--color-amber)] px-4 py-1.5 font-body text-sm font-medium text-[#0a0a0e] transition-opacity hover:opacity-90 disabled:opacity-30"
                  >
                    {submitting[movie.id] ? '…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && !searchError && (
        <div className="py-12 text-center text-[var(--color-muted)]">
          <p className="font-display italic">No results for "{query}"</p>
        </div>
      )}

      {!query.trim() && (
        <div className="py-12 text-center text-[var(--color-muted)]">
          <p className="font-display text-lg italic">Encontre um filme para avaliar</p>
          <p className="mt-1 text-sm">Digite o titulo acima para buscar em nosso catálogo.</p>
        </div>
      )}
    </div>
  );
}


function RecommendationsTab({
  userId,
  onSelectMovieId,
}: {
  userId: number;
  onSelectMovieId: (movieId: number) => void;
}) {
  const [recs, setRecs] = useState<MovieRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);




  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const recommendations = await api.getRecommendations(userId);
      setRecs(recommendations.slice(0, 10));
    } catch (e) {
      setError((e as Error).message || 'Erro ao buscar recomendações.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Busca inicial automatizada
  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, fetchRecommendations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-pulse font-mono text-sm text-[var(--color-muted)]">
          Crunching the algorithm…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
        <p className="font-mono text-sm text-[var(--color-red-rate)]">
          {error}
        </p>

        <button
          onClick={fetchRecommendations}
          className="cursor-pointer font-mono text-xs text-[var(--color-amber)] underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!recs.length) {
    return (
      <div className="py-16 text-center text-[var(--color-muted)]">
        <p className="font-display italic">
          No recommendations available yet.
        </p>
        <p className="mt-1 text-sm">
          Rate more movies to improve results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Top {recs.length} recomendações para você!
        </p>

        <button
          //onClick={fetchRecommendations}
          className="cursor-pointer font-mono text-xs text-[var(--color-amber)] hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {recs.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.movie_id}-${index}`}
            recommendation={recommendation}
            position={index + 1}
            onSelect={onSelectMovieId}
          />
        ))}
      </div>
    </div >
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('recommend');
  const [selectedMovie, setSelectedMovie] = useState<{ id?: number; title?: string; year?: string } | null>(
    null
  );

  if (!currentUser) {
  return (
    <UserSelectionScreen
      onConfirmUser={(user) => setCurrentUser(user)}
    />
  );
}

const userId = currentUser.user_id;

const tabs: { id: Tab; label: string }[] = [
  { id: 'recommend', label: 'Recomendações' },
  { id: 'rate', label: 'Avaliar Filme' },
  { id: 'history', label: 'Minhas Avaliações' },
];

return (
  <div className="min-h-screen w-full bg-[var(--color-background)] text-[var(--color-foreground)]">
    {/* Header Fixo Estilo Netflix */}
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-background)]/90 px-6 py-4 backdrop-blur-md md:px-12">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-black tracking-wider text-yellow-600">
            DJG MATCH
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`cursor-pointer font-body text-sm font-medium transition-colors ${
                t.id === tab
                  ? 'font-semibold text-white'
                  : 'text-[var(--color-muted)] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-yellow-600 font-mono text-xs font-bold text-white shadow">
            {(currentUser.name || 'U').charAt(0).toUpperCase()}
          </div>

          <span className="hidden font-mono text-xs text-[var(--color-foreground)] sm:inline">
            {currentUser.name || `Usuário #${userId}`}
          </span>
        </div>

        <button
          onClick={() => setCurrentUser(null)}
          className="cursor-pointer rounded-md border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-muted)] transition-colors hover:border-white hover:text-white"
        >
          Trocar
        </button>
      </div>
    </header>

    {/* Navegação Mobile */}
    <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-card)] px-4 py-2 md:hidden">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex-1 py-2 text-center font-body text-xs font-medium ${
            t.id === tab
              ? 'border-b-2 border-red-600 font-semibold text-white'
              : 'text-[var(--color-muted)]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>

    {/* Conteúdo Principal */}
    <main className="mx-auto max-w-7xl px-6 py-8 md:px-12">
      <section className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {tab === 'recommend' && 'Recomendados para Você'}
          {tab === 'rate' && 'Explore e Avalie Filmes'}
          {tab === 'history' && 'Seu Histórico de Avaliações'}
        </h1>

        <p className="font-mono text-xs text-[var(--color-muted)]">
          {tab === 'recommend' &&
            'Com base nas suas avaliações e preferências no CineMatch'}
          {tab === 'rate' &&
            'Pesquise e atribua estrelas aos filmes que você já assistiu'}
          {tab === 'history' &&
            'Acompanhe todas as suas notas e datas de avaliação'}
        </p>
      </section>

      {/*
        Todas as abas permanecem montadas em memória para preservar o estado e evitar novos carregamentos na API.
        Apenas a aba ativa visível via CSS.
      */}

      <div className={tab === 'history' ? 'block' : 'hidden'}>
        <RatingHistoryTab
          userId={userId}
          onSelectMovieId={(id) => setSelectedMovie({ id })}
        />
      </div>

      <div className={tab === 'rate' ? 'block' : 'hidden'}>
        <RateMovieTab
          userId={userId}
          onSelectMovieId={(id) => setSelectedMovie({ id })}
        />
      </div>

      <div className={tab === 'recommend' ? 'block' : 'hidden'}>
        <RecommendationsTab
          userId={userId}
          onSelectMovieId={(id) => setSelectedMovie({ id })}
        />
      </div>
    </main>

    {/* Modal OMDb */}
    {selectedMovie && (
      <MovieDetailsModal
        identifier={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    )}

    {/* Footer */}
    <footer className="mt-auto border-t border-[var(--color-border-subtle)] px-6 py-8 text-center md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Perfil ativo:{' '}
          <span className="text-white">
            {currentUser.name || `Usuário #${userId}`}
          </span>{' '}
          · ID #{userId}
        </p>

        <p className="font-mono text-xs text-[var(--color-muted)]">
          DJG-MATCH © 2026
        </p>
      </div>
    </footer>
  </div>
);
}