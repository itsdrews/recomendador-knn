from controllers.movie_controller import router as movie_router
from controllers.rating_controller import router as rating_router
from controllers.recommendation_controller import router as recommendation_router
from controllers.user_controller import router as user_router

__all__ = ["movie_router", "rating_router", "recommendation_router","user_router"]