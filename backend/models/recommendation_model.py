from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from database import Base


class UserRecommendationModel(Base):
    __tablename__ = "user_recommendations"

    user_id = Column(
        Integer, ForeignKey("users.user_id"), primary_key=True, index=True
    )
    movie_id = Column(
        Integer, ForeignKey("movies.movie_id"), primary_key=True, index=True
    )
    score = Column(Float, nullable=False)
    algorithm_type = Column(String(50), nullable=False, default="knn")
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relacionamentos
    user = relationship("UserModel", back_populates="recommendations")
    movie = relationship("MovieModel", back_populates="recommendations")