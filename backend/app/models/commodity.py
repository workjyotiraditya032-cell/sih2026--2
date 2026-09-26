from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CommodityRecord(BaseModel):
    id: int
    commodity_name: str
    category: str
    typical_moisture: float
    typical_oil_content: float
    typical_ph: float
    respiration_level: str
    moisture_sensitivity: str
    oxygen_sensitivity: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
