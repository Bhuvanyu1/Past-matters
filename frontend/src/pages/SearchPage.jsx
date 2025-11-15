import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Search, Shield, FileText, Users, AlertTriangle, Camera } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SearchPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    state: '',
    email: '',
    phone: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStateChange = (value) => {
    setFormData(prev => ({ ...prev, state: value }));
  };

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('dob', formData.dob);
      if (formData.state) formDataToSend.append('state', formData.state);
      if (formData.email) formDataToSend.append('email', formData.email);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (photo) formDataToSend.append('photo', photo);

      const response = await axios.post(`${API}/search`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Search initiated successfully!');
      navigate(`/results/${response.data.job_id}`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8" data-testid="search-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-4 shadow-lg" data-testid="logo">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3" style={{ fontFamily: 'Space Grotesk' }} data-testid="main-heading">
            Past Matters
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="tagline">
            Make informed decisions with comprehensive background verification
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm" data-testid="feature-card-court">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Court Records</h3>
                  <p className="text-sm text-gray-600">Legal case history</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm" data-testid="feature-card-social">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Social Profiles</h3>
                  <p className="text-sm text-gray-600">Dating & matrimonial</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm" data-testid="feature-card-risk">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
                  <p className="text-sm text-gray-600">AI-powered analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Form */}
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm" data-testid="search-form-card">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Background Verification</CardTitle>
            <CardDescription className="text-purple-100">
              Enter details to begin comprehensive analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  data-testid="input-name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={`h-12 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-red-500" data-testid="error-name">{errors.name}</p>}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-gray-700 font-medium">Date of Birth *</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  data-testid="input-dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className={`h-12 ${errors.dob ? 'border-red-500' : ''}`}
                />
                {errors.dob && <p className="text-sm text-red-500" data-testid="error-dob">{errors.dob}</p>}
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-700 font-medium">State (Optional)</Label>
                <Select onValueChange={handleStateChange} value={formData.state}>
                  <SelectTrigger className="h-12" data-testid="select-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map(state => (
                      <SelectItem key={state} value={state} data-testid={`state-option-${state.replace(/\s+/g, '-').toLowerCase()}`}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  data-testid="input-email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="h-12"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="h-12"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Photo (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
                  {photoPreview ? (
                    <div className="flex items-center space-x-4" data-testid="photo-preview-container">
                      <img src={photoPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" data-testid="photo-preview" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        data-testid="remove-photo-btn"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer" data-testid="photo-upload-label">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 mb-1">Click to upload photo</span>
                      <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        data-testid="input-photo"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <Alert className="bg-amber-50 border-amber-200" data-testid="disclaimer-alert">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  By proceeding, you confirm you have legitimate reasons for this search. Data sourced from publicly available records only.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="submit-search-btn"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Initiating Search...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Search className="w-5 h-5 mr-2" />
                    Begin Verification
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm" data-testid="footer">
          <p>Estimated processing time: 2-5 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
