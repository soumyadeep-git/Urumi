from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoreCreate(BaseModel):
    name: str

class Store(BaseModel):
    id: str
    name: str
    status: str
    url: str
    created_at: str
