import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Users,
  Plus,
  Settings,
  Mail,
  Shield,
  Crown,
  UserCheck,
  Clock,
  MoreHorizontal,
  Copy,
  Trash2
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  created_at: string;
  profiles: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  // Mock additional data
  email: string;
  last_active: string;
  meetings_count: number;
  status: 'active' | 'pending' | 'inactive';
}

interface TeamData {
  id: string;
  name: string;
  subscription_tier: string;
  users_limit: number;
  owner_id: string;
}

interface EnterpriseFeatures {
  sso_enabled: boolean;
  custom_branding: boolean;
  api_access: boolean;
  dedicated_support: boolean;
  data_retention_days: number;
}

const Team = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [enterpriseFeatures, setEnterpriseFeatures] = useState<EnterpriseFeatures>({
    sso_enabled: false,
    custom_branding: false,
    api_access: false,
    dedicated_support: false,
    data_retention_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
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

          // Fetch team members with profiles
          const { data: membersData } = await supabase
            .from('user_roles')
            .select('*')
            .eq('team_id', teamData.id);

          // Fetch profiles separately to avoid relation issues
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, avatar_url');

          if (membersData && profilesData) {
            // Enrich member data with profiles
            const enrichedMembers = membersData.map(member => {
              const profile = profilesData.find(p => p.user_id === member.user_id);
              return {
                ...member,
                profiles: profile || { first_name: '', last_name: '', avatar_url: '' },
                email: `user${member.user_id.slice(-4)}@example.com`,
                last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                meetings_count: Math.floor(Math.random() * 20),
                status: 'active' as const
              };
            });
            setMembers(enrichedMembers);
          }

          // Fetch enterprise features
          const { data: featuresData } = await supabase
            .from('enterprise_features')
            .select('*')
            .eq('team_id', teamData.id)
            .single();

          if (featuresData) {
            setEnterpriseFeatures(featuresData);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

  const handleInviteMember = async () => {
    if (!inviteEmail || !team) return;

    setIsInviting(true);
    try {
      // In a real app, this would send an email invitation
      // For now, we'll just show a success message
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
      
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const updateEnterpriseFeature = async (feature: keyof EnterpriseFeatures, value: boolean | number) => {
    if (!team) return;

    try {
      const { error } = await supabase
        .from('enterprise_features')
        .upsert({
          team_id: team.id,
          [feature]: value
        });

      if (error) throw error;

      setEnterpriseFeatures(prev => ({ ...prev, [feature]: value }));
      
      toast({
        title: "Settings Updated",
        description: "Enterprise feature settings have been updated",
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature settings",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'member':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'viewer':
        return <Shield className="w-4 h-4 text-gray-500" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      inactive: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading team information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and collaboration settings
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="btn-hero">
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your MeetingLingo team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(value: 'member' | 'viewer') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member - Can create and join meetings</SelectItem>
                    <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleInviteMember}
                disabled={!inviteEmail || isInviting}
                className="btn-hero"
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              {team?.users_limit && team.users_limit > 0
                ? `${team.users_limit - members.length} slots available`
                : 'Unlimited slots'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{team?.subscription_tier || 'Trial'}</div>
            <p className="text-xs text-muted-foreground">
              Current subscription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage team member roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url} />
                    <AvatarFallback>
                      {member.profiles?.first_name?.[0]}{member.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </p>
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span>{member.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last active: {new Date(member.last_active).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                    <br />
                    {getStatusBadge(member.status)}
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No team members yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite colleagues to collaborate on translations
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="btn-hero">
                      <Plus className="w-4 h-4 mr-2" />
                      Invite First Member
                    </Button>
                  </DialogTrigger>
                  {/* Same DialogContent as above */}
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Features */}
      {team?.subscription_tier === 'enterprise' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Enterprise Features
            </CardTitle>
            <CardDescription>
              Advanced security and customization options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Single Sign-On (SSO)</p>
                    <p className="text-sm text-muted-foreground">SAML/OIDC authentication</p>
                  </div>
                  <Button
                    variant={enterpriseFeatures.sso_enabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateEnterpriseFeature('sso_enabled', !enterpriseFeatures.sso_enabled)}
                  >
                    {enterpriseFeatures.sso_enabled ? 'Enabled' : 'Enable'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Custom Branding</p>
                    <p className="text-sm text-muted-foreground">White-label interface</p>
                  </div>
                  <Button
                    variant={enterpriseFeatures.custom_branding ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateEnterpriseFeature('custom_branding', !enterpriseFeatures.custom_branding)}
                  >
                    {enterpriseFeatures.custom_branding ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">API Access</p>
                    <p className="text-sm text-muted-foreground">REST API for integrations</p>
                  </div>
                  <Button
                    variant={enterpriseFeatures.api_access ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateEnterpriseFeature('api_access', !enterpriseFeatures.api_access)}
                  >
                    {enterpriseFeatures.api_access ? 'Enabled' : 'Enable'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dedicated Support</p>
                    <p className="text-sm text-muted-foreground">Priority support channel</p>
                  </div>
                  <Button
                    variant={enterpriseFeatures.dedicated_support ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateEnterpriseFeature('dedicated_support', !enterpriseFeatures.dedicated_support)}
                  >
                    {enterpriseFeatures.dedicated_support ? 'Enabled' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <Label htmlFor="retention">Data Retention (days)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  id="retention"
                  type="number"
                  min="1"
                  max="2555"
                  value={enterpriseFeatures.data_retention_days}
                  onChange={(e) => updateEnterpriseFeature('data_retention_days', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  Meeting recordings and transcripts retention period
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Team Settings
          </CardTitle>
          <CardDescription>
            General team configuration and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={team?.name || ''}
                onChange={(e) => setTeam(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Your team name"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="font-medium text-destructive">Danger Zone</p>
                <p className="text-sm text-muted-foreground">
                  Irreversible actions that affect your entire team
                </p>
              </div>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;