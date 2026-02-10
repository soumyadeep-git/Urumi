from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoreCreate(BaseModel):
    name: str
    custom_domain: Optional[str] = None

class Store(BaseModel):
    id: str
    name: str
    custom_domain: Optional[str] = None
    status: str
    url: str
    created_at: str
