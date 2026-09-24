from fastapi import APIRouter, Request
from schemas.recommendation_schema import RecommendationResponseSchema,UserRatingsResponseSchema
from services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recomendar", tags=["Recomendações"])

@router.get("/{user_id}", response_model=RecommendationResponseSchema)
async def recomendar_filmes(user_id: int, request: Request, top_k: int = 5):
    # Recupera os artefatos mantidos no estado global da aplicação
    knn = request.app.state.store["knn"]
    matrix = request.app.state.store["user_item_matrix"]
    movie_titles = request.app.state.store["movie_titles"]
    timestamps_dict = request.app.state.store.get("timestamps_dict", {})
    service = RecommendationService(knn, matrix, movie_titles,timestamps_dict)
    
    return await service.gerar_recomendacoes(user_id, top_k)

