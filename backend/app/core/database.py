from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "postgresql://krishnarao@localhost:5432/ats_analyzer"

engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session
    