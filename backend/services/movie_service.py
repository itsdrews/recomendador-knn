from typing import Dict, Any, Optional
from repositories.movie_repository import MovieRepository
from services.omdb_service import OMDBService


class MovieService:
    def __init__(self, movie_repo: MovieRepository, omdb_service: Optional[OMDBService] = None):
        self.movie_repo = movie_repo
        self.omdb_service = omdb_service or OMDBService()

    async def get_enriched_movie_details(self, movie_id: int) -> Dict[str, Any]:
        """Busca o filme no banco e enriquece os detalhes com dados da API externa OMDb."""
        movie = self.movie_repo.get_by_id(movie_id)
        if not movie:
            return {
                "movie_id": movie_id,
                "titulo": "Título Desconhecido",
                "ano": "N/A",
                "diretor": "N/A",
                "sinopse": "N/A",
                "poster_url": None,
            }

        detalhes_omdb = await self.omdb_service.buscar_detalhes_filme(movie.title)

        return {
            "movie_id": movie.movie_id,
            "titulo": detalhes_omdb.get("titulo_formatado", movie.title),
            "ano": detalhes_omdb.get("ano", "N/A"),
            "diretor": detalhes_omdb.get("diretor", "N/A"),
            "sinopse": detalhes_omdb.get("sinopse", "N/A"),
            "poster_url": detalhes_omdb.get("poster"),
        }