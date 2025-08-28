import { TrendingUp, HeadphonesIcon, Megaphone, Search, Users, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const UseCases = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const useCases = [
    {
      icon: TrendingUp,
      title: "Sales & Demos",
      description: "Close deals across language barriers. Demonstrate products to global prospects with real-time translation.",
      benefits: ["Expand to new markets", "Higher conversion rates", "Better client relationships"],
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: HeadphonesIcon,
      title: "Customer Success",
      description: "Provide world-class support in any language. Build stronger relationships with global customers.",
      benefits: ["Reduced support tickets", "Higher satisfaction scores", "Global coverage"],
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Megaphone,
      title: "Marketing Webinars",
      description: "Reach global audiences with marketing events. Translate presentations and Q&A sessions live.",
      benefits: ["Larger audience reach", "Better engagement", "Global brand presence"],
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: Search,
      title: "User Research",
      description: "Conduct user interviews worldwide. Gather insights from diverse markets without language constraints.",
      benefits: ["Deeper insights", "Global user feedback", "Faster research cycles"],
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: Users,
      title: "HR Interviews",
      description: "Hire the best talent globally. Interview candidates in their native language for better assessments.",
      benefits: ["Access global talent", "Better candidate experience", "Fair evaluations"],
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      icon: Briefcase,
      title: "Team Syncs",
      description: "Keep distributed teams aligned. Ensure everyone understands regardless of their primary language.",
      benefits: ["Better team collaboration", "Inclusive meetings", "Clear communication"],
      gradient: "from-teal-500 to-green-600"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % useCases.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + useCases.length) % useCases.length);
  };

  return (
    <section id="use-cases" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold font-display">
            Perfect for Every
            <span className="block text-gradient">Business Scenario</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            From sales calls to team meetings, MeetingLingo transforms how 
            global teams communicate and collaborate.
          </p>
        </div>

        {/* Use Cases Slider */}
        <div className="relative max-w-6xl mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {useCases.map((useCase, index) => (
                <div key={index} className="w-full flex-shrink-0">
                  <div className="grid lg:grid-cols-2 gap-12 items-center p-8 lg:p-16">
                    {/* Left Content */}
                    <div className="space-y-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${useCase.gradient} flex items-center justify-center`}>
                        <useCase.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-2xl lg:text-3xl font-bold font-display">{useCase.title}</h3>
                        <p className="text-lg text-muted-foreground">{useCase.description}</p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Key Benefits:</h4>
                        <ul className="space-y-2">
                          {useCase.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span className="text-muted-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right Visual */}
                    <div className="relative">
                      <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-8 h-80 flex items-center justify-center">
                        <div className={`w-32 h-32 bg-gradient-to-r ${useCase.gradient} rounded-full flex items-center justify-center opacity-20`}>
                          <useCase.icon className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button 
              onClick={prevSlide}
              className="p-3 rounded-full bg-background border border-border hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex space-x-2">
              {useCases.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <button 
              onClick={nextSlide}
              className="p-3 rounded-full bg-background border border-border hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;