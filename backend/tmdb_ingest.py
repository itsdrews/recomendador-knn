import os
import re
import time
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import TypedDict, Optional, List, Tuple
import requests
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configurações de Caminho e API
# ---------------------------------------------------------------------------
# Garante que o arquivo .db seja localizado na mesma pasta do script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "movielens.db") 
load_dotenv(os.path.join(BASE_DIR, ".env"))
TMDB_API_KEY = os.getenv("TMDB_API_KEY")  # <--- Carrega o arquivo .env da mesma pasta
TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

# Controle de taxa: 10 workers paralelos mantêm as requisições na margem segura do TMDB
MAX_WORKERS = 10


# ---------------------------------------------------------------------------
# Interface de Dados
# ---------------------------------------------------------------------------
class MovieDetails(TypedDict):
    movie_id: int
    titulo: str
    ano: Optional[str]
    diretor: Optional[str]
    sinopse: Optional[str]
    poster_url: Optional[str]


# ---------------------------------------------------------------------------
# 1. Gerenciamento de Conexão com o SQLite
# ---------------------------------------------------------------------------
def get_db_connection():
    """Abre a conexão com o banco SQLite local e ativa o suporte a Chaves Estrangeiras (FK)."""
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Cria a tabela 'movie_details' conectada à tabela 'movies' via Chave Estrangeira."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS movie_details (
                movie_id INTEGER PRIMARY KEY,
                titulo TEXT NOT NULL,
                ano TEXT,
                diretor TEXT,
                sinopse TEXT,
                poster_url TEXT,
                FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
            );
        """)
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# 2. Limpeza e Formatação do Título (Padrão MovieLens)
# ---------------------------------------------------------------------------
def limpar_titulo_movielens(raw_title: str) -> Tuple[str, Optional[str]]:
    """
    Formata títulos do MovieLens removendo o ano final e corrigindo artigos.
    Exemplos:
      - 'Toy Story (1995)'   -> ('Toy Story', '1995')
      - 'Matrix, The (1999)' -> ('The Matrix', '1999')
    """
    title_clean = raw_title.strip()
    year = None

    # Extrai o ano entre parênteses no final da string: (YYYY)
    match = re.search(r'\s*\((\d{4})\)\s*$', title_clean)
    if match:
        year = match.group(1)
        title_clean = title_clean[:match.start()].strip()

    # Move artigos no final do título para o início ("Matrix, The" -> "The Matrix")
    if ',' in title_clean:
        parts = title_clean.rsplit(',', 1)
        article = parts[1].strip()
        if article.lower() in ['the', 'a', 'an', 'o', 'a', 'os', 'as']:
            title_clean = f"{article} {parts[0].strip()}"

    return title_clean, year


# ---------------------------------------------------------------------------
# 3. Consumo da API TMDB com Respeito ao Rate Limit
# ---------------------------------------------------------------------------
def process_movie(movie_id: int, raw_title: str, retries: int = 3) -> Optional[MovieDetails]:
    """
    Busca o filme no TMDB, exibindo mensagens de erro claras caso a API falhe.
    """
    # Garante que a API Key foi configurada
    if TMDB_API_KEY == "SUA_API_KEY_AQUI" or not TMDB_API_KEY:
        print("❌ ERRO CRÍTICO: Você precisa configurar sua TMDB_API_KEY no script!")
        return None

    titulo_limpo, ano_extraido = limpar_titulo_movielens(raw_title)

    search_url = f"{TMDB_BASE_URL}/search/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "query": titulo_limpo,
        "language": "pt-BR"
    }
    if ano_extraido:
        params["primary_release_year"] = ano_extraido

    try:
        response = requests.get(search_url, params=params, timeout=10)

        # 1. Trata API Key inválida ou não autorizada
        if response.status_code == 401:
            print(f"❌ ERRO [HTTP 401]: Sua API Key do TMDB é inválida. Verifique a variável TMDB_API_KEY.")
            return None

        # 2. Trata Rate Limit (HTTP 429) do TMDB
        if response.status_code == 429 and retries > 0:
            retry_after = int(response.headers.get("Retry-After", 2))
            print(f"⏳ [429 Rate Limit] Aguardando {retry_after}s para o filme ID {movie_id}...")
            time.sleep(retry_after)
            return process_movie(movie_id, raw_title, retries - 1)

        if response.status_code != 200:
            print(f"⚠️ Erro HTTP {response.status_code} ao buscar '{titulo_limpo}'")
            return None

        results = response.json().get("results", [])

        # Segunda tentativa: busca sem o filtro de ano caso a primeira consulta não encontre
        if not results and "primary_release_year" in params:
            del params["primary_release_year"]
            resp_retry = requests.get(search_url, params=params, timeout=10)
            results = resp_retry.json().get("results", []) if resp_retry.status_code == 200 else []

        if not results:
            print(f"⚠️ TMDB não encontrou nenhum filme para o título: '{raw_title}' (limpo: '{titulo_limpo}')")
            return None

        # Pega o primeiro e mais relevante resultado do TMDB
        tmdb_movie = results[0]
        tmdb_id = tmdb_movie["id"]

        # Busca detalhes complementares para obter o Diretor
        details_url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
        details_params = {
            "api_key": TMDB_API_KEY,
            "language": "pt-BR",
            "append_to_response": "credits"
        }
        details_resp = requests.get(details_url, params=details_params, timeout=10)

        if details_resp.status_code != 200:
            return None

        details_data = details_resp.json()

        crew = details_data.get("credits", {}).get("crew", [])
        diretor = next((m["name"] for m in crew if m.get("job") == "Director"), None)

        release_date = details_data.get("release_date", "")
        ano_final = release_date[:4] if release_date else ano_extraido

        poster_path = details_data.get("poster_path")
        poster_url = f"{IMAGE_BASE_URL}{poster_path}" if poster_path else None

        return {
            "movie_id": movie_id,
            "titulo": details_data.get("title") or titulo_limpo,
            "ano": ano_final,
            "diretor": diretor,
            "sinopse": details_data.get("overview") or None,
            "poster_url": poster_url
        }

    except requests.RequestException as e:
        print(f"❌ Erro de rede/conexão no filme ID {movie_id}: {e}")
        return None
# ---------------------------------------------------------------------------
# 4. Leitura e Escrita no Banco de Dados
# ---------------------------------------------------------------------------
def get_movies_from_db() -> List[Tuple[int, str]]:
    """Lê os IDs e títulos cadastrados na tabela 'movies'."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT movie_id, title FROM movies")
        return cursor.fetchall()
    finally:
        conn.close()


