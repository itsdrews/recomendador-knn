from sqlalchemy import create_engine,text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./movielens.db"

# connect_args={"check_same_thread": False} é necessário para o SQLite no FastAPI
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency Injection para o FastAPI usar nas rotas/controllers
def get_db():
  
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Teste de conexão
if __name__ == "__main__":
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Conexão com o banco realizada com sucesso!")
            print("Resultado:", result.scalar())

    except Exception as e:
        print("Erro ao conectar com o banco:")
        print(e)