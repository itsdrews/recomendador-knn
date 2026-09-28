import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import get_movie_repository, get_movie_service
from repositories.movie_repository import MovieRepository
from schemas.movie_schema import MovieDetailsResponse, MovieResponse
from services.movie_service import MovieService

router = APIRouter(prefix="/movies", tags=["Movies"])


def parse_title_and_year(full_title: str):
    """Auxiliar para separar o título e o ano."""
    match = re.search(r"^(.*?)\s*\((\d{4})\)$", full_title.strip())
    if match:
        clean_title = match.group(1)
        year = int(match.group(2))
        return clean_title, year
    return full_title, None


# 1. ROTA FIXA: Busca de Filmes na Tabela
@router.get("/search", response_model=List[MovieResponse])
async def search_movies(
    q: str = Query(..., min_length=1, description="Termo de busca pelo título"),
    movie_repo: MovieRepository = Depends(get_movie_repository),
):
    """Busca filmes diretamente na tabela do banco de dados SQLite."""
    filmes = movie_repo.search_by_title(query=q, limit=20)
    
    matches: List[MovieResponse] = []
    for film in filmes:
        clean_title, year = parse_title_and_year(film.title)
        matches.append(
            MovieResponse(
                id=film.movie_id,
                title=clean_title,
                year=year,
                genre=film.genres,
                poster=None,
            )
        )
    return matches


@router.get("/details/{movie_id}", response_model=MovieDetailsResponse)
async def get_movie_details(
    movie_id: int,
    movie_service: MovieService = Depends(get_movie_service),
):
    """Busca os detalhes completos do filme e enriquece com dados da API OMDb."""
    detalhes = await movie_service.get_enriched_movie_details(movie_id)
    
    if not detalhes or detalhes.get("titulo") == "Título Desconhecido":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Filme com ID {movie_id} não encontrado.",
        )
    return detalhes