import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Search, Shield, Camera, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PhotoSearchPage = () => {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size must be less than 5MB');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!photo) {
      toast.error('Please upload a photo to search');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', photo);

      const response = await axios.post(`${API}/search`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Photo search initiated!');
      navigate(`/results/${response.data.job_id}`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8" data-testid="photo-search-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4" data-testid="back-to-home-link">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Standard Search
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-4 shadow-lg" data-testid="logo">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3" style={{ fontFamily: 'Space Grotesk' }} data-testid="page-title">
              Search by Photo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="page-description">
              Upload a photo to find matching profiles across dating, matrimonial, and social media platforms
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm" data-testid="feature-facial-recognition">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Camera className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Facial Recognition</h3>
                  <p className="text-sm text-gray-600">Advanced AI matching</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm" data-testid="feature-reverse-search">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Search className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Reverse Search</h3>
                  <p className="text-sm text-gray-600">Find across platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm" data-testid="feature-match-score">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Match Scores</h3>
                  <p className="text-sm text-gray-600">Confidence ratings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Card */}
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm" data-testid="upload-card">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center" style={{ fontFamily: 'Space Grotesk' }}>
              <Camera className="w-6 h-6 mr-2" />
              Upload Photo
            </CardTitle>
            <CardDescription className="text-purple-100">
              Upload a clear photo showing the person's face
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-4">
                {photoPreview ? (
                  <div className="space-y-4" data-testid="photo-preview-section">
                    <div className="relative rounded-xl overflow-hidden shadow-lg">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="w-full h-96 object-contain bg-gray-50"
                        data-testid="photo-preview-image"
                      />
                      <div className="absolute top-4 right-4">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview(null);
                          }}
                          data-testid="remove-photo-button"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" data-testid="photo-info">
                      <p className="text-sm text-blue-800">
                        <strong>Photo ready for search</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Our AI will analyze facial features and search across multiple platforms
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 hover:border-purple-400 transition-colors bg-gradient-to-br from-purple-50 to-indigo-50" data-testid="upload-zone">
                    <label className="flex flex-col items-center cursor-pointer">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-12 h-12 text-purple-600" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900 mb-2">Click to upload photo</span>
                      <span className="text-sm text-gray-600 mb-1">or drag and drop</span>
                      <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        data-testid="photo-input"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Info Alert */}
              <Alert className="bg-amber-50 border-amber-200" data-testid="privacy-alert">
                <Shield className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <strong>Privacy Notice:</strong> Photos are analyzed securely and automatically deleted after 7 days. Face detection uses advanced AI for accurate matching.
                </AlertDescription>
              </Alert>

              {/* Instructions */}
              <Card className="bg-gray-50" data-testid="instructions-card">
                <CardHeader>
                  <CardTitle className="text-lg">For Best Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 mr-2"></span>
                      <span>Use a clear, well-lit photo showing the person's face</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 mr-2"></span>
                      <span>Avoid sunglasses, masks, or other face coverings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 mr-2"></span>
                      <span>Front-facing photos work best for facial recognition</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 mr-2"></span>
                      <span>Higher resolution images provide better matching accuracy</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !photo}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="submit-photo-search-button"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Search by Photo
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm" data-testid="footer-note">
          <p>Estimated processing time: 3-5 minutes</p>
          <p className="mt-2">Results will show matching profiles with confidence scores</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoSearchPage;
