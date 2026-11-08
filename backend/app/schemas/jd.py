from pydantic import BaseModel


class JobDescriptionCreate(BaseModel):
    title: str
    description: str


class JobDescriptionResponse(BaseModel):
    id: int
    title: str
    description: str