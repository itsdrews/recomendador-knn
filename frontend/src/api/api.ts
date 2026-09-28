const BASE_URL = 'http://localhost:8000';


export interface User {
  user_id: number;
  name?: string;
  gender: 'M' | 'F' | 'O';
  age: number;
  occupation: number;
  zip_code: string;
}

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
  id: number;
  title: string;
  year?: number | string | null;
  genre?: string | null;
  poster?: string | null;
}

// Resposta crua do Backend para Detalhes do Filme
export interface BackendMovieDetailsResponse {
  movie_id: number;
  titulo: string;
  ano?: string | null;
  diretor?: string | null;
  sinopse?: string | null;
  poster_url?: string | null;
}

// Interface que o componente React consome
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
  ano?: string | null;
  diretor?: string | null;
  sinopse?: string | null;
  poster_url?: string | null;
}

export interface RecommendationResponse {
  user_id: number;
  total_historico: number;
  historico_usuario: UserHistoryItem[]; // 📌 CORRIGIDO: Adicionado campo exigido pelo backend
  total_recomendacoes: number;
  recomendacoes: MovieRecommendation[];
}

// ==========================================
// FUNÇÃO BASE DE REQUISIÇÃO
// ==========================================

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

// ==========================================
// MÉTODOS DA API
// ==========================================

export const api = {
  // 1. Obter Avaliações de um Usuário
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

  // 2. Avaliar um Filme
  rateMovie: (userId: number, movieId: number | string, rating: number): Promise<void> =>
    request(`/avaliacoes`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: Number(userId),
        movie_id: Number(movieId),
        nota: Number(rating),
      }),
    }),

  // 3. Obter Recomendações
  getRecommendations: async (userId: number): Promise<MovieRecommendation[]> => {
    const data = await request<RecommendationResponse>(`/recomendar/${userId}`);
    return data.recomendacoes;
  },

  // 4. Buscar Filmes por Título
  searchMovies: async (query: string): Promise<Movie[]> => {
    if (!query.trim()) return [];

    const results = await request<any[]>(`/movies/search?q=${encodeURIComponent(query)}`);
    return results.map((m) => ({
      id: m.id ?? m.movie_id,
      title: m.title ?? m.titulo ?? 'Título desconhecido',
      year: m.year ?? m.ano,
      genre: m.genre ?? m.genero ?? m.genres,
      poster: m.poster ?? m.poster_url,
    }));
  },

  getMovieDetails: async (movieId: number | string): Promise<MovieDetails> => {
    // Garante que o ID seja numérico para formar a URL do endpoint dinâmico
    console.log("movieId: ", movieId)
    const id = Number(movieId);
    if (isNaN(id)) {
      throw new Error("ID do filme inválido.");
    }

    const rawData = await request<BackendMovieDetailsResponse>(`/movies/details/${id}`);

    // Mapeia a resposta do Backend para o formato consumido pelos componentes React
    return {
      titulo_formatado: rawData.titulo ?? 'Título indisponível',
      poster: rawData.poster_url ?? '',
      sinopse: rawData.sinopse ?? 'Sem sinopse disponível.',
      ano: rawData.ano ?? 'N/A',
      diretor: rawData.diretor ?? 'N/A',
    };
  },

  async getUserById(userId: number): Promise<User> {
    const response = await fetch(`${BASE_URL}/users/${userId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Usuário não encontrado.');
      }
      throw new Error('Falha ao buscar dados do usuário.');
    }
    return response.json();
  },

  async createRandomUser(): Promise<User> {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao criar usuário aleatório no servidor.');
    }

    return response.json();
  },
};