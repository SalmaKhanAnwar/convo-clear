import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const PricingTeaser = () => {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold font-display">
            Simple, Transparent
            <span className="block text-gradient">Pricing</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial and scale as your team grows. 
            No hidden fees, no long-term contracts.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Starter Plan */}
            <div className="card-feature relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display">Starter</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gradient">$15</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Perfect for small teams</p>
                </div>

                <ul className="space-y-3">
                  {[
                    "Up to 10 hours/month",
                    "All major platforms",
                    "30+ languages",
                    "Email support"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="outline" className="w-full btn-secondary">
                  Start Free Trial
                </Button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="card-feature relative">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold font-display">Professional</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gradient">$49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">For growing businesses</p>
                </div>

                <ul className="space-y-3">
                  {[
                    "Unlimited hours",
                    "All platforms + API",
                    "60+ languages",
                    "Priority support",
                    "Advanced analytics",
                    "Custom integrations"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full btn-hero">
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-muted to-muted/50 rounded-2xl p-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold font-display">Need Enterprise Features?</h3>
                <p className="text-muted-foreground">
                  Custom solutions, dedicated support, and volume discounts available.
                </p>
                <Button variant="outline" className="btn-secondary">
                  Contact Sales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">7 Days</div>
              <div className="text-sm text-muted-foreground">Free Trial</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">No Lock-in</div>
              <div className="text-sm text-muted-foreground">Cancel Anytime</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">SOC2</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingTeaser;