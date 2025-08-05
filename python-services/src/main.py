from fastapi import FastAPI
from src.api import analyze

app = FastAPI(
    title="Link Shortener - Python Services",
    description="API for data enrichment and analysis for the link shortener.",
    version="1.0.0"
)

app.include_router(analyze.router)

@app.get("/")
async def root():
    return {"message": "Python services for link shortener are running."}
