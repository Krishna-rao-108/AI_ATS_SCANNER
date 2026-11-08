from sqlmodel import SQLModel, Field


class Resume(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int
    title: str
    content: str