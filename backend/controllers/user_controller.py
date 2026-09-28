from fastapi import APIRouter, Depends, HTTPException, status
from dependencies import get_user_service
from schemas.user_schema import UserCreateSchema, UserResponseSchema
from services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get("/{user_id}", response_model=UserResponseSchema)
async def obter_usuario(
    user_id: int,
    user_service: UserService = Depends(get_user_service),
):
    """Busca as informações demográficas de um usuário pelo ID."""
    try:
        return user_service.buscar_por_id(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

@router.post("", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
async def criar_usuario_randomico(
    user_service: UserService = Depends(get_user_service),
):
    """Gera e cadastra um usuário completamente aleatório no banco SQLite."""
    try:
        return user_service.criar_usuario_randomico()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar usuário aleatório: {str(e)}",
        )