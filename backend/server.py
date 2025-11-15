from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import asyncio
import base64
import aiofiles
from scrapers.court_scraper import CourtScraper
from scrapers.matrimonial_scraper import MatrimonialScraper
from scrapers.dating_scraper import DatingScraper
from scrapers.social_scraper import SocialScraper
from utils.risk_calculator import RiskCalculator
from utils.photo_matcher import PhotoMatcher
from utils.image_search import ReverseImageSearch


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class SearchInput(BaseModel):
    name: str
    dob: str  # YYYY-MM-DD format
    state: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class SearchJobResponse(BaseModel):
    job_id: str
    status: str
    estimated_time: int  # seconds
    status_url: str

class ProgressInfo(BaseModel):
    overall: int
    stages: Dict[str, int]

class SearchStatus(BaseModel):
    status: str
    progress: ProgressInfo
    result_url: Optional[str] = None
    error: Optional[str] = None

class CourtCaseRecord(BaseModel):
    case_number: str
    case_type: str
    filing_date: str
    status: str
    court_name: str
    state: str
    severity_score: int
    summary: str

class SocialProfileRecord(BaseModel):
    platform: str
    profile_url: str
    created_date: Optional[str] = None
    relationship_status_history: List[Dict[str, Any]]
    activity_pattern: Dict[str, Any]

class RiskScoreBreakdown(BaseModel):
    legal_score: int
    relationship_score: int
    social_behavior_score: int

class RiskScoreResult(BaseModel):
    overall_score: int
    risk_category: str
    breakdown: RiskScoreBreakdown
    contributing_factors: List[str]
    confidence_level: int

class SearchResult(BaseModel):
    subject: Dict[str, Any]
    risk_score: RiskScoreResult
    court_cases: List[CourtCaseRecord]
    social_profiles: List[SocialProfileRecord]
    relationship_timeline: List[Dict[str, Any]]
    generated_at: str

# In-memory job storage (in production, use Redis)
jobs_store = {}

@api_router.get("/")
async def root():
    return {"message": "Past Matters API v1.0"}

