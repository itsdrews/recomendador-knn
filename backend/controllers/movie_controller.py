from fastapi import APIRouter, Query, HTTPException,Request
from typing import Optional,List
from schemas.movie_schema import MovieDetailsResponse,MovieResponse
from services.omdb_service import OMDBService 
import re

router = APIRouter(prefix="/movies", tags=["Movies"])

def parse_title_and_year(full_title: str):
    """
    Função auxiliar para separar o título e o ano.
    Exemplo: "Toy Story (1995)" -> ("Toy Story", 1995)
    """
    match = re.search(r"^(.*?)\s*\((\d{4})\)$", full_title.strip())
    if match:
        clean_title = match.group(1)
        year = int(match.group(2))
        return clean_title, year

@router.get("/details", response_model=MovieDetailsResponse)
async def get_movie_details(title: str = Query(..., description="Título bruto do filme (ex: Matrix, The (1999))")):
    if not title.strip():
        raise HTTPException(status_code=400, detail="O título do filme não pode estar vazio.")
    
    detalhes = await OMDBService.buscar_detalhes_filme(title)
    return detalhes



    return full_title, None

@router.get("/search", response_model=List[MovieResponse])
async def search_movies(
    request: Request,
    q: str = Query(..., min_length=1, description="Termo de busca pelo título"),
):
    """
    Busca filmes por termo dentro do `movie_titles` armazenado em `app.state.store`.
    """
    # 1. Recupera o dicionário/Series de títulos da memória do app.state
    movie_titles = request.app.state.store.get("movie_titles")

    if movie_titles is None:
        raise HTTPException(
            status_code=500,
            detail="O mapa de títulos de filmes (movie_titles) não está carregado no servidor.",
        )

    q_lower = q.lower()
    matches: List[MovieResponse] = []

    # 2. Adapta a iteração dependendo da estrutura gravada no .pkl (dict/pd.Series)
    items = (
        movie_titles.items()
        if hasattr(movie_titles, "items")
        else enumerate(movie_titles)
    )

    for movie_id, full_title in items:
        title_str = str(full_title)

        # Filtra sem diferenciar maiúsculas/minúsculas
        if q_lower in title_str.lower():
            clean_title, year = parse_title_and_year(title_str)

            matches.append(
                MovieResponse(
                    id=int(movie_id),
                    title=clean_title,
                    year=year,
                    genre=None,  # 'movie_titles.pkl' contém apenas títulos; gênero é omitido aqui
                    poster=None,
                )
            )

        # Limita aos primeiros 20 resultados para evitar payloads desnecessários
        if len(matches) >= 20:
            break

    return matches