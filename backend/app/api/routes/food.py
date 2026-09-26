from uuid import UUID
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import Field
from starlette.concurrency import run_in_threadpool
from app.schemas.food import ClosedModel, FoodInput
from app.database.food_knowledge import PROFILES
from app.services import food_intelligence, image_service
from app.database.connection import DatabaseUnavailable

router = APIRouter(tags=['food-intelligence'])

class UploadStart(ClosedModel):
    filename: str = Field(min_length=1, max_length=150)
    size: int = Field(ge=1, le=image_service.MAX_SIZE)

@router.get('/food-profiles')
def food_profiles():
    return {'count':len(PROFILES), 'foods':[{'food':p.food, 'food_category':p.food_category} for p in PROFILES.values()]}

@router.post('/analyze-food')
def analyze_food(request: FoodInput):
    profile, image = food_intelligence.identify_food(request)
    return {'food':profile.food, 'food_profile':profile, 'image_identification':image}

@router.post('/food-images')
def begin_image(request: UploadStart):
    try:
        return image_service.begin_upload(request.filename,request.size)
    except DatabaseUnavailable:
        raise HTTPException(503, 'Image upload requires the database. Food-name recommendations are still available.')

@router.post('/food-images/{image_id}/chunks')
async def upload_chunk(image_id: UUID, request: Request, offset: int = Query(ge=0)):
    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > image_service.CHUNK_SIZE:
            raise HTTPException(413, 'Chunk too large; maximum 256 KiB.')
    return await run_in_threadpool(image_service.receive_chunk, str(image_id), offset, bytes(data))

@router.post('/food-images/{image_id}/complete')
def finish_image(image_id: UUID):
    return image_service.finish_upload(str(image_id))
