"use client"

import { LineChart, Wallet, PieChart, TrendingUp, Shield, Clock, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SignInButton from '@/components/Buttons/SignInButton';
import SignUpButton from '@/components/Buttons/SignUpButton';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <LineChart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">FinTrack</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition">Pricing</a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition">About</a>
            </div>
            <div className="flex items-center space-x-4">
              <SignInButton />
              <SignUpButton />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 pt-20 pb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-foreground leading-tight mb-6">
                Split Expenses. Track Balances. Settle Debts.
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                The easiest way to share expenses with friends, family, and groups. Never lose track of who owes what again with smart bill splitting and debt optimization.
              </p>
              <Button size="lg" className="gap-2" onClick={() => router.push("/auth/signup")}>
                Start Splitting Free <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800"
                  alt="Expense Splitting Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-background" id="features">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-16">
            Everything you need to manage shared expenses
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Wallet className="h-8 w-8 text-primary" />}
              title="Smart Bill Splitting"
              description="Split bills equally, by custom amounts, or percentages. Add friends and create groups for ongoing expense sharing."
            />
            <FeatureCard
              icon={<PieChart className="h-8 w-8 text-primary" />}
              title="Group Management"
              description="Create groups for roommates, trips, or regular activities. Track group balances and see who owes what."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-primary" />}
              title="Debt Optimization"
              description="Minimize transactions with smart settlement recommendations. See optimized payment paths to settle all debts efficiently."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Fair and transparent expense sharing
              </h2>
              <div className="space-y-6">
                <TrustItem
                  icon={<Shield className="h-6 w-6 text-primary" />}
                  title="Accurate Calculations"
                  description="Never worry about math errors. Our algorithms ensure fair splits and accurate balance tracking for all participants."
                />
                <TrustItem
                  icon={<Clock className="h-6 w-6 text-primary" />}
                  title="Real-time Updates"
                  description="Expenses and balances update instantly. Everyone in your group stays informed about current debt status."
                />
              </div>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
                  alt="Friends sharing expenses"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-8">
            Ready to simplify shared expenses?
          </h2>
          <Button size="lg" variant="secondary" onClick={() => router.push("/auth/signup")}>
            Start Splitting Now
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-card rounded-lg border hover:shadow-lg transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-card-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TrustItem({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h4 className="text-lg font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}