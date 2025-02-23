"use client"

import { Card } from "@/components/ui/card"
import { LineChart, DollarSign, TrendingDown, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function DashboardPage() {
    const [isClient, setIsClient] = useState(false)
        
        useEffect(() => {
            setIsClient(true)
        }, [])

        if (!isClient) {
            return null; 
        }
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
          <p className="text-muted-foreground">Track your financial health at a glance</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <h2 className="text-2xl font-bold text-foreground">$24,500.00</h2>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <h2 className="text-2xl font-bold text-foreground">$8,250.00</h2>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Expenses</p>
              <h2 className="text-2xl font-bold text-foreground">$5,320.00</h2>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spending Overview</h3>
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
            <LineChart className="h-8 w-8 text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chart will be implemented here</span>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
            <LineChart className="h-8 w-8 text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chart will be implemented here</span>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${i % 2 === 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {i % 2 === 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {i % 2 === 0 ? 'Salary Deposit' : 'Grocery Shopping'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className={`font-semibold ${i % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {i % 2 === 0 ? '+$3,500.00' : '-$125.40'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}