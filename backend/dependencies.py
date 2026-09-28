from fastapi import Depends,Request
from sqlalchemy.orm import Session
from database import get_db

# Repositories
from repositories.user_repository import UserRepository
from repositories.movie_repository import MovieRepository
from repositories.rating_repository import RatingRepository
from repositories.recommendation_repository import RecommendationRepository

# Services
from services.movie_service import MovieService
from services.rating_service import RatingService
from services.recommendation_service import RecommendationService
from services.user_service import UserService


def get_movie_repository(db: Session = Depends(get_db)) -> MovieRepository:
    return MovieRepository(db)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_rating_repository(db: Session = Depends(get_db)) -> RatingRepository:
    return RatingRepository(db)


def get_recommendation_repository(db: Session = Depends(get_db)) -> RecommendationRepository:
    return RecommendationRepository(db)


def get_movie_service(
    movie_repo: MovieRepository = Depends(get_movie_repository),
) -> MovieService:
    return MovieService(movie_repo=movie_repo)


def get_rating_service(
    rating_repo: RatingRepository = Depends(get_rating_repository),
    movie_repo: MovieRepository = Depends(get_movie_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    recommendation_repo: RecommendationRepository = Depends(get_recommendation_repository),
) -> RatingService:
    return RatingService(
        rating_repo=rating_repo,
        movie_repo=movie_repo,
        user_repo=user_repo,
        recommendation_repo=recommendation_repo,
    )


def get_recommendation_service(
    request:Request,
    recommendation_repo: RecommendationRepository = Depends(get_recommendation_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    rating_repo: RatingRepository = Depends(get_rating_repository),
    movie_service: MovieService = Depends(get_movie_service),
) -> RecommendationService:
    # Mantém o modelo e a matriz em memória apenas para o cálculo estatístico do KNN
    knn = request.app.state.store["knn"]
    matrix = request.app.state.store["user_item_matrix"]

    return RecommendationService(
        knn_model=knn,
        matrix=matrix,
        recommendation_repo=recommendation_repo,
        user_repo=user_repo,
        rating_repo=rating_repo,
        movie_service=movie_service,
    )

def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository),
) -> UserService:
    return UserService(user_repo=user_repo)