import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = {
  low: '#22c55e',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
  legal: '#ef4444',
  relationship: '#eab308',
  social: '#3b82f6'
};

export const RiskBreakdownChart = ({ riskScore }) => {
  const data = [
    { name: 'Legal', value: riskScore.breakdown.legal_score, fill: COLORS.legal },
    { name: 'Relationship', value: riskScore.breakdown.relationship_score, fill: COLORS.relationship },
    { name: 'Social', value: riskScore.breakdown.social_behavior_score, fill: COLORS.social }
  ];

  return (
    <Card className="bg-white shadow-lg" data-testid="risk-breakdown-chart">
      <CardHeader>
        <CardTitle className="text-lg">Risk Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const RiskComparisonChart = ({ riskScore }) => {
  const data = [
    {
      category: 'Legal',
      score: riskScore.breakdown.legal_score,
      maxScore: 100
    },
    {
      category: 'Relationship',
      score: riskScore.breakdown.relationship_score,
      maxScore: 100
    },
    {
      category: 'Social',
      score: riskScore.breakdown.social_behavior_score,
      maxScore: 100
    }
  ];

  return (
    <Card className="bg-white shadow-lg" data-testid="risk-comparison-chart">
      <CardHeader>
        <CardTitle className="text-lg">Risk Categories Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="#6366f1" name="Score" />
            <Bar dataKey="maxScore" fill="#e5e7eb" name="Max" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const RiskRadarChart = ({ riskScore }) => {
  const data = [
    {
      subject: 'Legal',
      score: riskScore.breakdown.legal_score,
      fullMark: 100
    },
    {
      subject: 'Relationship',
      score: riskScore.breakdown.relationship_score,
      fullMark: 100
    },
    {
      subject: 'Social Behavior',
      score: riskScore.breakdown.social_behavior_score,
      fullMark: 100
    },
    {
      subject: 'Overall',
      score: riskScore.overall_score,
      fullMark: 100
    }
  ];

  return (
    <Card className="bg-white shadow-lg" data-testid="risk-radar-chart">
      <CardHeader>
        <CardTitle className="text-lg">Risk Profile Radar</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Risk Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const TimelineChart = ({ relationshipTimeline }) => {
  if (!relationshipTimeline || relationshipTimeline.length === 0) {
    return null;
  }

  const data = relationshipTimeline.slice(0, 10).reverse().map((event, index) => ({
    index: index + 1,
    date: event.date,
    platform: event.platform,
    change: 1
  }));

  return (
    <Card className="bg-white shadow-lg" data-testid="timeline-chart">
      <CardHeader>
        <CardTitle className="text-lg">Relationship Status Changes Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" label={{ value: 'Event #', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                      <p className="font-semibold">{data.platform}</p>
                      <p className="text-sm text-gray-600">{data.date}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="change" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ProfileDistributionChart = ({ socialProfiles }) => {
  if (!socialProfiles || socialProfiles.length === 0) {
    return null;
  }

  // Count profiles by platform
  const platformCounts = {};
  socialProfiles.forEach(profile => {
    platformCounts[profile.platform] = (platformCounts[profile.platform] || 0) + 1;
  });

  const data = Object.entries(platformCounts).map(([platform, count]) => ({
    platform,
    count,
    fill: COLORS[platform.toLowerCase()] || '#6366f1'
  }));

  return (
    <Card className="bg-white shadow-lg" data-testid="profile-distribution-chart">
      <CardHeader>
        <CardTitle className="text-lg">Profile Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ platform, count }) => `${platform}: ${count}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
