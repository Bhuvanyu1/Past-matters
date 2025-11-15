import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Share2, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { RiskBreakdownChart, RiskComparisonChart, RiskRadarChart, TimelineChart, ProfileDistributionChart } from '@/components/RiskCharts';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalyticsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [jobId]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API}/search/${jobId}/result`);
      setResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch results error:', err);
      toast.error('Failed to load analytics');
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info('Generating PDF...');
      const response = await axios.get(`${API}/search/${jobId}/export/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `past_matters_report_${result.subject.name.replace(/\\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center\" data-testid=\"analytics-loading\">
        <div className=\"text-center\">
          <div className=\"w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4\" data-testid=\"analytics-page\">
      <div className=\"max-w-7xl mx-auto\">
        {/* Header */}
        <div className=\"flex items-center justify-between mb-8\">
          <div className=\"flex items-center space-x-4\">
            <Button variant=\"outline\" onClick={() => navigate(`/results/${jobId}`)} className=\"shadow-md\" data-testid=\"back-to-results-btn\">
              <ArrowLeft className=\"w-4 h-4 mr-2\" />
              Back to Results
            </Button>
            <div className=\"flex items-center space-x-2\">
              <BarChart3 className=\"w-5 h-5 text-purple-600\" />
              <span className=\"font-semibold text-gray-900\" style={{ fontFamily: 'Space Grotesk' }}>Analytics Dashboard</span>
            </div>
          </div>
          <Button onClick={handleExportPDF} className=\"bg-purple-600 hover:bg-purple-700\" data-testid=\"export-pdf-btn\">
            <Download className=\"w-4 h-4 mr-2\" />
            Export PDF
          </Button>
        </div>

        {/* Subject Summary */}
        <Card className=\"mb-6 bg-white/90 backdrop-blur-sm shadow-xl\" data-testid=\"subject-summary\">
          <CardHeader className=\"bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg\">
            <CardTitle className=\"text-2xl\" style={{ fontFamily: 'Space Grotesk' }}>
              {result.subject.name} - Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className=\"p-6\">
            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
              <div className=\"text-center\" data-testid=\"overall-score-stat\">
                <p className=\"text-sm text-gray-600 mb-2\">Overall Risk Score</p>
                <p className=\"text-4xl font-bold text-purple-600\">{result.risk_score.overall_score}</p>
              </div>
              <div className=\"text-center\" data-testid=\"legal-score-stat\">
                <p className=\"text-sm text-gray-600 mb-2\">Legal Risk</p>
                <p className=\"text-4xl font-bold text-red-600\">{result.risk_score.breakdown.legal_score}</p>
              </div>
              <div className=\"text-center\" data-testid=\"relationship-score-stat\">
                <p className=\"text-sm text-gray-600 mb-2\">Relationship Risk</p>
                <p className=\"text-4xl font-bold text-yellow-600\">{result.risk_score.breakdown.relationship_score}</p>
              </div>
              <div className=\"text-center\" data-testid=\"social-score-stat\">
                <p className=\"text-sm text-gray-600 mb-2\">Social Risk</p>
                <p className=\"text-4xl font-bold text-blue-600\">{result.risk_score.breakdown.social_behavior_score}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <Tabs defaultValue=\"breakdown\" className=\"space-y-4\" data-testid=\"analytics-tabs\">
          <TabsList className=\"grid w-full grid-cols-4 bg-white shadow-md\" data-testid=\"tabs-list\">
            <TabsTrigger value=\"breakdown\" data-testid=\"tab-breakdown\">Breakdown</TabsTrigger>
            <TabsTrigger value=\"comparison\" data-testid=\"tab-comparison\">Comparison</TabsTrigger>
            <TabsTrigger value=\"radar\" data-testid=\"tab-radar\">Profile</TabsTrigger>
            <TabsTrigger value=\"distribution\" data-testid=\"tab-distribution\">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value=\"breakdown\" data-testid=\"breakdown-content\">
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <RiskBreakdownChart riskScore={result.risk_score} />
              {result.relationship_timeline && result.relationship_timeline.length > 0 && (
                <TimelineChart relationshipTimeline={result.relationship_timeline} />
              )}
            </div>
          </TabsContent>

          <TabsContent value=\"comparison\" data-testid=\"comparison-content\">
            <RiskComparisonChart riskScore={result.risk_score} />
          </TabsContent>

          <TabsContent value=\"radar\" data-testid=\"radar-content\">
            <RiskRadarChart riskScore={result.risk_score} />
          </TabsContent>

          <TabsContent value=\"distribution\" data-testid=\"distribution-content\">
            {result.social_profiles && result.social_profiles.length > 0 ? (
              <ProfileDistributionChart socialProfiles={result.social_profiles} />
            ) : (
              <Card className=\"bg-white\">
                <CardContent className=\"p-12 text-center\">
                  <p className=\"text-gray-600\">No social profiles found to display distribution</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Statistics Grid */}
        <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6 mt-6\">
          <Card className=\"bg-white shadow-lg\" data-testid=\"court-cases-stat\">
            <CardHeader>
              <CardTitle className=\"text-lg\">Court Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className=\"text-4xl font-bold text-gray-900\">{result.court_cases?.length || 0}</p>
              <p className=\"text-sm text-gray-600 mt-2\">Total cases found</p>
            </CardContent>
          </Card>

          <Card className=\"bg-white shadow-lg\" data-testid=\"social-profiles-stat\">
            <CardHeader>
              <CardTitle className=\"text-lg\">Social Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className=\"text-4xl font-bold text-gray-900\">{result.social_profiles?.length || 0}</p>
              <p className=\"text-sm text-gray-600 mt-2\">Profiles discovered</p>
            </CardContent>
          </Card>

          <Card className=\"bg-white shadow-lg\" data-testid=\"status-changes-stat\">
            <CardHeader>
              <CardTitle className=\"text-lg\">Status Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className=\"text-4xl font-bold text-gray-900\">{result.relationship_timeline?.length || 0}</p>
              <p className=\"text-sm text-gray-600 mt-2\">Relationship updates</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
