import { useState, useEffect, useRef, useCallback } from 'react';
import type { RatingEntry, Recommendation, Movie, MovieDetails } from './api/api';
import { api } from './api/api';

const USERS = [
  { id: 1, name: 'Alex M.', avatar: 'AM' },
  { id: 2, name: 'Jordan K.', avatar: 'JK' },
  { id: 3, name: 'Sam R.', avatar: 'SR' },
  { id: 4, name: 'Taylor B.', avatar: 'TB' },
  { id: 5, name: 'Morgan L.', avatar: 'ML' },
];

type Tab = 'history' | 'rate' | 'recommend';


// Modal de Detalhes do Filme (OMDb)
function MovieDetailsModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getMovieDetails(title)
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
  }, [title]);

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

  // Lógica da Paginação
  const totalPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEntries = entries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
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
                <div className="mt-0.5 flex items-center gap-3">
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

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-foreground)] transition-opacity disabled:opacity-30 hover:border-[var(--color-amber)]"
          >
            ← Anterior
          </button>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            Página {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1 font-mono text-xs text-[var(--color-foreground)] transition-opacity disabled:opacity-30 hover:border-[var(--color-amber)]"
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
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetch = () => {
    setLoading(true);
    setError(null);
    api
      .getRecommendations(userId)
      .then((r) => {
        setRecs(r);
        setFetched(true);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setRecs([]);
    setFetched(false);
    setError(null);
  }, [userId]);

  if (!fetched && !loading)
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20">
        <p className="font-display text-xl italic text-[var(--color-foreground)]">
          Ready for your next watch?
        </p>
        <button
          onClick={fetch}
          className="rounded-xl bg-[var(--color-amber)] px-8 py-3 font-body text-sm font-semibold text-[#0a0a0e] transition-all hover:scale-[1.02] hover:opacity-90 active:scale-[0.98] cursor-pointer"
        >
          Get Recommendations
        </button>
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono text-sm text-[var(--color-muted)] animate-pulse">
          Crunching the algorithm…
        </span>
      </div>
    );

  if (error)
    return (
      <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
        <p className="font-mono text-sm text-[var(--color-red-rate)]">{error}</p>
        <button onClick={fetch} className="font-mono text-xs text-[var(--color-amber)] underline">
          Try again
        </button>
      </div>
    );

  if (!recs.length)
    return (
      <div className="py-16 text-center text-[var(--color-muted)]">
        <p className="font-display italic">No recommendations available yet.</p>
        <p className="mt-1 text-sm">Rate more movies to improve results.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          {recs.length} recommendation{recs.length !== 1 ? 's' : ''} for you
        </p>
        <button
          onClick={fetch}
          className="font-mono text-xs text-[var(--color-amber)] hover:underline cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {recs.map((rec, i) => (
          <div
            key={`${rec.movie.id}-${i}`}
            onClick={() => onSelectMovie(rec.movie.title, rec.movie.year?.toString())}
            className="relative cursor-pointer overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card)] p-5 transition-colors hover:border-[var(--color-amber)] hover:bg-[var(--color-card-hover)]"
          >
            <div className="absolute right-4 top-4 font-mono text-xs text-[var(--color-muted)]">
              #{i + 1}
            </div>
            <p className="pr-6 font-display text-base font-semibold leading-snug text-[var(--color-foreground)]">
              {rec.movie.title}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              {rec.movie.year && (
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  {rec.movie.year}
                </span>
              )}
              {rec.movie.genre && (
                <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]">
                  {rec.movie.genre}
                </span>
              )}
              {rec.score !== undefined && (
                <span className="ml-auto font-mono text-xs text-[var(--color-amber)]">
                  {(rec.score * 100).toFixed(0)}% match
                </span>
              )}
            </div>
            {rec.reason && (
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">{rec.reason}</p>
            )}
          </div>
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

  const currentUser = USERS.find((u) => u.id === userId)!;

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
            //year={selectedMovie.year}
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