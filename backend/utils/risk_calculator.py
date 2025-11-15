import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class RiskCalculator:
    """Calculate risk scores based on court cases and social profiles"""
    
    def __init__(self):
        self.weights = {
            "legal": 0.40,
            "relationship": 0.35,
            "social_behavior": 0.25
        }
    
    def calculate_risk(self, court_cases: List[Dict[str, Any]], 
                      social_profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate comprehensive risk score
        
        Args:
            court_cases: List of court case records
            social_profiles: List of social/matrimonial/dating profiles
            
        Returns:
            Dictionary with risk score details
        """
        # Calculate individual scores
        legal_score = self._calculate_legal_score(court_cases)
        relationship_score = self._calculate_relationship_score(social_profiles)
        social_behavior_score = self._calculate_social_behavior_score(social_profiles)
        
        # Calculate weighted overall score
        overall_score = (
            legal_score * self.weights["legal"] +
            relationship_score * self.weights["relationship"] +
            social_behavior_score * self.weights["social_behavior"]
        )
        
        # Determine risk category
        risk_category = self._get_risk_category(overall_score)
        
        # Get contributing factors
        contributing_factors = self._get_contributing_factors(
            court_cases, social_profiles, legal_score, relationship_score, social_behavior_score
        )
        
        # Calculate confidence level
        confidence = self._calculate_confidence(court_cases, social_profiles)
        
        return {
            "overall_score": int(overall_score),
            "risk_category": risk_category,
            "breakdown": {
                "legal_score": int(legal_score),
                "relationship_score": int(relationship_score),
                "social_behavior_score": int(social_behavior_score)
            },
            "contributing_factors": contributing_factors,
            "confidence_level": confidence
        }
    
    def _calculate_legal_score(self, court_cases: List[Dict[str, Any]]) -> float:
        """Calculate score based on legal records (0-100 scale)"""
        if not court_cases:
            return 0
        
        score = 0
        
        for case in court_cases:
            case_type = case.get("case_type", "")
            status = case.get("status", "")
            severity = case.get("severity_score", 5)
            
            # Add base severity
            score += severity * 2
            
            # Pending cases get extra points
            if status.lower() == "pending":
                score += 3
            
            # High severity cases
            if case_type in ["Criminal", "Domestic Violence"]:
                score += 10
            elif case_type == "Matrimonial":
                score += 5
        
        return min(score, 100)
    
    def _calculate_relationship_score(self, social_profiles: List[Dict[str, Any]]) -> float:
        """Calculate score based on relationship patterns (0-100 scale)"""
        if not social_profiles:
            return 0
        
        score = 0
        total_changes = 0
        
        for profile in social_profiles:
            changes = profile.get("relationship_status_history", [])
            total_changes += len(changes)
        
        # Multiple relationship status changes
        if total_changes > 3:
            score += (total_changes - 3) * 5
        
        # Multiple active profiles
        matrimonial_profiles = [p for p in social_profiles if p["platform"] in ["Shaadi", "Bharatmatrimony", "Jeevansathi"]]
        dating_profiles = [p for p in social_profiles if p["platform"] in ["Tinder", "Bumble", "Hinge", "TrulyMadly", "QuackQuack"]]
        
        if len(matrimonial_profiles) > 1:
            score += 10
        
        if len(dating_profiles) > 2:
            score += 15
        
        return min(score, 100)
    
    def _calculate_social_behavior_score(self, social_profiles: List[Dict[str, Any]]) -> float:
        """Calculate score based on social media behavior (0-100 scale)"""
        if not social_profiles:
            return 0
        
        score = 0
        
        # Check for inconsistencies across platforms
        platforms_count = len(set(p["platform"] for p in social_profiles))
        
        if platforms_count > 5:
            score += 10
        
        # Check activity patterns
        for profile in social_profiles:
            activity = profile.get("activity_pattern", {})
            
            # Inactive profiles
            if activity.get("profile_changes", 0) > 6:
                score += 5
        
        return min(score, 100)
    
    def _get_risk_category(self, score: float) -> str:
        """Determine risk category based on score"""
        if score <= 15:
            return "low"
        elif score <= 35:
            return "moderate"
        elif score <= 60:
            return "high"
        else:
            return "critical"
    
    def _get_contributing_factors(self, court_cases: List[Dict[str, Any]], 
                                 social_profiles: List[Dict[str, Any]],
                                 legal_score: float, relationship_score: float,
                                 social_behavior_score: float) -> List[str]:
        """Get list of contributing factors to risk score"""
        factors = []
        
        # Legal factors
        if court_cases:
            pending_cases = [c for c in court_cases if c.get("status", "").lower() == "pending"]
            if pending_cases:
                factors.append(f"{len(pending_cases)} pending court case(s)")
            
            criminal_cases = [c for c in court_cases if c.get("case_type") in ["Criminal", "Domestic Violence"]]
            if criminal_cases:
                factors.append(f"{len(criminal_cases)} serious criminal/domestic violence case(s)")
        
        # Relationship factors
        total_changes = sum(len(p.get("relationship_status_history", [])) for p in social_profiles)
        if total_changes > 3:
            factors.append(f"Multiple relationship status changes ({total_changes} recorded)")
        
        matrimonial_count = len([p for p in social_profiles if p["platform"] in ["Shaadi", "Bharatmatrimony", "Jeevansathi"]])
        if matrimonial_count > 1:
            factors.append(f"Active on {matrimonial_count} matrimonial platforms")
        
        # Social behavior factors
        if len(social_profiles) > 5:
            factors.append(f"Presence on {len(social_profiles)} different platforms")
        
        if not factors:
            factors.append("Limited public information available")
        
        return factors
    
    def _calculate_confidence(self, court_cases: List[Dict[str, Any]], 
                            social_profiles: List[Dict[str, Any]]) -> int:
        """Calculate confidence level in the assessment (0-100)"""
        # More data = higher confidence
        data_points = len(court_cases) + len(social_profiles)
        
        if data_points >= 5:
            return 85
        elif data_points >= 3:
            return 70
        elif data_points >= 1:
            return 50
        else:
            return 30