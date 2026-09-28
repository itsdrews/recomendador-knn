from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class UserCreateSchema(BaseModel):
    user_id: int = Field(..., ge=1, description="ID único do usuário")
    name: Optional[str] = Field(None, description="Nome do usuário")
    gender: str = Field(..., max_length=1, description="Gênero: 'M' ou 'F'")
    age: int = Field(..., ge=1, description="Idade do usuário")
    occupation: int = Field(..., ge=0, description="Código de ocupação (0 a 20)")
    zip_code: str = Field(..., description="CEP do usuário")


class UserResponseSchema(BaseModel):
    user_id: int
    name: Optional[str] = None
    gender: str
    age: int
    occupation: int
    zip_code: str

    model_config = ConfigDict(from_attributes=True)