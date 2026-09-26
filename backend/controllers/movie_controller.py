from fastapi import APIRouter, Query, HTTPException
from schemas.movie_schema import MovieDetailsResponse
from services.omdb_service import OMDBService 

router = APIRouter(prefix="/movies", tags=["Movies"])

@router.get("/details", response_model=MovieDetailsResponse)
async def get_movie_details(title: str = Query(..., description="Título bruto do filme (ex: Matrix, The (1999))")):
    if not title.strip():
        raise HTTPException(status_code=400, detail="O título do filme não pode estar vazio.")
    
    detalhes = await OMDBService.buscar_detalhes_filme(title)
    return detalhes