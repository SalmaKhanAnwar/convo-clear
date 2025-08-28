import { Video, Globe, Bot, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Video,
      title: "Seamless Integration",
      description: "Works natively with Microsoft Teams, Zoom, and Google Meet. No downloads required for participants.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Globe,
      title: "60+ Languages",
      description: "Real-time translation across 60+ languages with AI-powered accuracy and natural conversation flow.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Bot,
      title: "One Bot Solution",
      description: "Single AI bot handles all participants. Simple setup, zero friction for your team and clients.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Privacy-First Security",
      description: "Enterprise-grade security with no data storage. SOC2 compliant and GDPR ready.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold font-display">
            Break Down Language Barriers
            <span className="block text-gradient">in Every Meeting</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your global communications with AI-powered real-time translation 
            that works seamlessly across all major video platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card-feature group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-display">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 pt-20 border-t border-border">
          <div className="text-center space-y-2">
            <div className="text-3xl lg:text-4xl font-bold text-gradient">99.9%</div>
            <div className="text-sm text-muted-foreground font-medium">Translation Accuracy</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl lg:text-4xl font-bold text-gradient">&lt;200ms</div>
            <div className="text-sm text-muted-foreground font-medium">Average Latency</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl lg:text-4xl font-bold text-gradient">24/7</div>
            <div className="text-sm text-muted-foreground font-medium">Support Available</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;