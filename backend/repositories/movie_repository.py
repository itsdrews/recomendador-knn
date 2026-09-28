from typing import List, Optional
from sqlalchemy.orm import Session
from models.movie_model import MovieModel


class MovieRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, movie_id: int) -> Optional[MovieModel]:
        """Busca um filme pelo ID."""
        return self.db.query(MovieModel).filter(MovieModel.movie_id == movie_id).first()

    def search_by_title(self, query: str, limit: int = 20) -> List[MovieModel]:
        """Busca filmes que contenham o termo no título (case-insensitive)."""
        return (
            self.db.query(MovieModel)
            .filter(MovieModel.title.ilike(f"%{query}%"))
            .limit(limit)
            .all()
        )

    def get_by_ids(self, movie_ids: List[int]) -> List[MovieModel]:
        """Retorna uma lista de filmes correspondentes aos IDs fornecidos."""
        return (
            self.db.query(MovieModel)
            .filter(MovieModel.movie_id.in_(movie_ids))
            .all()
        )