from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class UserModel(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    gender = Column(String(1), nullable=False)
    age = Column(Integer, nullable=False)
    occupation = Column(Integer, nullable=False)
    zip_code = Column(String(10), nullable=False)

    # Relacionamentos
    ratings = relationship("RatingModel", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("UserRecommendationModel", back_populates="user", cascade="all, delete-orphan")