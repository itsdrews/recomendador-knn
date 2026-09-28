from typing import List
from sqlalchemy import delete
from sqlalchemy.orm import Session
from models.recommendation_model import UserRecommendationModel
from models.movie_model import MovieModel


class RecommendationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: int, limit: int = 10) -> List[UserRecommendationModel]:
        """Recupera as recomendações pré-calculadas para o usuário, ordenadas por score."""
        return (
            self.db.query(UserRecommendationModel)
            .filter(UserRecommendationModel.user_id == user_id)
            .order_by(UserRecommendationModel.score.desc())
            .limit(limit)
            .all()
        )

    def save_bulk_recommendations(
        self, user_id: int, recommendations: List[dict], algorithm_type: str = "knn"
    ) -> None:
        """
        Salva uma lista de novas recomendações para o usuário.
        Espera que recommendations seja uma lista de dicts contendo {'movie_id': int, 'score': float}.
        """
        # Limpa o cache anterior para evitar duplicatas
        self.clear_user_recommendations(user_id)

        new_recs = [
            UserRecommendationModel(
                user_id=user_id,
                movie_id=rec["movie_id"],
                score=rec["score"],
                algorithm_type=algorithm_type,
            )
            for rec in recommendations
        ]

        self.db.bulk_save_objects(new_recs)
        self.db.commit()

    def clear_user_recommendations(self, user_id: int) -> None:
        """Invalida/remove as recomendações salvas para um usuário específico (util ao salvar nova nota)."""
        self.db.execute(
            delete(UserRecommendationModel).where(UserRecommendationModel.user_id == user_id)
        )
        self.db.commit()