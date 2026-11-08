from fastapi import APIRouter
from app.ai.prune_client import test_prune


router = APIRouter()

@router.get("/test")
def test_ai():
    response = test_prune()
    return {"message": response.choices[0].message.content}
    