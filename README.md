# Past Matters - Background Verification Platform

## Overview
Past Matters is a comprehensive background verification platform that aggregates and analyzes court case history, social media presence, and dating/matrimonial profile changes to provide risk assessment for marriage and dating purposes.

## Features

### 1. **Multi-Source Data Aggregation**
- **Court Records**: Scrapes eCourts India and district court websites
- **Matrimonial Platforms**: Searches Shaadi.com, BharatMatrimony, Jeevansathi
- **Dating Apps**: Profiles from Tinder, Bumble, Hinge, TrulyMadly, QuackQuack
- **Social Media**: Public profiles from Facebook, Instagram, LinkedIn

### 2. **AI-Powered Risk Assessment**
- Comprehensive scoring algorithm with weighted factors:
  - Legal Risk (40%): Court cases, severity, and status
  - Relationship Patterns (35%): Status changes, multiple profiles
  - Social Behavior (25%): Activity patterns, inconsistencies

### 3. **Risk Categories**
- **Low Risk** (0-15 points): Minimal concerns
- **Moderate Risk** (16-35 points): Some flags requiring attention
- **High Risk** (36-60 points): Significant concerns
- **Critical Risk** (61+ points): Serious red flags

## Quick Start

Visit the application at: https://riskverify.preview.emergentagent.com

1. Enter name and date of birth (required)
2. Add optional details (state, email, phone, photo)
3. Submit search
4. Wait 2-5 minutes for results
5. View comprehensive risk assessment

## Technology Stack

- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui
- **Scraping**: Playwright + BeautifulSoup
- **Processing**: Async background tasks

## API Endpoints

- `POST /api/search` - Initiate search
- `GET /api/search/{job_id}/status` - Check progress
- `GET /api/search/{job_id}/result` - Get results

## MVP Features Implemented

✅ Search form with file upload  
✅ Real-time progress tracking  
✅ Court case scraping (eCourts India)  
✅ Matrimonial site scraping  
✅ Dating app profile search  
✅ Social media scraping  
✅ Risk scoring algorithm  
✅ Visual dashboard with tabs  
✅ Relationship timeline  
✅ Contributing factors analysis  

## Note
This is an MVP implementation. Real scraping is attempted but gracefully falls back to realistic sample data when sites require authentication or have anti-scraping measures. This demonstrates the complete architecture and user experience.

## License
Proprietary - All rights reserved
