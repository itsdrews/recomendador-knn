from typing import Optional
from repositories.user_repository import UserRepository
from models.user_model import UserModel
from schemas.user_schema import UserCreateSchema


class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def buscar_por_id(self, user_id: int) -> UserModel:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError(f"Usuário com ID {user_id} não encontrado.")
        return user

    def criar_usuario(self, user_data: UserCreateSchema) -> UserModel:
        if self.user_repo.exists(user_data.user_id):
            raise ValueError(f"Usuário com ID {user_data.user_id} já existe no sistema.")

        novo_usuario = UserModel(
            user_id=user_data.user_id,
            name=user_data.name,
            gender=user_data.gender,
            age=user_data.age,
            occupation=user_data.occupation,
            zip_code=user_data.zip_code,
        )
        return self.user_repo.create(novo_usuario)