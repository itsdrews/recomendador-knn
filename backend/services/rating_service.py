import time
from datetime import datetime
from typing import Dict, Tuple, Optional
from fastapi import HTTPException
from schemas.rating_schema import (
    AvaliacaoSchema,
    AvaliacaoResponseSchema,
    UserHistoryItemSchema,
    UserRatingsResponseSchema
)

class RatingService:
    def __init__(self, matrix, movie_titles, timestamps_dict: Optional[Dict[Tuple[int, int], int]] = None):
        self.matrix = matrix
        self.movie_titles = movie_titles
        self.timestamps_dict = timestamps_dict if timestamps_dict is not None else {}

    def _formatar_timestamp(self, user_id: int, movie_id: int) -> Optional[str]:
        u_id = int(user_id)
        m_id = int(movie_id)

        ts = self.timestamps_dict.get((u_id, m_id))
        if ts is None:
            ts = self.timestamps_dict.get((str(u_id), str(m_id)))

        if ts is not None:
            try:
                return datetime.fromtimestamp(int(ts)).strftime('%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError, OverflowError):
                return None

        return None

    async def obter_avaliacoes_usuario(self, user_id: int) -> UserRatingsResponseSchema:
        if user_id not in self.matrix.index:
            raise HTTPException(
                status_code=404,
                detail=f"UserID {user_id} não encontrado na base de dados."
            )

        user_row_idx = self.matrix.index.get_loc(user_id)
        user_vector = self.matrix.values[user_row_idx]

        avaliacoes = []
        for col_idx, rating in enumerate(user_vector):
            if rating > 0:
                movie_id = int(self.matrix.columns[col_idx])
                titulo = self.movie_titles.get(movie_id, "Título Desconhecido")
                data_fmt = self._formatar_timestamp(user_id, movie_id)
                
                avaliacoes.append(
                    UserHistoryItemSchema(
                        movie_id=movie_id,
                        titulo=titulo,
                        nota=float(rating),
                        data_avaliacao=data_fmt
                    )
                )

        avaliacoes = sorted(
            avaliacoes, 
            key=lambda x: (x.nota, x.data_avaliacao or ""), 
            reverse=True
        )

        return UserRatingsResponseSchema(
            user_id=user_id,
            total_avaliacoes=len(avaliacoes),
            avaliacoes=avaliacoes
        )

    async def registrar_avaliacao(self, avaliacao: AvaliacaoSchema, ratings_file_path: str = "../DATA/ml-1m/ratings.dat") -> AvaliacaoResponseSchema:
        user_id = avaliacao.user_id
        movie_id = avaliacao.movie_id
        nota = avaliacao.nota

        if movie_id not in self.movie_titles:
            raise HTTPException(
                status_code=404,
                detail=f"MovieID {movie_id} não existe no catálogo de filmes."
            )

        timestamp_atual = int(time.time())
        data_formatada = datetime.fromtimestamp(timestamp_atual).strftime('%Y-%m-%d %H:%M:%S')

        # Atualiza matriz e dict em memória
        if movie_id not in self.matrix.columns:
            self.matrix[movie_id] = 0.0

        if user_id not in self.matrix.index:
            self.matrix.loc[user_id] = 0.0

        self.matrix.loc[user_id, movie_id] = nota
        self.timestamps_dict[(user_id, movie_id)] = timestamp_atual

        # Persiste em disco
        linha_dat = f"{user_id}::{movie_id}::{nota}::{timestamp_atual}\n"
        try:
            with open(ratings_file_path, "a", encoding="utf-8") as f:
                f.write(linha_dat)
        except IOError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao persistir avaliação no arquivo: {str(e)}"
            )

        return AvaliacaoResponseSchema(
            message="Avaliação registrada com sucesso!",
            user_id=user_id,
            movie_id=movie_id,
            nota=nota,
            data_avaliacao=data_formatada
        )