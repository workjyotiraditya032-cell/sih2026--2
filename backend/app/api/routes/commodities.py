from fastapi import APIRouter

from app.database import repository
from app.schemas.common import CommodityListResponse

router = APIRouter(prefix="/commodities", tags=["commodities"])


@router.get("", response_model=CommodityListResponse)
def list_commodities():
    commodities, source = repository.fetch_commodities()
    return {"data_source": source, "count": len(commodities), "commodities": commodities}
