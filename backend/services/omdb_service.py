import re
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OMDB_API_KEY = os.getenv("OMDB_API_KEY")

class OMDBService:
    @staticmethod
    def limpar_titulo_movielens(titulo_bruto: str):
        match_ano = re.search(r'\((\d{4})\)$', titulo_bruto.strip())
        ano = match_ano.group(1) if match_ano else None
        
        titulo_sem_ano = re.sub(r'\s*\(\d{4}\)$', '', titulo_bruto.strip())
        artigos = [", The", ", A", ", An", ", Les", ", La", ", Le", ", Der", ", Das", ", Die"]
        titulo_formatado = titulo_sem_ano
        
        for artigo in artigos:
            if titulo_sem_ano.endswith(artigo):
                nome_sem_artigo = titulo_sem_ano[:-len(artigo)]
                artigo_limpo = artigo.replace(",", "").strip()
                titulo_formatado = f"{artigo_limpo} {nome_sem_artigo}"
                break
                
        return titulo_formatado, ano

    @classmethod
    async def buscar_detalhes_filme(cls, titulo_bruto: str) -> dict:
        titulo_limpo, ano_movielens = cls.limpar_titulo_movielens(titulo_bruto)
        params = {"t": titulo_limpo, "apikey": OMDB_API_KEY}
        if ano_movielens:
            params["y"] = ano_movielens
            
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("http://www.omdbapi.com/", params=params)
                data = response.json()
                
                if data.get("Response") == "True":
                    return {
                        "titulo_formatado": data.get("Title", titulo_limpo),
                        "poster": data.get("Poster") if data.get("Poster") != "N/A" else "https://via.placeholder.com/300x450?text=Poster+Indisponivel",
                        "sinopse": data.get("Plot", "Sinopse não disponível."),
                        "ano": data.get("Year", ano_movielens or "N/A"),
                        "diretor": data.get("Director", "N/A")
                    }
        except Exception:
            pass
            
        return {
            "titulo_formatado": titulo_limpo,
            "poster": "https://via.placeholder.com/300x450?text=Poster+Indisponivel",
            "sinopse": "Não foi possível carregar os detalhes.",
            "ano": ano_movielens or "N/A",
            "diretor": "N/A"
        }