from typing import List, Any
from repositories.rating_repository import RatingRepository
from repositories.movie_repository import MovieRepository
from repositories.user_repository import UserRepository
from repositories.recommendation_repository import RecommendationRepository
from schemas.rating_schema import (
    AvaliacaoSchema,
    AvaliacaoResponseSchema,
    UserHistoryItemSchema,
    UserRatingsResponseSchema,
)
from utils.formatters import format_timestamp


class RatingService:
    def __init__(
        self,
        rating_repo: RatingRepository,
        movie_repo: MovieRepository,
        user_repo: UserRepository,
        recommendation_repo: RecommendationRepository,
    ):
        self.rating_repo = rating_repo
        self.movie_repo = movie_repo
        self.user_repo = user_repo
        self.recommendation_repo = recommendation_repo

    async def obter_avaliacoes_usuario(self, user_id: int) -> UserRatingsResponseSchema:
        if not self.user_repo.exists(user_id):
            raise ValueError(f"UserID {user_id} não encontrado na base de dados.")

        ratings = self.rating_repo.get_user_ratings(user_id)
        avaliacoes = []

        for r in ratings:
            movie = self.movie_repo.get_by_id(r.movie_id)
            titulo = movie.title if movie else "Título Desconhecido"

            avaliacoes.append(
                UserHistoryItemSchema(
                    movie_id=r.movie_id,
                    titulo=titulo,
                    nota=float(r.rating),
                    data_avaliacao=format_timestamp(r.timestamp),
                )
            )

        return UserRatingsResponseSchema(
            user_id=user_id,
            total_avaliacoes=len(avaliacoes),
            avaliacoes=avaliacoes,
        )

    async def registrar_avaliacao(self, avaliacao: AvaliacaoSchema) -> AvaliacaoResponseSchema:
        user_id = avaliacao.user_id
        movie_id = avaliacao.movie_id
        nota = avaliacao.nota

        # 1. Valida existência do filme e do usuário
        if not self.movie_repo.get_by_id(movie_id):
            raise ValueError(f"MovieID {movie_id} não existe no catálogo de filmes.")

        if not self.user_repo.exists(user_id):
            raise ValueError(f"UserID {user_id} não existe na base de dados.")

        # 2. Persiste / Atualiza a avaliação no SQLite
        rating_entry = self.rating_repo.save_or_update_rating(user_id, movie_id, nota)

        # 3. Invalida o cache de recomendações do usuário
        self.recommendation_repo.clear_user_recommendations(user_id)

        return AvaliacaoResponseSchema(
            message="Avaliação registrada com sucesso!",
            user_id=user_id,
            movie_id=movie_id,
            nota=nota,
            data_avaliacao=format_timestamp(rating_entry.timestamp),
        )