from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from src.analytics.ip_analysis_service import analyze_click_data

router = APIRouter(
    prefix="/analyze",
    tags=["Analysis"]
)

class ClickData(BaseModel):
    ip: str
    user_agent: str

@router.post("/click")
async def analyze_click(data: ClickData, request: Request):
    try:
        enriched_data = analyze_click_data(ip=data.ip, user_agent=data.user_agent)
        return enriched_data
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"Error during click analysis: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during data enrichment.")
