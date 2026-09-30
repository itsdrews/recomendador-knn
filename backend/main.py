from contextlib import asynccontextmanager
import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from controllers import (
    movie_router,
    rating_router,
    recommendation_router,
    user_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Garante que as tabelas existem no SQLite
    Base.metadata.create_all(bind=engine)

    # 2. Carrega o modelo de Machine Learning treinado
    knn_model = joblib.load("modelo_knn_users.pkl")
    knn_pearson = joblib.load("knn_pearson.pkl")

    # 3. Monta a matriz Usuário-Item consultando a tabela 'ratings' do SQLite
    query = "SELECT user_id, movie_id, rating FROM ratings"
    ratings_df = pd.read_sql(query, con=engine)

    if not ratings_df.empty:
        # Pivot das avaliações para construir a matriz
        user_item_matrix = ratings_df.pivot(
            index="user_id", columns="movie_id", values="rating"
        ).fillna(0.0)
    else:
        # Matriz vazia de fallback caso o banco esteja limpo
        user_item_matrix = pd.DataFrame()

    # 4. Mantém no app.state apenas os artefatos estritamente necessários para o algoritmo KNN
    app.state.store = {
        "knn": knn_model,
        "user_item_matrix": user_item_matrix,
        "knn_pearson":knn_pearson
    }

    print("🚀 Aplicação inicializada: Tabelas verificadas e modelo KNN carregado no app.state.store")

    yield

    # Limpeza de recursos no encerramento da API
    app.state.store.clear()


app = FastAPI(
    title="API de Recomendação de Filmes (MovieLens + OMDb)",
    version="2.0.0",
    lifespan=lifespan,
)

# Configuração de CORS para permitir requisições do Frontend
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro dos Routers/Controllers
app.include_router(user_router)
app.include_router(movie_router)
app.include_router(rating_router)
app.include_router(recommendation_router)