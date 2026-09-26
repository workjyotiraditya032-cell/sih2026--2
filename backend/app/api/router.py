from fastapi import APIRouter

from app.api.routes import analyses, commodities, environment, materials, recommend, system, food

api_router = APIRouter()
for module in (system, materials, commodities, recommend, analyses, environment, food):
    api_router.include_router(module.router)
