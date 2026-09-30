from fastapi import APIRouter, Depends, HTTPException, status, Query
from dependencies import get_recommendation_service
from schemas.recommendation_schema import RecommendationResponseSchema
from services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recomendar", tags=["Recomendações"])




@router.get("/{user_id}", response_model=RecommendationResponseSchema)
async def recomendar_filmes(
    user_id: int,
    top_k: int = Query(default=5, ge=1, le=50, description="Quantidade de recomendações por métrica"),
    use_cache: bool = Query(default=True, description="Usar cache do banco de dados"),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
):
    """
    Gera ou recupera recomendações para o usuário comparando as métricas Cosine e Pearson.
    """
    try:
        return await recommendation_service.gerar_recomendacoes(
            user_id=user_id, top_k=top_k, use_cache=use_cache
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))