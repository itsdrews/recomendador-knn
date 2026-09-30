from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base  # Ajuste a importação conforme seu projeto

class UserRecommendationModel(Base):
    __tablename__ = "user_recommendations"

    # Chave primária composta por (user_id, movie_id, algorithm_type)
    user_id = Column(
        Integer, ForeignKey("users.user_id"), primary_key=True, index=True
    )
    movie_id = Column(
        Integer, ForeignKey("movies.movie_id"), primary_key=True, index=True
    )
    algorithm_type = Column(
        String(50), primary_key=True, default="knn_cosine"
    )
    
    score = Column(Float, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relacionamentos
    user = relationship("UserModel", back_populates="recommendations")
    movie = relationship("MovieModel", back_populates="recommendations")