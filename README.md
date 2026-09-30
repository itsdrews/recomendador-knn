# Recomendador de Filmes 
Aplicação web fullstack para recomendações de filmes utilizando **Filtragem Colaborativa (KNN com Cosseno e Pearson)**. O sistema calcula e exibe recomendações personalizadas com base na similaridade entre usuários/itens em tempo real com suporte a scroll horizontal e interface responsiva.

---
## Dataset
* **MovieLens 1M Dataset: https://grouplens.org/datasets/movielens/1m/**
## 🛠️ Tecnologias Utilizadas

### **Backend**
* **[Python 3.10+](https://www.python.org/)**
* **[FastAPI](https://fastapi.tiangolo.com/)**: Framework web moderno e de alta performance.
* **[UV](https://github.com/astral-sh/uv)**: Gerenciador de pacotes e ambientes Python de alta velocidade.
* **[Uvicorn](https://www.uvicorn.org/)**: Servidor ASGI para execução do FastAPI.
* **[NumPy](https://numpy.org/) & [Pandas](https://pandas.pydata.org/)**: Operações matriciais vetorizadas e manipulação de dados.
* **[Scikit-Learn](https://scikit-learn.org/) & [Joblib](https://joblib.readthedocs.io/)**: Treinamento, métricas e serialização dos modelos (.pkl).
* **[SQLAlchemy](https://www.sqlalchemy.org/)**: ORM para persistência e gestão dos dados.
* **[Jupyter Notebook](https://jupyter.org/)**: Para escrever o treinamento passo a passo dos modelos.

### **Frontend**
* **[React 18](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
* **[Vite](https://vitejs.dev/)**: Build tool ultrarrápido para desenvolvimento frontend.
* **[Tailwind CSS](https://tailwindcss.com/)**: Estilização responsiva e suporte a layouts fluidos (Scroll horizontal/Carrossel).

### **Como instalar e rodar o projeto**
**Dados**
```bash
cd DATA
curl -O [https://files.grouplens.org/datasets/movielens/ml-1m.zip](https://files.grouplens.org/datasets/movielens/ml-1m.zip)
unzip ml-1m.zip
```
**Backend**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```
**Modelos KNN**
```bash
cd backend
uv run jupyter nbconvert --to notebook --execute notebook.ipynb --inplace
```
**Frontend**
```bash
cd frontend
npm install
npm run dev
```
## Estrutura do Projeto

```text
.
├── DATA/
│   ├── ml-1m/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── repositories/
│   ├── schemas/
│   ├── database.py
│   ├── dependencies.py
│   ├── scripts/
│   ├── main.py             # Entrypoint e rotas da API FastAPI
│   ├── knn_scracth.py
│   ├── training.ipynb
│   └── models/             # Arquivos dos modelos treinados (.pkl)
│   ├── pyproject.toml          # Gerenciamento de dependências via UV
│   └── uv.lock
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes da UI (RecommendationsTab, RecommendationCard)
│   │   ├── pages/ 
│   │   ├── api/           # Integração com a API            
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
