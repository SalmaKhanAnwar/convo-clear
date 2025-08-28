import { Button } from "@/components/ui/button";
import { Play, Users, Shield, Globe } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";

const Hero = () => {
  return (
    <section className="section-hero py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold font-display leading-tight">
                Real-Time AI Translator
                <span className="block text-gradient">for Video Calls</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-lg">
                Break language barriers instantly - communicate with anyone, anywhere, 
                in any language during your video calls
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="btn-hero text-lg px-8 py-4">
                Start 7-day free trial
              </Button>
              <Button variant="outline" className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Schedule Demo
              </Button>
            </div>

            {/* Integration Badges */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Works seamlessly with:</p>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">T</span>
                  </div>
                  Microsoft Teams
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Z</span>
                  </div>
                  Zoom
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 bg-green-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  Google Meet
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-float">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="AI Translation in video calls" 
                className="w-full h-auto"
              />
              
              {/* Video Play Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group cursor-pointer hover:bg-black/30 transition-all">
                <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-primary ml-1" />
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-border">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">60+ Languages</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border border-border">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">SOC2 Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-20 text-center space-y-6">
          <p className="text-sm text-muted-foreground font-medium">
            Trusted by teams in 50+ countries
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {/* Placeholder company logos */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-24 h-8 bg-muted rounded flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">Company</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;