@api_router.post("/search", response_model=SearchJobResponse)
async def create_search(name: str = Form(None), dob: str = Form(None), 
                       state: Optional[str] = Form(None),
                       email: Optional[str] = Form(None),
                       phone: Optional[str] = Form(None),
                       photo: Optional[UploadFile] = File(None)):
    try:
        # Validate: either (name AND dob) OR photo must be provided
        if not photo and (not name or not dob):
            raise HTTPException(
                status_code=400, 
                detail="Either provide both name and DOB, or upload a photo to search"
            )
        
        job_id = str(uuid.uuid4())
        
        # Save photo if uploaded
        photo_path = None
        if photo:
            upload_dir = Path("/app/backend/uploads")
            upload_dir.mkdir(exist_ok=True)
            photo_path = upload_dir / f"{job_id}.jpg"
            async with aiofiles.open(photo_path, 'wb') as f:
                content = await photo.read()
                await f.write(content)
        
        # Determine search type
        search_type = "photo_only" if (photo and not name) else "standard"
        
        # Create search job
        job_data = {
            "id": job_id,
            "input": {
                "name": name,
                "dob": dob,
                "state": state,
                "email": email,
                "phone": phone,
                "photo_path": str(photo_path) if photo_path else None,
                "search_type": search_type
            },
            "status": "queued",
            "progress": {
                "overall": 0,
                "stages": {
                    "photo_analysis": 0 if photo else 100,
                    "reverse_image_search": 0 if search_type == "photo_only" else 100,
                    "court_cases": 0,
                    "matrimonial_profiles": 0,
                    "dating_profiles": 0,
                    "social_media": 0,
                    "risk_calculation": 0
                }
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "result": None,
            "error": None
        }
        
        # Store in MongoDB
        await db.searches.insert_one(job_data)
        
        # Start background task
        asyncio.create_task(process_search(job_id, job_data["input"]))
        
        return SearchJobResponse(
            job_id=job_id,
            status="queued",
            estimated_time=240 if search_type == "photo_only" else 180,
            status_url=f"/api/search/{job_id}/status"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/search/{job_id}/status", response_model=SearchStatus)
async def get_search_status(job_id: str):
    try:
        job = await db.searches.find_one({"id": job_id}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Search job not found")
        
        result_url = f"/api/search/{job_id}/result" if job["status"] == "completed" else None
        
        return SearchStatus(
            status=job["status"],
            progress=ProgressInfo(
                overall=job["progress"]["overall"],
                stages=job["progress"]["stages"]
            ),
            result_url=result_url,
            error=job.get("error")
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/search/{job_id}/result")
async def get_search_result(job_id: str):
    try:
        job = await db.searches.find_one({"id": job_id}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Search job not found")
        
        if job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Search not completed yet")
        
        if not job.get("result"):
            raise HTTPException(status_code=404, detail="No results found")
        
        return JSONResponse(content=job["result"])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting result: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/search/{job_id}/export/pdf")
async def export_result_pdf(job_id: str):
    \"\"\"Export search result as PDF\"\"\"
    try:
        from utils.pdf_generator import PDFGenerator
        from fastapi.responses import FileResponse
        
        job = await db.searches.find_one({"id": job_id}, {"_id": 0})
        if not job:
            raise HTTPException(status_code=404, detail="Search job not found")
        
        if job["status"] != "completed":
            raise HTTPException(status_code=400, detail="Search not completed yet")
        
        if not job.get("result"):
            raise HTTPException(status_code=404, detail="No results found")
        
        # Generate PDF
        pdf_generator = PDFGenerator()
        pdf_dir = Path("/app/backend/exports")
        pdf_dir.mkdir(exist_ok=True)
        pdf_path = pdf_dir / f"report_{job_id}.pdf"
        
        pdf_generator.generate_report(job["result"], str(pdf_path))
        
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=f"past_matters_report_{job['result']['subject']['name'].replace(' ', '_')}.pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_search(job_id: str, input_data: Dict[str, Any]):
    """Background task to process search"""
    try:
        # Update status to processing
        await db.searches.update_one(
            {"id": job_id},
            {"$set": {"status": "processing"}}
        )
        
        # Initialize tools
        photo_matcher = PhotoMatcher()
        image_search = ReverseImageSearch()
        court_scraper = CourtScraper()
        matrimonial_scraper = MatrimonialScraper()
        dating_scraper = DatingScraper()
        social_scraper = SocialScraper()
        
        # Photo analysis if photo provided
        photo_features = None
        photo_search_results = None
        if input_data.get("photo_path"):
            logger.info(f"Job {job_id}: Analyzing photo...")
            await update_progress(job_id, "photo_analysis", 20)
            photo_features = photo_matcher.extract_face_features(input_data["photo_path"])
            await update_progress(job_id, "photo_analysis", 100)
            
            # If photo-only search, perform reverse image search
            if input_data.get("search_type") == "photo_only":
                logger.info(f"Job {job_id}: Performing reverse image search...")
                await update_progress(job_id, "reverse_image_search", 20)
                photo_search_results = await image_search.comprehensive_photo_search(input_data["photo_path"])
                await update_progress(job_id, "reverse_image_search", 100)
        
        # Determine search parameters
        search_name = input_data.get("name") or "Unknown"
        if input_data.get("search_type") == "photo_only" and photo_search_results:
            # Try to extract name from photo search results
            if photo_search_results['social_media']:
                search_name = photo_search_results['social_media'][0].get('profile_name', 'Unknown')
        
        # Scrape court cases
        if input_data.get("name"):
            logger.info(f"Job {job_id}: Scraping court cases...")
            await update_progress(job_id, "court_cases", 10)
            court_cases = await court_scraper.scrape(input_data["name"], input_data.get("state"))
            await update_progress(job_id, "court_cases", 100)
        else:
            court_cases = []
            await update_progress(job_id, "court_cases", 100)
        
        # Scrape matrimonial profiles
        logger.info(f"Job {job_id}: Scraping matrimonial profiles...")
        await update_progress(job_id, "matrimonial_profiles", 10)
        matrimonial_profiles = await matrimonial_scraper.scrape(search_name, input_data.get("email"))
        await update_progress(job_id, "matrimonial_profiles", 100)
        
        # Scrape dating profiles
        logger.info(f"Job {job_id}: Scraping dating profiles...")
        await update_progress(job_id, "dating_profiles", 10)
        dating_profiles = await dating_scraper.scrape(search_name, input_data.get("email"))
        await update_progress(job_id, "dating_profiles", 100)
        
        # Scrape social media
        logger.info(f"Job {job_id}: Scraping social media...")
        await update_progress(job_id, "social_media", 10)
        social_profiles = await social_scraper.scrape(search_name, input_data.get("email"))
        await update_progress(job_id, "social_media", 100)
        
        # Add photo search results to profiles if available
        if photo_search_results:
            for social_match in photo_search_results['social_media']:
                social_profiles.append({
                    'platform': social_match['platform'],
                    'profile_url': social_match['profile_url'],
                    'created_date': social_match.get('last_updated'),
                    'relationship_status_history': [],
                    'activity_pattern': {
                        'photo_match_confidence': social_match['match_confidence'],
                        'photo_count': social_match.get('photo_count', 0)
                    },
                    'photo_matched': True
                })
            
            for dating_match in photo_search_results['dating_apps']:
                dating_profiles.append({
                    'platform': dating_match['platform'],
                    'profile_url': dating_match['profile_url'],
                    'created_date': None,
                    'relationship_status_history': [],
                    'activity_pattern': {
                        'photo_match_confidence': dating_match['match_confidence'],
                        'profile_active': dating_match.get('profile_active', False),
                        'photo_matches': dating_match.get('photo_matches', 0)
                    },
                    'photo_matched': True
                })
        
        # Combine all social profiles
        all_profiles = matrimonial_profiles + dating_profiles + social_profiles
        
        # Calculate risk score
        logger.info(f"Job {job_id}: Calculating risk score...")
        await update_progress(job_id, "risk_calculation", 50)
        calculator = RiskCalculator()
        risk_result = calculator.calculate_risk(court_cases, all_profiles)
        await update_progress(job_id, "risk_calculation", 100)
        
        # Prepare result
        photo_matched = bool(photo_features and photo_features.get('face_detected'))
        result = {
            "subject": {
                "name": search_name,
                "dob": input_data.get("dob", "Unknown"),
                "photo_matched": photo_matched,
                "photo_info": photo_features if photo_features else None
            },
            "risk_score": risk_result,
            "court_cases": court_cases,
            "social_profiles": all_profiles,
            "relationship_timeline": extract_relationship_timeline(all_profiles),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update job with result
        await db.searches.update_one(
            {"id": job_id},
            {"$set": {
                "status": "completed",
                "result": result,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Job {job_id}: Completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        await db.searches.update_one(
            {"id": job_id},
            {"$set": {
                "status": "failed",
                "error": str(e)
            }}
        )

async def update_progress(job_id: str, stage: str, progress: int):
    """Update progress for a specific stage"""
    job = await db.searches.find_one({"id": job_id})
    if job:
        job["progress"]["stages"][stage] = progress
        
        # Calculate overall progress
        total_stages = len(job["progress"]["stages"])
        overall = sum(job["progress"]["stages"].values()) // total_stages
        job["progress"]["overall"] = overall
        
        await db.searches.update_one(
            {"id": job_id},
            {"$set": {"progress": job["progress"]}}
        )

def extract_relationship_timeline(profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract relationship timeline from social profiles"""
    timeline = []
    for profile in profiles:
        if "relationship_status_history" in profile:
            for change in profile["relationship_status_history"]:
                timeline.append({
                    "date": change.get("date"),
                    "previous_status": change.get("previous_status"),
                    "new_status": change.get("new_status"),
                    "platform": profile["platform"]
                })
    
    # Sort by date
    timeline.sort(key=lambda x: x["date"] if x["date"] else "", reverse=True)
    return timeline

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()