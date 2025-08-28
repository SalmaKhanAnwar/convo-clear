import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Globe, 
  Play, 
  Pause, 
  Square,
  MoreHorizontal,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Meeting {
  id: string;
  title: string;
  platform: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  participant_count: number;
  languages_used: string[];
  status: string;
  has_recording: boolean;
  has_transcript: boolean;
}

const Meetings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  const fetchMeetings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setMeetings(data);
        setActiveMeetings(data.filter(meeting => meeting.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      meet: '🟢',
      teams: '🔵',
      zoom: '🔷'
    };
    return icons[platform as keyof typeof icons] || '📹';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      completed: 'secondary',
      scheduled: 'outline',
      cancelled: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'active' && <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-display">Meetings</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Meetings</h1>
          <p className="text-muted-foreground">
            Manage your translation sessions and meeting history
          </p>
        </div>
        <Button 
          className="btn-hero"
          onClick={() => navigate('/dashboard/meetings/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Meeting
        </Button>
      </div>

      {/* Active Meetings Alert */}
      {activeMeetings.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              {activeMeetings.length} Active Translation{activeMeetings.length !== 1 ? 's' : ''}
            </CardTitle>
            <CardDescription className="text-green-700">
              You have ongoing translation sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getPlatformIcon(meeting.platform)}</span>
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.participant_count} participants • {meeting.languages_used.join(', ')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/dashboard/meetings/${meeting.id}/live`)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search meetings..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Meetings Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Meetings</TabsTrigger>
          <TabsTrigger value="active">Active ({activeMeetings.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No meetings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first translated meeting to see it here
                </p>
                <Button 
                  className="btn-hero"
                  onClick={() => navigate('/dashboard/meetings/new')}
                >
                  Create Meeting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredMeetings.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{getPlatformIcon(meeting.platform)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{meeting.title}</h3>
                            {getStatusBadge(meeting.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(meeting.start_time)}</span>
                            </div>
                            {meeting.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(meeting.duration_minutes)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{meeting.participant_count} participants</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>{meeting.languages_used.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.has_recording && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {meeting.status === 'active' ? (
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/dashboard/meetings/${meeting.id}/live`)}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Join
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/dashboard/meetings/${meeting.id}`)}
                          >
                            View Details
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {/* Active meetings content */}
          <div className="grid gap-4">
            {activeMeetings.map((meeting) => (
              <Card key={meeting.id} className="border-green-200">
                {/* Same card content as above but filtered for active */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          {/* Completed meetings */}
        </TabsContent>

        <TabsContent value="scheduled">
          {/* Scheduled meetings */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Meetings;