// Change this to your backend base URL
const BASE_URL = 'http://localhost:8000';

export interface Movie {
  id: number | string;
  title: string;
  year?: number;
  genre?: string;
  poster?: string;
}

export interface RatingEntry {
  movie: Movie;
  rating: number;
  timestamp?: string;
}

export interface Recommendation {
  movie: Movie;
  score?: number;
  reason?: string;
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
  getRatings: (userId: number): Promise<RatingEntry[]> =>
    request(`/users/${userId}/ratings`),

  rateMovie: (userId: number, movieId: number | string, rating: number): Promise<void> =>
    request(`/users/${userId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ movie_id: movieId, rating }),
    }),

  getRecommendations: (userId: number): Promise<Recommendation[]> =>
    request(`/users/${userId}/recommendations`),

  searchMovies: (query: string): Promise<Movie[]> =>
    request(`/movies/search?q=${encodeURIComponent(query)}`),
};
