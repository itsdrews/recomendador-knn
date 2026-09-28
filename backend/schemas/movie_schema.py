from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class MovieResponse(BaseModel):
    id: int = Field(..., alias="movie_id")  # Mapeia 'movie_id' do banco para 'id' no JSON
    title: str
    year: Optional[int] = None
    genre: Optional[str] = Field(None, alias="genres")
    poster: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MovieDetailsResponse(BaseModel):
    movie_id: int
    titulo: str
    ano: Optional[str] = "N/A"
    diretor: Optional[str] = "N/A"
    sinopse: Optional[str] = "N/A"
    poster_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)