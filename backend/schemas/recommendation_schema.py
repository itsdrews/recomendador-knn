from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from schemas.rating_schema import UserHistoryItemSchema

class MovieRecommendationSchema(BaseModel):
    movie_id: int
    titulo: str
    score_recomendacao: float
    ano: Optional[str] = "N/A"
    diretor: Optional[str] = "N/A"
    sinopse: Optional[str] = "N/A"
    poster_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponseSchema(BaseModel):
    user_id: int
    total_historico: int
    historico_usuario: List[UserHistoryItemSchema]
    
    # Recomendações divididas por métrica
    recomendacoes_cosine: List[MovieRecommendationSchema]
    recomendacoes_pearson: List[MovieRecommendationSchema]
    
    total_recomendacoes_cosine: int
    total_recomendacoes_pearson: int

    model_config = ConfigDict(from_attributes=True)