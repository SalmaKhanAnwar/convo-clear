import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { User, Settings, CreditCard, LogOut, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  plan_type: string;
  trial_end_date: string;
}

interface Profile {
  first_name: string;
  last_name: string;
  company_name: string;
  avatar_url?: string;
}

const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, company_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // Fetch user's team
        const { data: teamData } = await supabase
          .from('teams')
          .select('id, name, plan_type, trial_end_date')
          .eq('owner_id', user.id)
          .single();

        if (teamData) {
          setTeam(teamData);
          
          // Calculate days remaining in trial
          const trialEndDate = new Date(teamData.trial_end_date);
          const today = new Date();
          const timeDiff = trialEndDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
          setDaysRemaining(Math.max(0, daysLeft));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "Come back soon!"
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'User';
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="lg:hidden" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ML</span>
            </div>
            <span className="text-xl font-bold font-display hidden sm:block">MeetingLingo</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Trial Status */}
          {team?.plan_type === 'trial' && (
            <div className="flex items-center space-x-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
              <Clock className="w-4 h-4" />
              <span>{daysRemaining} days left</span>
              <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6">
                Upgrade
              </Button>
            </div>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} alt={getDisplayName()} />
                  <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {profile?.company_name && (
                  <p className="text-xs text-muted-foreground">{profile.company_name}</p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;