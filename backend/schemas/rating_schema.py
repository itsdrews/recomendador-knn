from pydantic import BaseModel, Field
from typing import List, Optional


class AvaliacaoSchema(BaseModel):
    user_id: int = Field(..., gt=0, description="ID do usuário")
    movie_id: int = Field(..., gt=0, description="ID do filme")
    nota: float = Field(..., ge=1.0, le=5.0, description="Nota entre 1.0 e 5.0")

class AvaliacaoResponseSchema(BaseModel):
    message: str
    user_id: int
    movie_id: int
    nota: float
    data_avaliacao: str

class UserHistoryItemSchema(BaseModel):
    movie_id: int
    titulo: str
    nota: float
    data_avaliacao: Optional[str] = None

class UserRatingsResponseSchema(BaseModel):
    user_id: int
    total_avaliacoes: int
    avaliacoes: List[UserHistoryItemSchema]