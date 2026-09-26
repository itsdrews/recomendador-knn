const BASE_URL = 'http://localhost:8000';

export interface UserHistoryItem {
  movie_id: number;
  titulo: string;
  nota: number;
  data_avaliacao?: string | null;
}

export interface UserRatingsResponse {
  user_id: number;
  total_avaliacoes: number;
  avaliacoes: UserHistoryItem[];
}

export interface Movie {
  id: number | string;
  title: string;
  year?: number;
  genre?: string;
  poster?: string;
}

export interface MovieDetails {
  titulo_formatado: string;
  poster: string;
  sinopse: string;
  ano: string;
  diretor: string;
}

export interface RatingEntry {
  movie: Movie;
  rating: number;
  timestamp?: string;
}

export interface MovieRecommendation {
  movie_id: number;
  titulo: string;
  score_recomendacao: number;
  ano: string;
  diretor: string;
  sinopse: string;
  poster_url: string;
}

export interface RecommendationResponse {
  user_id: number;
  total_historico: number;
  total_recomendacoes: number;
  recomendacoes: MovieRecommendation[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  getRatings: async (userId: number): Promise<RatingEntry[]> => {
    const data = await request<UserRatingsResponse>(`/avaliacoes/${userId}`);
    return data.avaliacoes.map((item) => ({
      movie: {
        id: item.movie_id,
        title: item.titulo,
      },
      rating: item.nota,
      timestamp: item.data_avaliacao || undefined,
    }));
  },

  rateMovie: (userId: number, movieId: number | string, rating: number): Promise<void> =>
    request(`/avaliacoes`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        movie_id: Number(movieId),
        nota: rating,
      }),
    }),

  getRecommendations: async (userId: number): Promise<MovieRecommendation[]> => {
    // CORRIGIDO: Agora usa a função request para incluir o BASE_URL e barras corretas
    const data = await request<RecommendationResponse>(`/recomendar/${userId}`);
    return data.recomendacoes;
  },

  searchMovies: async (query: string): Promise<Movie[]> => {
    const results = await request<any[]>(`/movies/search?q=${encodeURIComponent(query)}`);
    return results.map((m) => ({
      id: m.id ?? m.movie_id,
      title: m.title ?? m.titulo ?? 'Título desconhecido',
      year: m.year ?? m.ano,
      genre: m.genre ?? m.genero,
      poster: m.poster,
    }));
  },

  getMovieDetails: (title: string): Promise<MovieDetails> =>
    request<MovieDetails>(`/movies/details?title=${encodeURIComponent(title)}`),
};