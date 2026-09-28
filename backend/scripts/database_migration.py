import sqlite3
import pandas as pd
from faker import Faker

# Inicializa o Faker configurado para nomes americanos (en_US)
fake = Faker("en_US")

# Conecta ao SQLite
conn = sqlite3.connect("movielens.db")

# -------------------------------------------------------------
# 1/4 Processa os Filmes (movies.dat)
# -------------------------------------------------------------
print("1/4 Convertendo filmes (movies.dat)...")
movies_df = pd.read_csv(
    "../DATA/ml-1m/movies.dat",
    sep="::",
    engine="python",
    header=None,
    names=["movie_id", "title", "genres"],
    encoding="latin-1",
)
movies_df["movie_id"] = movies_df["movie_id"].astype(int)
movies_df.to_sql("movies", conn, if_exists="replace", index=False)


# -------------------------------------------------------------
# 2/4 Processa os Usuários com Nome Aleatório (users.dat)
# -------------------------------------------------------------
print("2/4 Convertendo usuários e gerando nomes americanos...")
users_df = pd.read_csv(
    "../DATA/ml-1m/users.dat",
    sep="::",
    engine="python",
    header=None,
    names=["user_id", "gender", "age", "occupation", "zip_code"],
    encoding="latin-1",
)

users_df["user_id"] = users_df["user_id"].astype(int)
users_df["age"] = users_df["age"].astype(int)
users_df["occupation"] = users_df["occupation"].astype(int)


# Função para gerar o nome baseado no gênero M / F
def generate_name(gender: str) -> str:
    if gender == "M":
        return fake.name_male()
    elif gender == "F":
        return fake.name_female()
    return fake.name()  # Fallback caso haja outro caractere


# Aplica a geração de nomes para cada linha do DataFrame
users_df["name"] = users_df["gender"].apply(generate_name)

# Reordena as colunas para o nome ficar logo após o user_id (opcional)
users_df = users_df[["user_id", "name", "gender", "age", "occupation", "zip_code"]]

# Salva na tabela 'users' no SQLite
users_df.to_sql("users", conn, if_exists="replace", index=False)


# -------------------------------------------------------------
# 3/4 Processa as Avaliações (ratings.dat)
# -------------------------------------------------------------
print("3/4 Convertendo avaliações (ratings.dat)...")
ratings_df = pd.read_csv(
    "../DATA/ml-1m/ratings.dat",
    sep="::",
    engine="python",
    header=None,
    names=["user_id", "movie_id", "rating", "timestamp"],
)

ratings_df["user_id"] = ratings_df["user_id"].astype(int)
ratings_df["movie_id"] = ratings_df["movie_id"].astype(int)
ratings_df["rating"] = ratings_df["rating"].astype(float)
ratings_df["timestamp"] = ratings_df["timestamp"].astype(int)

ratings_df = ratings_df.sort_values(by="timestamp", ascending=True)
ratings_df_clean = ratings_df.drop_duplicates(
    subset=["user_id", "movie_id"], keep="last"
)

ratings_df_clean.to_sql("ratings", conn, if_exists="replace", index=False)


# -------------------------------------------------------------
# 4/4 Cria Índices no SQLite
# -------------------------------------------------------------
print("4/4 Criando índices relacionais no SQLite...")
cursor = conn.cursor()

cursor.execute("CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_ratings_movie ON ratings(movie_id);")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_id ON users(user_id);")

conn.commit()
conn.close()

print("✅ Concluído! A tabela 'users' agora possui a coluna 'name' com nomes americanos adequados ao gênero.")