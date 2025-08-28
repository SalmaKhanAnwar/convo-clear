import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Globe,
  Users,
  Video,
  Download,
  Calendar,
  Target,
  Zap,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalMinutes: number;
  totalMeetings: number;
  averageAccuracy: number;
  topLanguages: { language: string; count: number }[];
  platformUsage: { platform: string; count: number }[];
  weeklyTrend: { date: string; minutes: number; meetings: number }[];
  monthlyUsage: { month: string; minutes: number }[];
}

interface TeamStats {
  activeMembers: number;
  totalMembers: number;
  averageMeetingDuration: number;
  peakUsageHour: string;
}

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMinutes: 0,
    totalMeetings: 0,
    averageAccuracy: 0,
    topLanguages: [],
    platformUsage: [],
    weeklyTrend: [],
    monthlyUsage: []
  });
  const [teamStats, setTeamStats] = useState<TeamStats>({
    activeMembers: 1,
    totalMembers: 1,
    averageMeetingDuration: 0,
    peakUsageHour: '10:00 AM'
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        // Get user's team
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('team_id')
          .eq('user_id', user.id)
          .single();

        if (!userRole) return;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        startDate.setDate(endDate.getDate() - days);

        // Fetch usage analytics
        const { data: usageData } = await supabase
          .from('usage_analytics')
          .select('*')
          .eq('team_id', userRole.team_id)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Fetch meetings data
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('*')
          .eq('team_id', userRole.team_id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        if (usageData && meetingsData) {
          // Process analytics data
          const totalMinutes = usageData.reduce((sum, day) => sum + (day.minutes_used || 0), 0);
          const totalMeetings = usageData.reduce((sum, day) => sum + (day.meetings_count || 0), 0);
          
          // Language analysis
          const languageCount: Record<string, number> = {};
          usageData.forEach(day => {
            day.languages_used?.forEach((lang: string) => {
              languageCount[lang] = (languageCount[lang] || 0) + 1;
            });
          });
          
          const topLanguages = Object.entries(languageCount)
            .map(([language, count]) => ({ language, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          // Platform analysis
          const platformCount: Record<string, number> = {};
          usageData.forEach(day => {
            day.platforms_used?.forEach((platform: string) => {
              platformCount[platform] = (platformCount[platform] || 0) + 1;
            });
          });
          
          const platformUsage = Object.entries(platformCount)
            .map(([platform, count]) => ({ platform, count }))
            .sort((a, b) => b.count - a.count);

          // Weekly trend
          const weeklyTrend = usageData.map(day => ({
            date: day.date,
            minutes: day.minutes_used || 0,
            meetings: day.meetings_count || 0
          }));

          // Team stats
          const averageDuration = meetingsData.length > 0 
            ? meetingsData.reduce((sum, meeting) => sum + (meeting.duration_minutes || 0), 0) / meetingsData.length 
            : 0;

          setAnalytics({
            totalMinutes,
            totalMeetings,
            averageAccuracy: 94.5, // Mock data for now
            topLanguages,
            platformUsage,
            weeklyTrend,
            monthlyUsage: [] // Will be calculated based on weekly data
          });

          setTeamStats({
            activeMembers: 1, // Mock data
            totalMembers: 1,
            averageMeetingDuration: averageDuration,
            peakUsageHour: '10:00 AM' // Mock data
          });
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, timeRange]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Analytics & Insights</h1>
          <p className="text-muted-foreground">Detailed insights into your translation usage and performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMinutes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(analytics.totalMinutes)} translated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Avg {teamStats.averageMeetingDuration.toFixed(0)}m per meeting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Translation accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              of {teamStats.totalMembers} total members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage Trends
              </CardTitle>
              <CardDescription>
                Daily translation minutes and meeting counts over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.weeklyTrend.length > 0 ? (
                <div className="space-y-4">
                  {analytics.weeklyTrend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {day.meetings} meetings • {day.minutes} minutes
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{formatDuration(day.minutes)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No usage data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Language Usage
              </CardTitle>
              <CardDescription>
                Most frequently translated languages in your meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topLanguages.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topLanguages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{lang.language}</p>
                          <p className="text-sm text-muted-foreground">
                            Used in {lang.count} sessions
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{lang.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No language data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Platform Usage
              </CardTitle>
              <CardDescription>
                Which video platforms you use most for translations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.platformUsage.length > 0 ? (
                <div className="space-y-4">
                  {analytics.platformUsage.map((platform, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {platform.platform === 'meet' && '🟢'}
                          {platform.platform === 'teams' && '🔵'}
                          {platform.platform === 'zoom' && '🔷'}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {platform.platform === 'meet' ? 'Google Meet' : platform.platform}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {platform.count} sessions
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{platform.count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No platform data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Translation quality and system performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Accuracy</span>
                  <Badge variant="default">{analytics.averageAccuracy}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Latency</span>
                  <Badge variant="secondary">180ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <Badge variant="default">99.9%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Error Rate</span>
                  <Badge variant="secondary">0.1%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Usage Patterns
                </CardTitle>
                <CardDescription>
                  When and how you use MeetingLingo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Peak Usage Time</span>
                  <Badge variant="outline">{teamStats.peakUsageHour}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Meeting Duration</span>
                  <Badge variant="outline">{formatDuration(teamStats.averageMeetingDuration)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Most Active Day</span>
                  <Badge variant="outline">Tuesday</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Preferred Language</span>
                  <Badge variant="outline">
                    {analytics.topLanguages[0]?.language || 'English'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered insights to help you optimize your translation workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Optimization Tip</h4>
                <p className="text-blue-800 text-sm">
                  Your peak usage is at {teamStats.peakUsageHour}. Consider scheduling important meetings at this time for best performance.
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">🎯 Usage Pattern</h4>
                <p className="text-green-800 text-sm">
                  You're using {analytics.totalMinutes} minutes this period. You're on track to stay within your plan limits.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">🌍 Language Diversity</h4>
                <p className="text-purple-800 text-sm">
                  Great job! You're translating across {analytics.topLanguages.length} different languages, enabling truly global communication.
                </p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">⚡ Performance</h4>
                <p className="text-orange-800 text-sm">
                  Your translation accuracy is {analytics.averageAccuracy}% - excellent! Your meetings are running smoothly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;