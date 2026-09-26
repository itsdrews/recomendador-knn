import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { RatingEntry, Movie, MovieRecommendation, MovieDetails } from './api/api';
import { RecommendationCard } from './components/RecommendationCard';
import { api } from './api/api';

const USERS = [
  { id: 1, name: 'Alex M.', avatar: 'AM' },
  { id: 2, name: 'Jordan K.', avatar: 'JK' },
  { id: 3, name: 'Sam R.', avatar: 'SR' },
  { id: 4, name: 'Taylor B.', avatar: 'TB' },
  { id: 5, name: 'Morgan L.', avatar: 'ML' },
];

type Tab = 'history' | 'rate' | 'recommend';
type SortOption = 'RECENT' | 'OLD' | 'YEAR_DESC' | 'YEAR_ASC';

// Modal de Detalhes do Filme (OMDb)
function MovieDetailsModal({
  title,
  year,
  onClose,
}: {
  title: string;
  year?: string;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Recompõe o formato "Título (Ano)" esperado pelo seu backend
    const tituloBruto = year ? `${title} (${year})` : title;

    api.getMovieDetails(tituloBruto)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar detalhes:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [title, year]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 font-mono text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer"
        >
          ✕ Fechar
        </button>

        {loading ? (
          <div className="py-12 text-center font-mono text-sm text-[var(--color-muted)] animate-pulse">
            Carregando detalhes do filme…
          </div>
        ) : details ? (
          <div className="flex gap-5">
            {details.poster && (
              <img
                src={details.poster}
                alt={details.titulo_formatado}
                className="h-52 w-36 rounded-lg object-cover shadow-md shrink-0"
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
  onSelectMovie,
}: {
  userId: number;
  onSelectMovie: (title: string, year?: string) => void;
}) {
  const [entries, setEntries] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState<number | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('RECENT');

  // Paginação
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

  // Aplicação dos Filtros e Ordenação via useMemo
  const filteredAndSortedEntries = useMemo(() => {
    return entries
      .filter((e) => {
        // Filtro por Nome
        const matchesName = e.movie.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        // Filtro por Estrelas/Nota
        const matchesRating =
          starFilter === 'ALL' || Math.round(e.rating) === starFilter;

        return matchesName && matchesRating;
      })
      .sort((a, b) => {
        // Ordenações
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
          return (b.movie.year || 0) - (a.movie.year || 0);
        }
        if (sortBy === 'YEAR_ASC') {
          return (a.movie.year || 0) - (b.movie.year || 0);
        }
        return 0;
      });
  }, [entries, searchTerm, starFilter, sortBy]);

  // Resetar a página para a 1ª sempre que alterar algum filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, starFilter, sortBy]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-[var(--color-muted)]">
        <span className="font-mono text-sm animate-pulse">Loading ratings…</span>
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

  // Lógica da Paginação baseada na lista filtrada
  const totalPages = Math.ceil(filteredAndSortedEntries.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = filteredAndSortedEntries.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Barra de Controles e Filtros */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-4 sm:grid-cols-3">
        {/* Busca por Nome */}
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

        {/* Filtro por Avaliação (Estrelas) */}
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

        {/* Ordenação por Data de Avaliação / Ano de Lançamento */}
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

      {/* Exibição da Lista */}
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
                onClick={() => onSelectMovie(e.movie.title, e.movie.year?.toString())}
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

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-foreground)] transition-opacity disabled:opacity-30 hover:border-[var(--color-amber)] cursor-pointer"
          >
            ← Anterior
          </button>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Página {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-foreground)] transition-opacity disabled:opacity-30 hover:border-[var(--color-amber)] cursor-pointer"
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
  onSelectMovie,
}: {
  userId: number;
  onSelectMovie: (title: string, year?: string) => void;
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
          placeholder="Search for a movie…"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-3.5 pl-11 pr-4 font-body text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-amber)] focus:ring-1 focus:ring-[var(--color-amber-glow)]"
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--color-muted)] animate-pulse">
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
              onClick={() => onSelectMovie(movie.title, movie.year?.toString())}
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
                    className="rounded-lg bg-[var(--color-amber)] px-4 py-1.5 font-body text-sm font-medium text-[#0a0a0e] transition-opacity disabled:opacity-30 hover:opacity-90 cursor-pointer"
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
          <p className="font-display text-lg italic">Find a film to rate</p>
          <p className="mt-1 text-sm">Type a title above to search the catalog.</p>
        </div>
      )}
    </div>
  );
}

