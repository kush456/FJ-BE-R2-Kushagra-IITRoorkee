"use client"

import { LineChart, Wallet, PieChart, TrendingUp, Shield, Clock, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SignInButton from '@/components/Buttons/SignInButton';
import SignUpButton from '@/components/Buttons/SignUpButton';

export default function LandingPage() {
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
                Take Control of Your Financial Journey
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Track your income, expenses, and investments in one place. Make smarter financial decisions with powerful insights and real-time analytics.
              </p>
              <Button size="lg" className="gap-2">
                Start Tracking Free <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800"
                  alt="Financial Dashboard"
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
            Everything you need to manage your finances
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Wallet className="h-8 w-8 text-primary" />}
              title="Expense Tracking"
              description="Easily track your daily expenses and categorize them automatically."
            />
            <FeatureCard
              icon={<PieChart className="h-8 w-8 text-primary" />}
              title="Budget Planning"
              description="Create and manage budgets that help you reach your financial goals."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8 text-primary" />}
              title="Investment Portfolio"
              description="Monitor your investments and track their performance in real-time."
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
                Your finances are safe with us
              </h2>
              <div className="space-y-6">
                <TrustItem
                  icon={<Shield className="h-6 w-6 text-primary" />}
                  title="Bank-grade Security"
                  description="Your data is encrypted and protected with the highest security standards."
                />
                <TrustItem
                  icon={<Clock className="h-6 w-6 text-primary" />}
                  title="Real-time Sync"
                  description="Your financial data is always up-to-date across all your devices."
                />
              </div>
            </div>
            <div className="relative">
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
                  alt="Security"
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
            Ready to take control of your finances?
          </h2>
          <Button size="lg" variant="secondary">
            Get Started Now
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