import logging
import imagehash
from PIL import Image
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

class PhotoMatcher:
    """Handle photo matching and face recognition"""
    
    def __init__(self):
        self.hash_threshold = 10  # Lower = more similar
        
    def calculate_image_hash(self, image_path: str) -> Optional[str]:
        """Calculate perceptual hash of an image"""
        try:
            img = Image.open(image_path)
            # Use average hash for better performance
            avg_hash = imagehash.average_hash(img)
            return str(avg_hash)
        except Exception as e:
            logger.error(f"Error calculating hash for {image_path}: {str(e)}")
            return None
    
    def compare_hashes(self, hash1: str, hash2: str) -> int:
        """Compare two image hashes and return difference"""
        try:
            h1 = imagehash.hex_to_hash(hash1)
            h2 = imagehash.hex_to_hash(hash2)
            return h1 - h2
        except Exception as e:
            logger.error(f"Error comparing hashes: {str(e)}")
            return 999
    
    def is_match(self, hash1: str, hash2: str) -> bool:
        """Check if two hashes represent similar images"""
        diff = self.compare_hashes(hash1, hash2)
        return diff <= self.hash_threshold
    
    def get_match_percentage(self, hash1: str, hash2: str) -> int:
        """Get match percentage between two images"""
        diff = self.compare_hashes(hash1, hash2)
        # Convert difference to percentage (0 = 100%, 64 = 0%)
        percentage = max(0, 100 - (diff * 100 // 64))
        return percentage
    
    def detect_faces(self, image_path: str) -> List[Dict[str, Any]]:
        """Detect faces in an image using OpenCV"""
        try:
            # Load the cascade
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            # Read the image
            img = cv2.imread(str(image_path))
            if img is None:
                return []
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            face_data = []
            for (x, y, w, h) in faces:
                face_data.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h),
                    'confidence': 0.85  # OpenCV doesn't provide confidence
                })
            
            logger.info(f"Detected {len(face_data)} faces in {image_path}")
            return face_data
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []
    
    def extract_face_features(self, image_path: str) -> Optional[Dict[str, Any]]:
        """Extract face features from an image"""
        try:
            faces = self.detect_faces(image_path)
            if not faces:
                logger.warning(f"No faces detected in {image_path}")
                return None
            
            # Get the largest face (assuming it's the primary subject)
            primary_face = max(faces, key=lambda f: f['width'] * f['height'])
            
            # Calculate image hash for the face region
            img = Image.open(image_path)
            face_img = img.crop((
                primary_face['x'],
                primary_face['y'],
                primary_face['x'] + primary_face['width'],
                primary_face['y'] + primary_face['height']
            ))
            
            # Calculate hash of face region
            face_hash = str(imagehash.average_hash(face_img))
            
            return {
                'face_detected': True,
                'face_count': len(faces),
                'primary_face': primary_face,
                'face_hash': face_hash,
                'full_image_hash': self.calculate_image_hash(image_path)
            }
            
        except Exception as e:
            logger.error(f"Error extracting face features: {str(e)}")
            return None
    
    def search_by_photo(self, photo_path: str, profile_photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Search for matching profiles by photo"""
        matches = []
        
        # Extract features from search photo
        search_features = self.extract_face_features(photo_path)
        if not search_features:
            logger.warning("Could not extract features from search photo")
            return matches
        
        search_hash = search_features['face_hash']
        
        # Compare with profile photos
        for profile in profile_photos:
            if 'photo_hash' not in profile:
                continue
            
            match_percentage = self.get_match_percentage(search_hash, profile['photo_hash'])
            
            if match_percentage >= 70:  # 70% threshold for matches
                matches.append({
                    **profile,
                    'match_percentage': match_percentage,
                    'match_type': 'face'
                })
        
        # Sort by match percentage
        matches.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        logger.info(f"Found {len(matches)} photo matches")
        return matches
    
    def compare_profile_photo(self, uploaded_photo_path: str, profile_photo_hash: str) -> Dict[str, Any]:
        """Compare uploaded photo with a profile photo"""
        try:
            # Extract features from uploaded photo
            features = self.extract_face_features(uploaded_photo_path)
            if not features:
                return {
                    'matched': False,
                    'confidence': 0,
                    'reason': 'No face detected in uploaded photo'
                }
            
            # Compare hashes
            match_percentage = self.get_match_percentage(features['face_hash'], profile_photo_hash)
            
            return {
                'matched': match_percentage >= 70,
                'confidence': match_percentage,
                'faces_detected': features['face_count']
            }
            
        except Exception as e:
            logger.error(f"Error comparing profile photo: {str(e)}")
            return {
                'matched': False,
                'confidence': 0,
                'reason': str(e)
            }