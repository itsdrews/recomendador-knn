from fastapi import APIRouter, Request, status
from schemas.rating_schema import (
    UserRatingsResponseSchema,
    AvaliacaoSchema,
    AvaliacaoResponseSchema
)
from services.rating_service import RatingService

router = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])

@router.get("/{user_id}", response_model=UserRatingsResponseSchema)
async def obter_avaliacoes(user_id: int, request: Request):
    """Retorna o histórico de avaliações de um usuário."""
    matrix = request.app.state.store["user_item_matrix"]
    movie_titles = request.app.state.store["movie_titles"]
    timestamps_dict = request.app.state.store.get("timestamps_dict", {})
    
    service = RatingService(matrix, movie_titles, timestamps_dict)
    return await service.obter_avaliacoes_usuario(user_id)


@router.post("", response_model=AvaliacaoResponseSchema, status_code=status.HTTP_201_CREATED)
async def avaliar_filme(avaliacao: AvaliacaoSchema, request: Request):
    """Registra uma nova nota de filme no sistema."""
    matrix = request.app.state.store["user_item_matrix"]
    movie_titles = request.app.state.store["movie_titles"]
    timestamps_dict = request.app.state.store.get("timestamps_dict", {})

    service = RatingService(matrix, movie_titles, timestamps_dict)
    return await service.registrar_avaliacao(avaliacao)

@router.get("/{user_id}", response_model=UserRatingsResponseSchema)
async def obter_avaliacoes(user_id: int, request: Request):
    """
    Retorna a lista completa de filmes avaliados por um determinado usuário.
    """
    knn = request.app.state.store["knn"]
    matrix = request.app.state.store["user_item_matrix"]
    movie_titles = request.app.state.store["movie_titles"]
    timestamps_dict = request.app.state.store.get("timestamps_dict",{})

    service = RatingService(knn, matrix, movie_titles,timestamps_dict)
    return await service.obter_avaliacoes_usuario(user_id)