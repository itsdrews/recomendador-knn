from pydantic import BaseModel
from typing import List,Optional
from schemas.rating_schema import UserHistoryItemSchema

class MovieRecommendationSchema(BaseModel):
    movie_id: int
    titulo: str
    score_recomendacao: float
    ano: str
    diretor: str
    sinopse: str
    poster_url: str

class RecommendationResponseSchema(BaseModel):
    user_id: int
    total_historico: int
    historico_usuario: List[UserHistoryItemSchema]  # <-- Garantir que usa o Schema aqui
    total_recomendacoes: int
    recomendacoes: List[MovieRecommendationSchema] # <-- Garantir que usa o Schema aqui

class UserRatingsResponseSchema(BaseModel):
    user_id: int
    total_avaliacoes: int
    avaliacoes: List[UserHistoryItemSchema]