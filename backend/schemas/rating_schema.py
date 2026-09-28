from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


# Request DTO (Para a rota POST /avaliacoes)
class AvaliacaoSchema(BaseModel):
    user_id: int = Field(..., ge=1, description="ID do usuário")
    movie_id: int = Field(..., ge=1, description="ID do filme")
    nota: float = Field(..., ge=0.5, le=5.0, description="Nota dada ao filme (0.5 a 5.0)")


# Response DTO (Resposta do POST /avaliacoes)
class AvaliacaoResponseSchema(BaseModel):
    message: str
    user_id: int
    movie_id: int
    nota: float
    data_avaliacao: Optional[str] = None


# Item individual do histórico do usuário
class UserHistoryItemSchema(BaseModel):
    movie_id: int
    titulo: str
    nota: float
    data_avaliacao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Response DTO (Para a rota GET /avaliacoes/{user_id})
class UserRatingsResponseSchema(BaseModel):
    user_id: int
    total_avaliacoes: int
    avaliacoes: List[UserHistoryItemSchema]

    model_config = ConfigDict(from_attributes=True)