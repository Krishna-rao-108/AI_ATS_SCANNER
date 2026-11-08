from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.core.security import hash_password
from app.core.database import get_session
from app.models.user import User
from app.schemas.auth import UserCreate
from app.core.security import create_access_token, verify_password, get_current_user
from app.schemas.auth import UserLogin

router = APIRouter()


@router.post("/signup")
def signup(user: UserCreate, session: Session = Depends(get_session)):
    hashed_password = hash_password(user.password)
    new_user = User(name = user.name, email = user.email, hashed_password = hashed_password)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post("/login")
def login(user: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == user.email)
    db_user = session.exec(statement).first()

    if not db_user:
        return {"message": "Invalid email or password"}

    if not verify_password(user.password, db_user.hashed_password):
        return {"message": "Invalid email or password"}

    token = create_access_token({"user_id": db_user.id})

    return {"access_token": token}


@router.get("/me")
def get_me(current_user_id: int = Depends(get_current_user)):
    return {"user_id": current_user_id}