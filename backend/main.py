from contextlib import asynccontextmanager
from fastapi import FastAPI
import joblib
from controllers.recommendation_controller import router as recommendation_router
from controllers.rating_controller import router as rating_router
import pandas as pd

@asynccontextmanager
async def lifespan(app: FastAPI):

    #  Carrega apenas o KNN e os Títulos via .pkl (que não mudam com frequência)
    knn_model = joblib.load("modelo_knn_users.pkl")
    movie_titles = joblib.load("movie_titles.pkl")

    #  Lê o ratings.dat (incluindo todas as notas gravadas via POST /avaliar)
    ratings_df = pd.read_csv(
        '../DATA/ml-1m/ratings.dat',
        sep='::',
        engine='python',
        header=None,
        names=['user_id', 'movie_id', 'rating', 'timestamp']
    )

    # Garante os tipos corretos
    ratings_df['user_id'] = ratings_df['user_id'].astype(int)
    ratings_df['movie_id'] = ratings_df['movie_id'].astype(int)
    ratings_df['rating'] = ratings_df['rating'].astype(float)
    ratings_df['timestamp'] = ratings_df['timestamp'].astype(int)

    #  Ordena e remove duplicatas mantendo SEMPRE a avaliação mais recente (keep='last')
    ratings_df = ratings_df.sort_values(by='timestamp', ascending=True)
    ratings_df_clean = ratings_df.drop_duplicates(subset=['user_id', 'movie_id'], keep='last')

    #  Reconstrói a matriz Usuário-Item na memória
    user_item_matrix = ratings_df_clean.pivot(
        index='user_id',
        columns='movie_id',
        values='rating'
    ).fillna(0.0)

    #  Reconstrói o dicionário de timestamps na memória
    timestamps_dict = {
        (int(row.user_id), int(row.movie_id)): int(row.timestamp)
        for row in ratings_df_clean.itertuples(index=False)
    }
    
    app.state.store = {
        "knn": knn_model,
        "movie_titles": movie_titles,
        "user_item_matrix": user_item_matrix,
        "timestamps_dict": timestamps_dict
    }

    print("Artefatos e base de avaliações prontos no app.state.store")
    yield
    app.state.store.clear()

app = FastAPI(title="API de Recomendação de Filmes (MovieLens + OMDb)", lifespan=lifespan)

# Registra os roteadores
app.include_router(recommendation_router)
app.include_router(rating_router)
