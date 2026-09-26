# Imagem oficial com uv e Python 3.12 pré-instalados
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Ativa a compilação do bytecode Python para execução mais rápida
ENV UV_COMPILE_BYTECODE=1

# 1. Copia apenas os arquivos de dependência para aproveitar o cache de camadas do Docker
COPY pyproject.toml uv.lock ./

# 2. Instala as dependências de produção (ignora o grupo 'dev' como jupyter/notebook)
RUN uv sync --frozen --no-install-project --no-dev

# 3. Copia o restante dos arquivos do seu projeto
COPY . .

# 4. Sincroniza o projeto final
RUN uv sync --frozen --no-dev

EXPOSE 8000

# Executa o uvicorn gerenciado pelo uv dentro do ambiente virtual do container
# Substitua 'main:app' pelo nome do seu arquivo principal e instância do FastAPI (ex: app.main:app)
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]