from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class MovieModel(Base):
    __tablename__ = "movies"

    movie_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    genres = Column(String, nullable=True)

    # Relacionamentos
    ratings = relationship("RatingModel", back_populates="movie")
    recommendations = relationship("UserRecommendationModel", back_populates="movie")