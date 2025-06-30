import Link from 'next/link';
import { Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-sky-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-300/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/20 to-sky-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-sans text-slate-600 mb-4">Swyft Calculators</h1>
          <p className="text-lg text-slate-500">Professional financial calculation tools</p>
        </div>

        {/* Company Logo */}
        <div className="absolute top-6 right-6">
          <Image
            src="/images/SF_logo_white.png"
            alt="Swyft Logo"
            width={80}
            height={32}
            className="opacity-60"
          />
        </div>

        {/* Calculator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Loan Calculator Card */}
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl text-white rounded-3xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-6 mx-auto">
                <Calculator className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-center text-white mb-4">Loan Calculator</h2>
              <p className="text-slate-300 text-center mb-6">
                Calculate loan repayments, interest costs, and amortization schedules for various loan terms and frequencies.
              </p>
              <Link href="/loan-calculator">
                <Button className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border border-slate-500/30">
                  Open Loan Calculator
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tax Calculator Card */}
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl text-white rounded-3xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-6 mx-auto">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-center text-white mb-4">Income Tax Calculator</h2>
              <p className="text-slate-300 text-center mb-6">
                Calculate Australian income tax, Medicare levy, and net income based on current 2024-25 tax brackets.
              </p>
              <Link href="/tax-calculator">
                <Button className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border border-slate-500/30">
                  Open Tax Calculator
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Income Annualisation Calculator Card */}
          <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl text-white rounded-3xl hover:scale-105 transition-transform duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-6 mx-auto">
                <TrendingUp className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-center text-white mb-4">Income Annualisation</h2>
              <p className="text-slate-300 text-center mb-6">
                Calculate annualised income from YTD earnings and pay periods. Perfect for lenders assessing PAYG earnings.
              </p>
              <Link href="/income-annualisation">
                <Button className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg border border-slate-500/30">
                  Open Annualisation Calculator
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-slate-400 text-sm">
            Professional financial calculators for loans, tax planning, and income analysis
          </p>
        </div>
      </div>
    </div>
  );
}