function RecommendationsTab({
  userId,
  onSelectMovie,
}: {
  userId: number;
  onSelectMovie: (title: string, year?: string) => void;
}) {
  const [recs, setRecs] = useState<MovieRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const recommendations = await api.getRecommendations(userId);

      // Garante que apenas as 5 primeiras sejam exibidas
      setRecs(recommendations.slice(0, 5));
      setFetched(true);
    } catch (e) {
      setError((e as Error).message || 'Erro ao buscar recomendações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRecs([]);
    setFetched(false);
    setError(null);
  }, [userId]);

  // Estado inicial
  if (!fetched && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20">
        <p className="font-display text-xl italic text-[var(--color-foreground)]">
          Ready for your next watch?
        </p>

        <button
          onClick={fetchRecommendations}
          className="rounded-xl bg-[var(--color-amber)] px-8 py-3 font-body text-sm font-semibold text-[#0a0a0e] transition-all hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] cursor-pointer"
        >
          Get Recommendations
        </button>
      </div>
    );
  }

  // Carregando
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono text-sm text-[var(--color-muted)] animate-pulse">
          Crunching the algorithm…
        </span>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
        <p className="font-mono text-sm text-[var(--color-red-rate)]">
          {error}
        </p>

        <button
          onClick={fetchRecommendations}
          className="font-mono text-xs text-[var(--color-amber)] underline cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  // Nenhuma recomendação
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

  // Recomendações
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Top {recs.length} recommendations for you
        </p>

        <button
          onClick={fetchRecommendations}
          className="font-mono text-xs text-[var(--color-amber)] hover:underline cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recs.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.movie_id}-${index}`}
            recommendation={recommendation}
            position={index + 1}
            onSelect={onSelectMovie}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [userId, setUserId] = useState<number>(1);
  const [tab, setTab] = useState<Tab>('history');
  const [selectedMovie, setSelectedMovie] = useState<{ title: string; year?: string } | null>(
    null
  );

  const currentUser = USERS.find((u) => u.id === userId) ?? USERS[0];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'history', label: 'Rating History' },
    { id: 'rate', label: 'Rate a Movie' },
    { id: 'recommend', label: 'Recommendations' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-10">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[var(--color-amber)]">
            CineMatch
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--color-foreground)]">
            Movie
            <br />
            <span className="font-light italic">Recommendations</span>
          </h1>
        </header>

        {/* User Selector */}
        <section className="mb-8">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">
            Select Profile
          </p>
          <div className="flex flex-wrap gap-2">
            {USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setUserId(u.id);
                  setTab('history');
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 font-body text-sm transition-all cursor-pointer ${u.id === userId
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber-glow)] text-[var(--color-amber)]'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-card)] text-[var(--color-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-foreground)]'
                  }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs ${u.id === userId
                    ? 'bg-[var(--color-amber)] text-[#0a0a0e]'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                    }`}
                >
                  {u.avatar}
                </span>
                {u.name}
              </button>
            ))}
          </div>
        </section>

        {/* Tab Nav */}
        <div className="mb-6 flex gap-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-2.5 font-body text-sm font-medium transition-all cursor-pointer ${t.id === tab
                ? 'bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main>
          {tab === 'history' && (
            <RatingHistoryTab
              key={userId}
              userId={userId}
              onSelectMovie={(title, year) => setSelectedMovie({ title, year })}
            />
          )}
          {tab === 'rate' && (
            <RateMovieTab
              key={userId}
              userId={userId}
              onSelectMovie={(title, year) => setSelectedMovie({ title, year })}
            />
          )}
          {tab === 'recommend' && (
            <RecommendationsTab
              key={userId}
              userId={userId}
              onSelectMovie={(title, year) => setSelectedMovie({ title, year })}
            />
          )}
        </main>

        {/* Modal OMDb */}
        {selectedMovie && (
          <MovieDetailsModal
            title={selectedMovie.title}
            year={selectedMovie.year}
            onClose={() => setSelectedMovie(null)}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-6">
          <p className="font-mono text-xs text-[var(--color-muted)]">
            Viewing as <span className="text-[var(--color-amber)]">{currentUser.name}</span> · User
            #{userId}
          </p>
          <p className="font-mono text-xs text-[var(--color-muted)]">CineMatch v1</p>
        </footer>
      </div>
    </div>
  );
}