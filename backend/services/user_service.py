from typing import Optional
from repositories.user_repository import UserRepository
from models.user_model import UserModel
from schemas.user_schema import UserCreateSchema
from faker import Faker
import random

fake = Faker('en-US')

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def buscar_por_id(self, user_id: int) -> UserModel:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Usuário com ID {user_id} não encontrado.")
        return user

    def _gerar_id_unico(self) -> int:
        """Gera o próximo ID sequencial disponível."""
        max_id = self.user_repo.get_max_id() or 0
        return max_id + 1

    def criar_usuario_randomico(self) -> UserModel:
        gender = random.choice(['M', 'F'])
        
        # Gera o nome de acordo com o gênero sorteado
        name = fake.name_male() if gender == 'M' else fake.name_female()
        
        # Valores de idade (18 a 70) e ocupação (0 a 20)
        age = random.randint(18, 70)
        occupation = random.randint(0, 20)
        zip_code = fake.zipcode()

        novo_id = self._gerar_id_unico()

        novo_usuario = UserModel(
            user_id=novo_id,
            name=name,
            gender=gender,
            age=age,
            occupation=occupation,
            zip_code=zip_code,
        )
        return self.user_repo.create(novo_usuario)