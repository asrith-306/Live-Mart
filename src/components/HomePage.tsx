//new branch

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ShoppingBag, 
  Truck, 
  Shield, 
  Star, 
  TrendingUp, 
  Users, 
  Package,
  ArrowRight,
  Check
} from "lucide-react";

interface HomePageProps {
  isLoggedIn?: boolean;
}

const HomePage = ({ isLoggedIn = false }: HomePageProps) => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Lightning-fast shipping to your doorstep",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Your transactions are completely safe",
      gradient: "from-accent to-accent-glow"
    },
    {
      icon: Star,
      title: "Quality Products",
      description: "Curated selection of premium items",
      gradient: "from-success to-emerald-400"
    }
  ];

  const stats = [
    { icon: Users, value: "50K+", label: "Happy Customers" },
    { icon: Package, value: "100K+", label: "Products" },
    { icon: TrendingUp, value: "98%", label: "Satisfaction Rate" },
    { icon: ShoppingBag, value: "1M+", label: "Orders Delivered" }
  ];

  const benefits = [
    "Wide selection of quality products",
    "Competitive prices and deals",
    "Easy returns and refunds",
    "24/7 customer support",
    "Secure checkout process",
    "Track orders in real-time"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8 animate-slide-up relative z-10">
              <div className="inline-block">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  🎉 Your Trusted Marketplace
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  Live Mart
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-xl">
                Your one-stop destination for fresh groceries, quality products, and amazing deals. 
                Shop smarter, live better.
              </p>

              <div className="flex flex-wrap gap-4">
                {isLoggedIn ? (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate("/customer")}
                      className="gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 group"
                    >
                      Start Shopping
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/orders")}
                      className="text-lg px-8 py-6 border-2 hover:border-primary hover:text-primary transition-all"
                    >
                      View Orders
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={() => navigate("/signup")}
                      className="gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 group"
                    >
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="text-lg px-8 py-6 border-2 hover:border-primary hover:text-primary transition-all"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-sm font-medium">100% Authentic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Free Returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-sm font-medium">24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative animate-float z-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 blur-3xl rounded-full"></div>
              <div className="relative rounded-3xl shadow-2xl w-full h-96 bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 flex items-center justify-center">
                <ShoppingBag className="h-32 w-32 text-primary/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-1/3 right-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }}></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-card to-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center space-y-2 p-6 rounded-2xl bg-card hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-3">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Why Choose <span className="text-primary">Live Mart</span>?
            </h2>
            <p className="text-xl text-muted-foreground">
              Experience shopping like never before with our premium features and services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className="p-8 relative">
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                    <div className={`relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient}`}>
                      <feature.icon className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-slide-up">
              <h2 className="text-4xl md:text-5xl font-bold">
                Everything You Need in{" "}
                <span className="text-primary">One Place</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of satisfied customers who trust Live Mart for their daily shopping needs.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Only show login/signup card if NOT logged in */}
            {!isLoggedIn && (
              <Card className="p-8 shadow-2xl border-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="space-y-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-3xl font-bold">Ready to Get Started?</h3>
                    <p className="text-muted-foreground">
                      Join thousands of happy customers today!
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      size="lg"
                      onClick={() => navigate("/signup")}
                      className="w-full gradient-primary hover:shadow-glow text-lg py-6"
                    >
                      Create Account
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="w-full border-2 text-lg py-6"
                    >
                      Sign In
                    </Button>
                  </div>

                  <div className="pt-4 text-center text-sm text-muted-foreground">
                    <p>🎁 Special offer: Get 10% off on your first order!</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Show welcome back message if logged in */}
            {isLoggedIn && (
              <Card className="p-8 shadow-2xl border-2 animate-slide-up bg-gradient-to-br from-success/10 to-success/5" style={{ animationDelay: "0.2s" }}>
                <div className="space-y-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-3xl font-bold text-success">Welcome Back! 🎉</h3>
                    <p className="text-muted-foreground text-lg">
                      Ready to continue shopping?
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => navigate("/customer")}
                    className="w-full bg-success hover:bg-success/90 text-white text-lg py-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-glow to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-6 text-white">
            <h2 className="text-4xl md:text-5xl font-bold">
              Start Your Shopping Journey Today
            </h2>
            <p className="text-xl opacity-90">
              Experience the future of online shopping with Live Mart
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              {!isLoggedIn ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate("/signup")}
                    className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                  >
                    Get Started Free
                  </Button>
                  <Button
                     size="lg"
                      onClick={() => navigate("/login")}
                      className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                  >
                    Sign In
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={() => navigate("/customer")}
                  className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
                >
                  Browse Products
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;