from typing import Optional
from pydantic import BaseModel, Field

class InteractionLogRequest(BaseModel):
    food_id: str
    interaction_type: str = Field(description="VIEW, CLICK, ADD_TO_CART")
    dwell_time_seconds: Optional[int] = None
    context_data: Optional[dict] = None

