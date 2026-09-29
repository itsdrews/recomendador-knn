from typing import List, Dict, Any
from repositories.recommendation_repository import RecommendationRepository
from repositories.user_repository import UserRepository
from repositories.rating_repository import RatingRepository
from services.movie_service import MovieService
from schemas.recommendation_schema import (
    MovieRecommendationSchema,
    RecommendationResponseSchema,
)
from schemas.rating_schema import UserHistoryItemSchema
from utils.formatters import format_timestamp


class RecommendationService:
    def __init__(
        self,
        knn_model,
        matrix,
        recommendation_repo: RecommendationRepository,
        user_repo: UserRepository,
        rating_repo: RatingRepository,
        movie_service: MovieService,
    ):
        self.knn = knn_model
        self.matrix = matrix
        self.recommendation_repo = recommendation_repo
        self.user_repo = user_repo
        self.rating_repo = rating_repo
        self.movie_service = movie_service

    async def gerar_recomendacoes(
        self, user_id: int, top_k: int = 5, use_cache: bool = True
    ) -> RecommendationResponseSchema:

        # 1. Validações
        if not self.user_repo.exists(user_id):
            raise ValueError(f"UserID {user_id} não encontrado na base de dados.")

        # 2. Recupera o histórico do usuário
        user_ratings = self.rating_repo.get_user_ratings(user_id)
        historico_usuario = []
        movies_watched = set()

        for r in user_ratings:
            movies_watched.add(r.movie_id)
            movie = self.movie_service.movie_repo.get_by_id(r.movie_id)

            historico_usuario.append(
                UserHistoryItemSchema(
                    movie_id=r.movie_id,
                    titulo=movie.title if movie else "Título Desconhecido",
                    nota=float(r.rating),
                    data_avaliacao=format_timestamp(r.timestamp),
                )
            )

        # 3. Verifica Cache no Banco de Dados
        cached_recs = []

        if use_cache:
            cached_recs = self.recommendation_repo.get_by_user_id(
                user_id, limit=top_k
            )

        top_movie_scores: List[Dict[str, Any]] = []

        if cached_recs:
            for item in cached_recs:
                top_movie_scores.append(
                    {"movie_id": item.movie_id, "score": item.score}
                )

        else:
            # 4. Decide entre Cold Start e KNN
            if not user_ratings:
                top_rated_movies = self.rating_repo.get_top_rated_movies(
                    limit=top_k
                )

                top_movie_scores = [
                    {
                        "movie_id": item.movie_id,
                        "score": float(item.average_rating),
                    }
                    for item in top_rated_movies
                ]

                algorithm_type = "global"

            else:
                top_movie_scores = self._calcular_knn_recommendations(
                    user_id, movies_watched, top_k
                )

                algorithm_type = "knn"

            # Persiste o resultado no banco
            self.recommendation_repo.save_bulk_recommendations(
                user_id=user_id,
                recommendations=top_movie_scores,
                algorithm_type=algorithm_type,
            )

        # 5. Enriquece os dados com OMDb através do MovieService
        recomendacoes = []

        for rec in top_movie_scores:
            m_id = rec["movie_id"]
            detalhes = await self.movie_service.get_enriched_movie_details(m_id)

            recomendacoes.append(
                MovieRecommendationSchema(
                    movie_id=m_id,
                    titulo=detalhes["titulo"],
                    score_recomendacao=round(float(rec["score"]), 2),
                    ano=detalhes["ano"],
                    diretor=detalhes["diretor"],
                    sinopse=detalhes["sinopse"],
                    poster_url=detalhes["poster_url"],
                )
            )

        return RecommendationResponseSchema(
            user_id=user_id,
            total_historico=len(historico_usuario),
            historico_usuario=historico_usuario,
            total_recomendacoes=len(recomendacoes),
            recomendacoes=recomendacoes,
        )

    def _calcular_knn_recommendations(
        self, user_id: int, movies_watched: set, top_k: int
    ) -> List[Dict[str, Any]]:
        """Lógica interna para predição via matriz/KNN."""

        if user_id not in self.matrix.index:
            return []

        user_row_idx = self.matrix.index.get_loc(user_id)
        target_user_vector = self.matrix.values[user_row_idx]

        distances, indices = self.knn.kneighbors(
            target_user_vector, n_neighbors=15
        )

        neighbor_indices = indices[0][1:]
        neighbor_distances = distances[0][1:]

        movie_scores = {}

        for neighbor_idx, dist in zip(neighbor_indices, neighbor_distances):
            similarity = 1.0 - dist
            neighbor_ratings = self.matrix.values[neighbor_idx]

            for col_idx, rating in enumerate(neighbor_ratings):
                movie_id = int(self.matrix.columns[col_idx])

                if rating >= 4.0 and movie_id not in movies_watched:
                    movie_scores[movie_id] = (
                        movie_scores.get(movie_id, 0.0)
                        + rating * similarity
                    )

        sorted_movies = sorted(
            movie_scores,
            key=movie_scores.get,
            reverse=True,
        )[:top_k]

        return [
            {"movie_id": m_id, "score": movie_scores[m_id]}
            for m_id in sorted_movies
        ]