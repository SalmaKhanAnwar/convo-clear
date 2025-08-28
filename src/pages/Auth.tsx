import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { user, signUp, signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Form states
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: ''
  });

  const [resetEmail, setResetEmail] = useState('');

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(signUpData.email, signUpData.password, {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        company_name: signUpData.companyName
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account, then sign in."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions."
        });
        setShowResetPassword(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowResetPassword(false)}
              className="absolute left-4 top-4 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full btn-hero">
                {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
                Send Reset Link
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">ML</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold font-display">MeetingLingo</h1>
          <p className="text-muted-foreground">Real-time AI translation for video calls</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your MeetingLingo account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signInEmail">Email</Label>
                    <Input
                      id="signInEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signInPassword">Password</Label>
                    <Input
                      id="signInPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={signInData.rememberMe}
                      onCheckedChange={(checked) => setSignInData({ ...signInData, rememberMe: checked as boolean })}
                    />
                    <Label htmlFor="rememberMe" className="text-sm">Remember me</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" disabled={loading} className="w-full btn-hero">
                    {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-muted-foreground"
                  >
                    Forgot your password?
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Create your account</CardTitle>
                <CardDescription>Start your 7-day free trial today</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Inc."
                      value={signUpData.companyName}
                      onChange={(e) => setSignUpData({ ...signUpData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signUpEmail">Email</Label>
                    <Input
                      id="signUpEmail"
                      type="email"
                      placeholder="john@acme.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signUpPassword">Password</Label>
                    <Input
                      id="signUpPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={loading} className="w-full btn-hero">
                    {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : null}
                    Start 7-Day Free Trial
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground">
          <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;