def save_movie_details_batch(batch: List[MovieDetails]):
    """Salva/Atualiza em lote na tabela 'movie_details' usando INSERT OR REPLACE."""
    if not batch:
        return

    sql_upsert = """
        INSERT OR REPLACE INTO movie_details (movie_id, titulo, ano, diretor, sinopse, poster_url)
        VALUES (:movie_id, :titulo, :ano, :diretor, :sinopse, :poster_url);
    """

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.executemany(sql_upsert, batch)
        conn.commit()
        print(f"💾 Salvos {len(batch)} registros na tabela 'movie_details'.")
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# 5. Execução Principal (Orquestrador)
# ---------------------------------------------------------------------------
def run_ingest():
    print(f"📂 Usando arquivo de banco de dados: {DB_FILE}")
    init_db()

    print("🔎 Lendo a tabela 'movies' do SQLite...")
    movies_list = get_movies_from_db()
    print(f"Total de {len(movies_list)} filmes encontrados.")

    if not movies_list:
        print("Nenhum filme localizado na tabela 'movies'.")
        return

    results: List[MovieDetails] = []

    print("🚀 Iniciando buscas no TMDB e gravação...")
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(process_movie, m_id, m_title): m_id 
            for m_id, m_title in movies_list
        }

        for future in as_completed(futures):
            movie_data = future.result()
            if movie_data:
                results.append(movie_data)

            # Grava no banco a cada 50 registros para otimizar o uso de memória
            if len(results) >= 50:
                save_movie_details_batch(results)
                results.clear()

    # Grava o restante acumulado
    if results:
        save_movie_details_batch(results)

    print("✅ Ingestão da tabela 'movie_details' finalizada com sucesso!")


if __name__ == "__main__":
    run_ingest()