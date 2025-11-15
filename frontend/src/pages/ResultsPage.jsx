import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Clock, FileText, Users, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResultsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [progress, setProgress] = useState({ overall: 0, stages: {} });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  const checkStatus = async () => {
    try {
      const response = await axios.get(`${API}/search/${jobId}/status`);
      setStatus(response.data.status);
      setProgress(response.data.progress);

      if (response.data.status === 'completed') {
        await fetchResults();
      } else if (response.data.status === 'failed') {
        setError(response.data.error || 'Search failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Status check error:', err);
      setError('Failed to check status');
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API}/search/${jobId}/result`);
      setResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch results error:', err);
      setError('Failed to fetch results');
      setLoading(false);
    }
  };

  const getRiskColor = (category) => {
    const colors = {
      low: 'bg-green-500',
      moderate: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getRiskBadgeVariant = (category) => {
    const variants = {
      low: 'default',
      moderate: 'secondary',
      high: 'destructive',
      critical: 'destructive'
    };
    return variants[category] || 'default';
  };

  if (loading && status !== 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4" data-testid="loading-container">
        <div className="max-w-3xl mx-auto">
          <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center" style={{ fontFamily: 'Space Grotesk' }}>
                <Clock className="w-6 h-6 mr-2 animate-spin" />
                Processing Your Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full mb-4 animate-pulse">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid="progress-title">Analyzing Data</h3>
                  <p className="text-gray-600" data-testid="progress-percentage">Overall Progress: {progress.overall}%</p>
                </div>

                <Progress value={progress.overall} className="h-2" data-testid="overall-progress" />

                <div className="space-y-3">
                  {Object.entries(progress.stages).map(([stage, value]) => (
                    <div key={stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 capitalize" data-testid={`stage-label-${stage}`}>{stage.replace(/_/g, ' ')}</span>
                        <span className="text-gray-500" data-testid={`stage-progress-${stage}`}>{value}%</span>
                      </div>
                      <Progress value={value} className="h-1" data-testid={`stage-progress-bar-${stage}`} />
                    </div>
                  ))}
                </div>

                <Alert className="bg-blue-50 border-blue-200" data-testid="processing-alert">
                  <AlertDescription className="text-blue-800 text-sm">
                    We're scanning court records, matrimonial sites, dating platforms, and social media profiles. This may take 2-5 minutes.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4" data-testid="error-container">
        <div className="max-w-3xl mx-auto">
          <Card className="border-none shadow-2xl">
            <CardContent className="p-8 text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Failed</h3>
              <p className="text-gray-600 mb-6" data-testid="error-message">{error}</p>
              <Button onClick={() => navigate('/')} data-testid="back-to-search-btn">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4" data-testid="results-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/')} className="shadow-md" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Search
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk' }}>Past Matters</span>
          </div>
        </div>

        {/* Subject Info */}
        <Card className="border-none shadow-lg mb-6 bg-white/90 backdrop-blur-sm" data-testid="subject-info-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="subject-name">{result.subject.name}</h2>
                <p className="text-gray-600" data-testid="subject-dob">Date of Birth: {result.subject.dob}</p>
              </div>
              <Badge variant="outline" className="text-sm" data-testid="generated-at">
                Generated: {new Date(result.generated_at).toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Card */}
        <Card className="border-none shadow-2xl mb-8 overflow-hidden" data-testid="risk-score-card">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Risk Assessment</h3>
            <p className="text-purple-100">Comprehensive analysis based on multiple data sources</p>
          </div>
          <CardContent className="p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(result.risk_score.overall_score / 100) * 502} 502`}
                    className={getRiskColor(result.risk_score.risk_category)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-gray-900" data-testid="risk-score-value">{result.risk_score.overall_score}</span>
                  <span className="text-sm text-gray-600">Risk Score</span>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <Badge 
                className={`${getRiskColor(result.risk_score.risk_category)} text-white text-lg px-6 py-2`}
                data-testid="risk-category-badge"
              >
                {result.risk_score.risk_category.toUpperCase()} RISK
              </Badge>
              <p className="text-sm text-gray-600 mt-2" data-testid="confidence-level">
                Confidence: {result.risk_score.confidence_level}%
              </p>
              {result.subject.photo_matched && (
                <div className="mt-3 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg" data-testid="photo-match-badge">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Photo Matched
                  {result.subject.photo_info && result.subject.photo_info.face_count > 0 && (
                    <span className="ml-2 text-xs">
                      ({result.subject.photo_info.face_count} face{result.subject.photo_info.face_count > 1 ? 's' : ''} detected)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-red-50" data-testid="legal-score-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Legal</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="legal-score">{result.risk_score.breakdown.legal_score}</p>
                    </div>
                    <FileText className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50" data-testid="relationship-score-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Relationship</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="relationship-score">{result.risk_score.breakdown.relationship_score}</p>
                    </div>
                    <Users className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50" data-testid="social-score-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Social Behavior</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="social-score">{result.risk_score.breakdown.social_behavior_score}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contributing Factors */}
            <div className="bg-gray-50 rounded-lg p-4" data-testid="contributing-factors">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Key Findings
              </h4>
              <ul className="space-y-2">
                {result.risk_score.contributing_factors.map((factor, index) => (
                  <li key={index} className="flex items-start" data-testid={`factor-${index}`}>
                    <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-2"></span>
                    <span className="text-gray-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results Tabs */}
        <Tabs defaultValue="court" className="space-y-4" data-testid="details-tabs">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-md" data-testid="tabs-list">
            <TabsTrigger value="court" data-testid="tab-court">Court Cases ({result.court_cases.length})</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">Social Profiles ({result.social_profiles.length})</TabsTrigger>
            <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="court" data-testid="court-cases-content">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Court Records</CardTitle>
              </CardHeader>
              <CardContent>
                {result.court_cases.length > 0 ? (
                  <div className="space-y-4">
                    {result.court_cases.map((courtCase, index) => (
                      <Card key={index} className="bg-gray-50" data-testid={`court-case-${index}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className="mb-2" data-testid={`case-type-${index}`}>{courtCase.case_type}</Badge>
                              <p className="font-semibold text-gray-900" data-testid={`case-number-${index}`}>{courtCase.case_number}</p>
                            </div>
                            <Badge variant="outline" className="text-xs" data-testid={`severity-${index}`}>
                              Severity: {courtCase.severity_score}/10
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p data-testid={`court-name-${index}`}><strong>Court:</strong> {courtCase.court_name}</p>
                            <p data-testid={`filing-date-${index}`}><strong>Filed:</strong> {courtCase.filing_date}</p>
                            <p data-testid={`case-status-${index}`}><strong>Status:</strong> {courtCase.status}</p>
                            <p data-testid={`case-summary-${index}`} className="mt-2">{courtCase.summary}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-court-cases">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">No court cases found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" data-testid="social-profiles-content">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Social & Dating Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                {result.social_profiles.length > 0 ? (
                  <div className="space-y-4">
                    {result.social_profiles.map((profile, index) => (
                      <Card key={index} className="bg-gray-50" data-testid={`social-profile-${index}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className="mb-2" data-testid={`platform-${index}`}>{profile.platform}</Badge>
                              <p className="text-sm text-gray-600" data-testid={`profile-url-${index}`}>{profile.profile_url}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {profile.created_date && (
                              <p data-testid={`created-date-${index}`}><strong>Created:</strong> {profile.created_date}</p>
                            )}
                            <p data-testid={`status-changes-${index}`}><strong>Status Changes:</strong> {profile.relationship_status_history.length}</p>
                            {profile.activity_pattern.last_active && (
                              <p data-testid={`last-active-${index}`}><strong>Last Active:</strong> {profile.activity_pattern.last_active}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-social-profiles">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">No social profiles found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" data-testid="timeline-content">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Relationship History Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {result.relationship_timeline.length > 0 ? (
                  <div className="space-y-4">
                    {result.relationship_timeline.map((event, index) => (
                      <div key={index} className="flex items-start space-x-4" data-testid={`timeline-event-${index}`}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                        </div>
                        <Card className="flex-1 bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm text-gray-500" data-testid={`timeline-date-${index}`}>{event.date}</p>
                                <p className="text-gray-900" data-testid={`timeline-change-${index}`}>
                                  {event.previous_status} → {event.new_status}
                                </p>
                              </div>
                              <Badge variant="outline" data-testid={`timeline-platform-${index}`}>{event.platform}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="no-timeline">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No relationship history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResultsPage;
