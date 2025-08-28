import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Users, 
  BarChart, 
  Globe, 
  Video,
  Plus,
  Calendar,
  Settings
} from 'lucide-react';

interface TeamData {
  id: string;
  name: string;
  plan_type: string;
  trial_end_date: string;
  max_members: number;
  max_minutes: number;
}

interface Integration {
  platform: string;
  is_connected: boolean;
}

interface Meeting {
  id: string;
  title: string;
  platform: string;
  start_time: string;
  duration_minutes: number;
  participant_count: number;
  languages_used: string[];
  status: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState({
    minutesUsed: 0,
    activeMeetings: 0,
    totalMembers: 1
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch team data
        const { data: teamData } = await supabase
          .from('teams')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (teamData) {
          setTeam(teamData);
        }

        // Fetch integrations
        const { data: integrationsData } = await supabase
          .from('integrations')
          .select('platform, is_connected')
          .eq('team_id', teamData?.id);

        if (integrationsData) {
          setIntegrations(integrationsData);
        }

        // Fetch recent meetings
        const { data: meetingsData } = await supabase
          .from('meetings')
          .select('*')
          .eq('team_id', teamData?.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (meetingsData) {
          setRecentMeetings(meetingsData);
          
          // Calculate stats
          const totalMinutes = meetingsData.reduce((sum, meeting) => 
            sum + (meeting.duration_minutes || 0), 0
          );
          const activeMeetings = meetingsData.filter(m => m.status === 'active').length;
          
          setStats({
            minutesUsed: totalMinutes,
            activeMeetings,
            totalMembers: 1 // Will be updated when we have team members
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getTrialDaysRemaining = () => {
    if (!team?.trial_end_date) return 0;
    const trialEndDate = new Date(team.trial_end_date);
    const today = new Date();
    const timeDiff = trialEndDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  };

  const getUsagePercentage = () => {
    if (!team?.max_minutes) return 0;
    return Math.min(100, (stats.minutesUsed / team.max_minutes) * 100);
  };

  const connectedIntegrations = integrations.filter(i => i.is_connected);
  const totalIntegrations = integrations.length;

  const platformIcons = {
    meet: '🟢',
    teams: '🔵', 
    zoom: '🔷'
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-display">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your translations today.
        </p>
      </div>

      {/* Quick Start Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Start Your First Translation
              </CardTitle>
              <CardDescription>
                Ready to break down language barriers? Let's get you set up.
              </CardDescription>
            </div>
            <Button className="btn-hero">
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minutes Used</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.minutesUsed}</div>
            <div className="space-y-2 mt-2">
              <Progress value={getUsagePercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {team?.max_minutes ? `${team.max_minutes - stats.minutesUsed} minutes remaining` : 'Unlimited'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMeetings}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently translating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60+</div>
            <p className="text-xs text-muted-foreground mt-2">
              Supported languages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {team?.max_members ? `${team.max_members - stats.totalMembers} slots available` : 'Unlimited'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Platform Integrations
            </CardTitle>
            <CardDescription>
              Connect your video platforms to start translating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.platform} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{platformIcons[integration.platform as keyof typeof platformIcons]}</span>
                  <div>
                    <p className="font-medium capitalize">{integration.platform === 'meet' ? 'Google Meet' : integration.platform}</p>
                    <p className="text-sm text-muted-foreground">
                      {integration.is_connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <Badge variant={integration.is_connected ? 'default' : 'secondary'}>
                  {integration.is_connected ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                  {integration.is_connected ? 'Connected' : 'Connect'}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              Manage Integrations
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest meetings and translations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMeetings.length > 0 ? (
              <div className="space-y-4">
                {recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(meeting.start_time).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{meeting.duration_minutes}m</span>
                        <span>•</span>
                        <span className="capitalize">{meeting.platform}</span>
                      </div>
                    </div>
                    <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                      {meeting.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Meetings
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No meetings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first translated meeting to see activity here
                </p>
                <Button className="btn-hero">
                  Schedule Meeting
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Checklist */}
      {connectedIntegrations.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to start translating your meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-muted rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-muted rounded-full"></div>
                </div>
                <span className="text-sm">Connect your first video platform</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Invite team members</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Schedule your first translated meeting</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Set up language preferences</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Status */}
      {team?.plan_type === 'trial' && (
        <Card className="border border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800">Free Trial</CardTitle>
            <CardDescription className="text-orange-700">
              {getTrialDaysRemaining()} days remaining in your trial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-orange-700">
                Upgrade now to continue using MeetingLingo after your trial ends
              </p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;