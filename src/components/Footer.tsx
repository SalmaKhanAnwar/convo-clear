import { Globe, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ML</span>
              </div>
              <span className="text-xl font-bold font-display text-background">MeetingLingo</span>
            </div>
            <p className="text-sm text-background/70 max-w-xs">
              Real-time AI translation for video calls. Break language barriers instantly.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="text-background/70 hover:text-background transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#pricing" className="text-background/70 hover:text-background transition-colors">Pricing</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Affiliate Program</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Integrations</a></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Use Cases</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Sales & Demos</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Customer Success</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Marketing Webinars</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">User Research</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">HR Interviews</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Team Syncs</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Security</a></li>
              <li><a href="#" className="text-background/70 hover:text-background transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-background/70">
              © 2024 MeetingLingo. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-background/70">
              <span>SOC2 Type II Compliant</span>
              <span>GDPR Ready</span>
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;