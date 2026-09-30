from typing import List
from sqlalchemy import delete
from sqlalchemy.orm import Session
from models.recommendation_model import UserRecommendationModel


class RecommendationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(
        self, user_id: int, limit: int = 10, algorithm_type: str = "knn_cosine"
    ) -> List[UserRecommendationModel]:
        """Recupera as recomendações do usuário filtradas estritamente pelo algoritmo/métrica."""
        return (
            self.db.query(UserRecommendationModel)
            .filter(
                UserRecommendationModel.user_id == user_id,
                UserRecommendationModel.algorithm_type == algorithm_type,
            )
            .order_by(UserRecommendationModel.score.desc())
            .limit(limit)
            .all()
        )

    def save_bulk_recommendations(
        self, user_id: int, recommendations: List[dict], algorithm_type: str = "knn_cosine"
    ) -> None:
        """
        Salva uma lista de novas recomendações para o algoritmo especificado.
        Remove apenas o cache antigo do MESMO algoritmo.
        """
        # Limpa somente o cache daquele algoritmo/métrica
        self.clear_user_recommendations(user_id, algorithm_type=algorithm_type)

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

    def clear_user_recommendations(
        self, user_id: int, algorithm_type: str = None
    ) -> None:
        """Invalida as recomendações. Se algorithm_type for informado, apaga apenas as daquele algoritmo."""
        stmt = delete(UserRecommendationModel).where(
            UserRecommendationModel.user_id == user_id
        )

        if algorithm_type:
            stmt = stmt.where(UserRecommendationModel.algorithm_type == algorithm_type)

        self.db.execute(stmt)
        self.db.commit()