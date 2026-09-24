from fastapi import HTTPException
from typing import Optional,Dict,Tuple
from datetime import datetime
from schemas.recommendation_schema import (
    MovieRecommendationSchema,
    UserHistoryItemSchema,
    RecommendationResponseSchema,
    UserRatingsResponseSchema
)
from services.omdb_service import OMDBService

class RecommendationService:
    def __init__(self, knn, matrix, movie_titles,timestamps_dict: Optional[Dict[Tuple[int, int], int]] = None):
        self.knn = knn
        self.matrix = matrix
        self.movie_titles = movie_titles
        self.timestamps_dict = timestamps_dict or {}

    def _formatar_timestamp(self, user_id: int, movie_id: int) -> Optional[str]:
        """Auxiliar para buscar o timestamp e converter para 'YYYY-MM-DD HH:MM:SS'."""
        ts = self.timestamps_dict.get((user_id, movie_id))
        if ts:
            return datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
        return None

    async def gerar_recomendacoes(self, user_id: int, top_k: int = 5) -> RecommendationResponseSchema:
        # 1. Valida se o usuário existe na matriz
        if user_id not in self.matrix.index:
            raise HTTPException(
                status_code=404,
                detail=f"UserID {user_id} não encontrado na base de dados."
            )
        
        # 2. Localiza a linha e o vetor do usuário alvo
        user_row_idx = self.matrix.index.get_loc(user_id)
        target_user_vector = self.matrix.values[user_row_idx]

        # 3. Extrai o HISTÓRICO do usuário (filmes onde nota > 0)
        historico_usuario = []
        movies_watched_by_target = set()

        for col_idx, rating in enumerate(target_user_vector):
            if rating > 0:
                movie_id = int(self.matrix.columns[col_idx])
                movies_watched_by_target.add(movie_id)
                titulo = self.movie_titles.get(movie_id, "Título Desconhecido")
                data_fmt = self._formatar_timestamp(user_id, movie_id)

                
                historico_usuario.append(
                    UserHistoryItemSchema(
                        movie_id=movie_id,
                        titulo=titulo,
                        nota=float(rating),
                        data_avaliacao=data_fmt
                    )
                )

        # Ordena o histórico pelas maiores notas que o próprio usuário deu
        historico_usuario = sorted(historico_usuario, key=lambda x: x.nota, reverse=True)

        # Busca os vizinhos mais próximos via KNN (15 para boa variedade)
        distances, indices = self.knn.kneighbors(target_user_vector, n_neighbors=15)
        neighbor_indices = indices[0][1:]
        neighbor_distances = distances[0][1:]

        movie_scores = {}

        # Calcula as recomendações descartando filmes em movies_watched_by_target
        for neighbor_idx, dist in zip(neighbor_indices, neighbor_distances):
            similarity = 1.0 - dist
            neighbor_ratings = self.matrix.values[neighbor_idx]

            for col_idx, rating in enumerate(neighbor_ratings):
                movie_id = int(self.matrix.columns[col_idx])
                
                # Apenas filmes não avaliados pelo alvo e que o vizinho gostou (nota >= 4.0)
                if rating >= 4.0 and movie_id not in movies_watched_by_target:
                    if movie_id not in movie_scores:
                        movie_scores[movie_id] = 0.0
                    movie_scores[movie_id] += rating * similarity

        top_movie_ids = sorted(movie_scores, key=movie_scores.get, reverse=True)[:top_k]

        # Enriquece as novas recomendações com OMDb
        recomendacoes = []
        for movie_id in top_movie_ids:
            titulo = self.movie_titles.get(movie_id, "Título Desconhecido")
            detalhes = await OMDBService.buscar_detalhes_filme(titulo)
            
            recomendacoes.append(
                MovieRecommendationSchema(
                    movie_id=movie_id,
                    titulo=detalhes.get("titulo_formatado", titulo),
                    score_recomendacao=round(float(movie_scores[movie_id]), 2),
                    ano=detalhes["ano"],
                    diretor=detalhes["diretor"],
                    sinopse=detalhes["sinopse"],
                    poster_url=detalhes["poster"]
                )
            )

        return RecommendationResponseSchema(
            user_id=user_id,
            total_historico=len(historico_usuario),
            historico_usuario=historico_usuario,
            total_recomendacoes=len(recomendacoes),
            recomendacoes=recomendacoes
        )