from typing import Optional

from fastapi import APIRouter, HTTPException, Path, Query

from app.schemas.common import MaterialDetailResponse, MaterialListResponse
from app.services import material_service

router = APIRouter(tags=["materials"])


@router.get("/materials", response_model=MaterialListResponse)
@router.get("/packaging-materials", response_model=MaterialListResponse)
def list_materials(
    search: Optional[str] = Query(None, max_length=60),
    category: Optional[str] = Query(None, max_length=60),
    food_category: Optional[str] = Query(None, max_length=40),
    storage_type: Optional[str] = Query(None, pattern="^(ambient|chilled|frozen)$"),
    map_suitable: Optional[bool] = None,
    recyclable: Optional[bool] = None,
    biodegradable: Optional[bool] = None,
    max_cost: Optional[int] = Query(None, ge=1, le=5),
):
    materials, source = material_service.list_materials(
        search, category, food_category, storage_type, map_suitable, recyclable, biodegradable, max_cost
    )
    return {"data_source": source, "count": len(materials), "materials": materials}


@router.get("/materials/{material_id}", response_model=MaterialDetailResponse)
@router.get("/packaging-materials/{material_id}", response_model=MaterialDetailResponse)
def get_material(material_id: int = Path(..., ge=1)):
    material, source = material_service.get_material(material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="Packaging material not found")
    return {"data_source": source, "material": material}
