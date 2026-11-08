from sqlmodel import SQLModel, Field


class JobDescription(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int
    title: str
    description: str