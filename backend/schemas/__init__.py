from schemas.movie_schema import MovieResponse, MovieDetailsResponse
from schemas.rating_schema import (
    AvaliacaoSchema,
    AvaliacaoResponseSchema,
    UserHistoryItemSchema,
    UserRatingsResponseSchema,
)
from schemas.recommendation_schema import (
    MovieRecommendationSchema,
    RecommendationResponseSchema,
)
from schemas.user_schema import UserCreateSchema, UserResponseSchema

__all__ = [
    "MovieResponse",
    "MovieDetailsResponse",
    "AvaliacaoSchema",
    "AvaliacaoResponseSchema",
    "UserHistoryItemSchema",
    "UserRatingsResponseSchema",
    "MovieRecommendationSchema",
    "RecommendationResponseSchema",
    "UserCreateSchema",
    "UserResponseSchema",
]