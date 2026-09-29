import time
from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.rating_model import RatingModel


class RatingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_ratings(self, user_id: int) -> List[RatingModel]:
        """Retorna todas as avaliações registradas por um usuário."""
        return (
            self.db.query(RatingModel)
            .filter(RatingModel.user_id == user_id)
            .order_by(RatingModel.timestamp.desc())
            .all()
        )

    def get_rating_count_by_user(self, user_id: int) -> int:
        """Conta quantas avaliações o usuário possui (util para checar Cold Start)."""
        return (
            self.db.query(RatingModel)
            .filter(RatingModel.user_id == user_id)
            .count()
        )

    def get_top_rated_movies(self, limit: int = 10, min_ratings: int = 100):
        """Retorna os filmes mais bem avaliados globalmente."""
        return (
            self.db.query(
                RatingModel.movie_id,
                func.avg(RatingModel.rating).label("average_rating"),
                func.count(RatingModel.movie_id).label("rating_count"),
            )
            .group_by(RatingModel.movie_id)
            .having(func.count(RatingModel.movie_id) >= min_ratings)
            .order_by(
                func.avg(RatingModel.rating).desc(),
                func.count(RatingModel.movie_id).desc(),
            )
            .limit(limit)
            .all()
        )

    def save_or_update_rating(self, user_id: int, movie_id: int, rating: float) -> RatingModel:
        """Insere uma nova nota ou atualiza uma avaliação existente."""
        existing_rating = (
            self.db.query(RatingModel)
            .filter(
                RatingModel.user_id == user_id,
                RatingModel.movie_id == movie_id,
            )
            .first()
        )

        current_timestamp = int(time.time())

        if existing_rating:
            existing_rating.rating = rating
            existing_rating.timestamp = current_timestamp
            rating_entry = existing_rating
        else:
            rating_entry = RatingModel(
                user_id=user_id,
                movie_id=movie_id,
                rating=rating,
                timestamp=current_timestamp,
            )
            self.db.add(rating_entry)

        self.db.commit()
        self.db.refresh(rating_entry)

        return rating_entry