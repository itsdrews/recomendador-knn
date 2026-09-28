from typing import Optional
from sqlalchemy.orm import Session
from models.user_model import UserModel


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[UserModel]:
        """Busca um usuário pelo ID."""
        return self.db.query(UserModel).filter(UserModel.user_id == user_id).first()

    def create(self, user: UserModel) -> UserModel:
        """Cria um novo usuário."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def exists(self, user_id: int) -> bool:
        """Verifica se o usuário existe no banco de dados."""
        return (
            self.db.query(UserModel.user_id)
            .filter(UserModel.user_id == user_id)
            .first()
            is not None
        )