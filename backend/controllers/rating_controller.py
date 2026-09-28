from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_rating_service
from schemas.rating_schema import (
    AvaliacaoResponseSchema,
    AvaliacaoSchema,
    UserRatingsResponseSchema,
)
from services.rating_service import RatingService

router = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])


@router.get("/{user_id}", response_model=UserRatingsResponseSchema)
async def obter_avaliacoes(
    user_id: int,
    rating_service: RatingService = Depends(get_rating_service),
):
    """Retorna o histórico de avaliações de um usuário registrado no SQLite."""
    try:
        return await rating_service.obter_avaliacoes_usuario(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("", response_model=AvaliacaoResponseSchema, status_code=status.HTTP_201_CREATED)
async def avaliar_filme(
    avaliacao: AvaliacaoSchema,
    rating_service: RatingService = Depends(get_rating_service),
):
    """Registra ou atualiza uma nota de filme e invalida o cache de recomendações."""
    try:
        return await rating_service.registrar_avaliacao(avaliacao)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))