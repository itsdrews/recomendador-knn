from pydantic import BaseModel, Field
from typing import Optional

class MovieDetailsResponse(BaseModel):
    titulo_formatado: str = Field(..., example="The Matrix")
    poster: str = Field(..., example="https://m.media-amazon.com/images/...")
    sinopse: str = Field(..., example="A computer hacker learns from mysterious rebels...")
    ano: str = Field(..., example="1999")
    diretor: str = Field(..., example="Lana Wachowski, Lilly Wachowski")

class MovieResponse(BaseModel):
    id: int
    title: str
    year: Optional[int] = None
    genre: Optional[str] = None
