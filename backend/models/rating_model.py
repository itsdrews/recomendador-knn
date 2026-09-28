from sqlalchemy import Column, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database import Base


class RatingModel(Base):
    __tablename__ = "ratings"

    user_id = Column(
        Integer, ForeignKey("users.user_id"), primary_key=True, index=True
    )
    movie_id = Column(
        Integer, ForeignKey("movies.movie_id"), primary_key=True, index=True
    )
    rating = Column(Float, nullable=False)
    timestamp = Column(Integer, nullable=False)

    # Relacionamentos
    user = relationship("UserModel", back_populates="ratings")
    movie = relationship("MovieModel", back_populates="ratings")