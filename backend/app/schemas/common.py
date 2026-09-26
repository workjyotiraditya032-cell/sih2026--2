from typing import Optional

from pydantic import BaseModel

from app.schemas.material import CommodityOut, MaterialOut


class MaterialListResponse(BaseModel):
    data_source: str
    count: int
    materials: list[MaterialOut]


class MaterialDetailResponse(BaseModel):
    data_source: str
    material: MaterialOut


class CommodityListResponse(BaseModel):
    data_source: str
    count: int
    commodities: list[CommodityOut]


class DatabaseStatus(BaseModel):
    engine: str
    connected: bool
    detail: str


class HealthResponse(BaseModel):
    status: str
    api: str
    version: str
    database: DatabaseStatus
    data_source: str


class EnvironmentResponse(BaseModel):
    location: str
    latitude: float
    longitude: float
    temperature: float
    relative_humidity: float
    observed_at: Optional[str]
    source: str
