"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calculator, DollarSign, Calendar, Percent, TrendingUp, AlertCircle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'


interface TaxInputs {
  income: number
  incomeFrequency: "annual" | "monthly" | "weekly"
}

interface TaxCalculationResults {
  grossIncome: number
  taxableIncome: number
  incomeTax: number
  medicareLevy: number
  medicareLevySurcharge: number
  totalTax: number
  netIncome: number
  effectiveTaxRate: number
  marginalTaxRate: number
}

interface TaxBracket {
  min: number
  max: number | null
  rate: number
  baseTax: number
}

interface ValidationErrors {
  income?: string
}

interface TouchedFields {
  income: boolean
}

export default function IncomeTaxCalculator() {
  const [inputs, setInputs] = useState<TaxInputs>({
    income: 0,
    incomeFrequency: "annual",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    income: false,
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false)

  // 2024-25 Australian Tax Brackets
  const taxBrackets: TaxBracket[] = useMemo(() => [
    { min: 0, max: 18200, rate: 0, baseTax: 0 },
    { min: 18201, max: 45000, rate: 0.16, baseTax: 0 },
    { min: 45001, max: 135000, rate: 0.30, baseTax: 4288 },
    { min: 135001, max: 190000, rate: 0.37, baseTax: 31288 },
    { min: 190001, max: null, rate: 0.45, baseTax: 51638 },
  ], [])

  // Medicare Levy Surcharge thresholds
  const medicareSurchargeThresholds = useMemo(() => [
    { min: 0, max: 97000, rate: 0 },
    { min: 97001, max: 113000, rate: 0.01 },
    { min: 113001, max: 151000, rate: 0.0125 },
    { min: 151001, max: null, rate: 0.015 },
  ], [])

  // Validate inputs
  const validateInputs = (currentInputs: TaxInputs, touched: TouchedFields): ValidationErrors => {
    const newErrors: ValidationErrors = {}

    if (touched.income && currentInputs.income <= 0) {
      newErrors.income = "Income must be greater than 0"
    }

    if (touched.income && currentInputs.income > 10000000) {
      newErrors.income = "Income must be less than $10,000,000"
    }

    return newErrors
  }

  // Calculate LITO (Low Income Tax Offset)
  const calculateLITO = useCallback((taxableIncome: number): number => {
    if (taxableIncome <= 37500) {
      return 700
    } else if (taxableIncome <= 45000) {
      return Math.max(0, 700 - ((taxableIncome - 37500) * 0.05))
    } else if (taxableIncome <= 66667) {
      return Math.max(0, 325 - ((taxableIncome - 45000) * 0.015))
    }
    return 0
  }, [])

  // Calculate Medicare Levy
  const calculateMedicareLevy = useCallback((taxableIncome: number): number => {
    // 2024-25 Medicare levy thresholds (updated from 2023-24)
    const medicareThreshold = 27222  // Lower threshold where phase-in begins
    const medicareUpperThreshold = 34027  // Upper threshold where full 2% applies
    const medicareRate = 0.02

    if (taxableIncome <= medicareThreshold) {
      return 0
    } else if (taxableIncome <= medicareUpperThreshold) {
      // Phase-in: 10 cents per dollar above threshold
      const phaseInAmount = (taxableIncome - medicareThreshold) * 0.1
      return Math.min(phaseInAmount, taxableIncome * medicareRate)
    } else {
      return taxableIncome * medicareRate
    }
  }, [])

  // Calculate Medicare Levy Surcharge (assuming no private health insurance for simplicity)
  const calculateMedicareLevySurcharge = useCallback((taxableIncome: number): number => {
    for (const bracket of medicareSurchargeThresholds) {
      if (taxableIncome >= bracket.min && (bracket.max === null || taxableIncome <= bracket.max)) {
        return taxableIncome * bracket.rate
      }
    }
    return 0
  }, [medicareSurchargeThresholds])

  // Calculate income tax using progressive tax brackets
  const calculateIncomeTax = useCallback((taxableIncome: number): number => {
    let totalTax = 0
    
    // Calculate tax progressively through each bracket
    if (taxableIncome > 18200) {
      // Tax on $18,201 - $45,000 at 16%
      const taxableAt16 = Math.min(taxableIncome - 18200, 45000 - 18200)
      totalTax += taxableAt16 * 0.16
    }
    
    if (taxableIncome > 45000) {
      // Tax on $45,001 - $135,000 at 30%
      const taxableAt30 = Math.min(taxableIncome - 45000, 135000 - 45000)
      totalTax += taxableAt30 * 0.30
    }
    
    if (taxableIncome > 135000) {
      // Tax on $135,001 - $190,000 at 37%
      const taxableAt37 = Math.min(taxableIncome - 135000, 190000 - 135000)
      totalTax += taxableAt37 * 0.37
    }
    
    if (taxableIncome > 190000) {
      // Tax on $190,001+ at 45%
      const taxableAt45 = taxableIncome - 190000
      totalTax += taxableAt45 * 0.45
    }
    
    // Apply LITO (Low Income Tax Offset)
    const lito = calculateLITO(taxableIncome)
    return Math.max(0, totalTax - lito)
  }, [calculateLITO])

  // Get marginal tax rate
  const getMarginalTaxRate = useCallback((taxableIncome: number): number => {
    for (const bracket of taxBrackets) {
      if (taxableIncome >= bracket.min && (bracket.max === null || taxableIncome <= bracket.max)) {
        return bracket.rate
      }
    }
    return 0
  }, [taxBrackets])

  // Convert income to annual
  const getAnnualIncome = useCallback((income: number, frequency: string): number => {
    switch (frequency) {
      case "weekly":
        return income * 52
      case "monthly":
        return income * 12
      case "annual":
      default:
        return income
    }
  }, [])

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }



  const getFrequencyLabel = (frequency: string): string => {
    const labels: { [key: string]: string } = {
      weekly: "Weekly",
      monthly: "Monthly",
      annual: "Annual",
    }
    return labels[frequency] || frequency
  }

  const getFrequencyAmount = (annualAmount: number, frequency: string): number => {
    switch (frequency) {
      case "weekly":
        return annualAmount / 52
      case "monthly":
        return annualAmount / 12
      case "annual":
      default:
        return annualAmount
    }
  }

  // Calculate tax results
  const calculateTax = useMemo((): TaxCalculationResults | null => {
    if (!isFormValid) return null

    const { income, incomeFrequency } = inputs
    const grossIncome = getAnnualIncome(income, incomeFrequency)
    const taxableIncome = grossIncome // Assuming no deductions for simplicity

    const incomeTax = calculateIncomeTax(taxableIncome)
    const medicareLevy = calculateMedicareLevy(taxableIncome)
    const medicareLevySurcharge = calculateMedicareLevySurcharge(taxableIncome)
    const totalTax = incomeTax + medicareLevy + medicareLevySurcharge
    const netIncome = grossIncome - totalTax
    const effectiveTaxRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0
    const marginalTaxRate = getMarginalTaxRate(taxableIncome) * 100

    return {
      grossIncome,
      taxableIncome,
      incomeTax,
      medicareLevy,
      medicareLevySurcharge,
      totalTax,
      netIncome,
      effectiveTaxRate,
      marginalTaxRate,
    }
  }, [inputs, isFormValid, calculateIncomeTax, calculateMedicareLevy, calculateMedicareLevySurcharge, getMarginalTaxRate, getAnnualIncome])

  // Generate tax breakdown
  const taxBreakdown = useMemo(() => {
    if (!calculateTax || !isFormValid) return []

    const { grossIncome } = calculateTax
    const breakdown = []

    // Tax-free threshold: $0 - $18,200
    if (grossIncome > 0) {
      const taxFreeAmount = Math.min(grossIncome, 18200)
      breakdown.push({
        range: "$0 - $18,200",
        rate: "0.0%",
        taxableAmount: taxFreeAmount,
        taxAmount: 0,
        isOffset: false,
      })
    }

    // 16% bracket: $18,201 - $45,000
    if (grossIncome > 18200) {
      const taxableAt16 = Math.min(grossIncome - 18200, 45000 - 18200)
      breakdown.push({
        range: "$18,201 - $45,000",
        rate: "16.0%",
        taxableAmount: taxableAt16,
        taxAmount: taxableAt16 * 0.16,
        isOffset: false,
      })
    }

    // 30% bracket: $45,001 - $135,000
    if (grossIncome > 45000) {
      const taxableAt30 = Math.min(grossIncome - 45000, 135000 - 45000)
      breakdown.push({
        range: "$45,001 - $135,000",
        rate: "30.0%",
        taxableAmount: taxableAt30,
        taxAmount: taxableAt30 * 0.30,
        isOffset: false,
      })
    }

    // 37% bracket: $135,001 - $190,000
    if (grossIncome > 135000) {
      const taxableAt37 = Math.min(grossIncome - 135000, 190000 - 135000)
      breakdown.push({
        range: "$135,001 - $190,000",
        rate: "37.0%",
        taxableAmount: taxableAt37,
        taxAmount: taxableAt37 * 0.37,
        isOffset: false,
      })
    }

    // 45% bracket: $190,001+
    if (grossIncome > 190000) {
      const taxableAt45 = grossIncome - 190000
      breakdown.push({
        range: "$190,001+",
        rate: "45.0%",
        taxableAmount: taxableAt45,
        taxAmount: taxableAt45 * 0.45,
        isOffset: false,
      })
    }

    // Add LITO (Low Income Tax Offset) as separate line item
    const litoAmount = calculateLITO(grossIncome)
    if (litoAmount > 0) {
      breakdown.push({
        range: "Low Income Tax Offset",
        rate: "Offset",
        taxableAmount: grossIncome,
        taxAmount: -litoAmount, // Negative because it reduces tax
        isOffset: true,
      })
    }

    return breakdown
  }, [calculateTax, isFormValid, calculateLITO])

  // Update validation when inputs change
  useEffect(() => {
    const newErrors = validateInputs(inputs, touchedFields)
    setErrors(newErrors)
    setIsFormValid(Object.keys(newErrors).length === 0 && inputs.income > 0)
  }, [inputs, touchedFields])

  const handleInputChange = (field: keyof TaxInputs, value: string | number) => {
    setInputs((prev) => ({
      ...prev,
      [field]: typeof value === "string" && field !== "incomeFrequency" ? Number(value) : value,
    }))

    // Mark field as touched (except for incomeFrequency)
    if (field !== "incomeFrequency") {
      setTouchedFields((prev) => ({
        ...prev,
        [field]: true,
      }))
    }
  }

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
      <div className="relative z-10 w-full max-w-5xl">
        {/* Title Outside Widget */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl text-theme-primary font-theme">Income Tax Calculator</h1>
        </div>

        {/* Main Card */}
        <Card className="bg-theme-primary/80 backdrop-blur-xl border-theme-secondary/50 shadow-2xl text-white rounded-3xl relative">
          <CardContent className="p-8">
            {/* Company Logo */}
            <div className="absolute top-6 right-6">
              <Image
                src="/images/SF_logo_white.png"
                alt="Swyft Logo"
                width={80}
                height={32}
                className="opacity-80 hover:opacity-100 transition-opacity duration-200"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
              {/* Left Column - Input Forms */}
              <div className="space-y-8">
                {/* Income Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Income Details</h3>

                  <div className="space-y-5">
                    {/* Income Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="income" className="text-sm font-medium text-white">
                        Income Amount
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-white text-lg font-bold">$</span>
                        </div>
                        <Input
                          type="number"
                          id="income"
                          value={inputs.income || ""}
                          onChange={(e) => handleInputChange("income", e.target.value)}
                          className={`pl-8 bg-theme-secondary/50 border-theme-secondary text-white placeholder-theme-secondary/70 focus:border-blue-400 focus:ring-blue-400/20 h-12 text-lg ${
                            touchedFields.income && errors.income ? "border-red-400 focus:border-red-400" : ""
                          }`}
                          placeholder="75,000"
                        />
                      </div>
                      {touchedFields.income && errors.income && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{errors.income}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Income Frequency */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-white">Income Frequency</Label>
                  <RadioGroup
                    value={inputs.incomeFrequency}
                    onValueChange={(value) => handleInputChange("incomeFrequency", value)}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: "annual", label: "Annual", desc: "Per year" },
                      { value: "monthly", label: "Monthly", desc: "Per month" },
                      { value: "weekly", label: "Weekly", desc: "Per week" },
                    ].map((frequency) => (
                      <div key={frequency.value} className="relative">
                        <RadioGroupItem value={frequency.value} id={frequency.value} className="peer sr-only" />
                        <Label
                          htmlFor={frequency.value}
                                                      className="flex flex-col items-center justify-center p-4 bg-theme-secondary/30 border border-theme-secondary rounded-lg cursor-pointer hover:bg-theme-secondary/50 peer-data-[state=checked]:border-theme-primary peer-data-[state=checked]:bg-theme-primary/20 transition-all duration-200"
                        >
                                                      <Calendar className="h-5 w-5 mb-2 text-white peer-data-[state=checked]:text-theme-primary" />
                          <span className="font-medium text-sm text-white">{frequency.label}</span>
                          <Badge variant="secondary" className="mt-1 text-xs bg-theme-secondary text-white">
                            {frequency.desc}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Income Distribution Chart */}
                {calculateTax && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Income Distribution</h4>
                    
                    {/* Pie Chart */}
                    <div className="bg-theme-secondary/30 border border-theme-secondary rounded-xl p-6">

                      <div className="h-64 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              <linearGradient id="netIncomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                              </linearGradient>
                              <linearGradient id="taxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                              </linearGradient>
                              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
                              </filter>
                            </defs>
                            <Pie
                              data={[
                                { 
                                  name: 'Net Income', 
                                  value: calculateTax.netIncome,
                                  percentage: ((calculateTax.netIncome / calculateTax.grossIncome) * 100).toFixed(1),
                                  color: '#2dd4bf'
                                },
                                { 
                                  name: 'Tax', 
                                  value: calculateTax.totalTax,
                                  percentage: ((calculateTax.totalTax / calculateTax.grossIncome) * 100).toFixed(1),
                                  color: '#f59e0b'
                                }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={95}
                              dataKey="value"
                              stroke="hsl(var(--border))"
                              strokeWidth={1}
                              paddingAngle={2}
                              cornerRadius={8}
                              filter="url(#shadow)"
                            >
                              <Cell fill="url(#netIncomeGradient)" className="transition-all duration-300 hover:opacity-80" />
                              <Cell fill="url(#taxGradient)" className="transition-all duration-300 hover:opacity-80" />
                            </Pie>
                            <Tooltip 
                              formatter={(value, name, props) => [
                                `${props.payload.percentage}%`,
                                name
                              ]}
                              contentStyle={{
                                backgroundColor: 'rgb(15 23 42)',
                                border: '1px solid rgb(71 85 105)',
                                borderRadius: '8px',
                                color: 'rgb(248 250 252)',
                                fontSize: '14px',
                                fontWeight: '600',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                                backdropFilter: 'blur(8px)',
                                padding: '8px 12px'
                              }}
                              labelStyle={{ 
                                display: 'none' 
                              }}
                              itemStyle={{
                                color: 'rgb(248 250 252)',
                                fontWeight: '600'
                              }}
                              cursor={false}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legend */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-chart-2/10 to-chart-2/5 rounded-xl border border-chart-2/20 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-chart-2/80 to-chart-2 shadow-lg"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Net Income</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(getFrequencyAmount(calculateTax.netIncome, inputs.incomeFrequency))}
                            </p>
                            <p className="text-xs font-medium text-chart-2">
                              {((calculateTax.netIncome / calculateTax.grossIncome) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-4 bg-gradient-to-br from-chart-5/10 to-chart-5/5 rounded-xl border border-chart-5/20 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-chart-5/80 to-chart-5 shadow-lg"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Total Tax</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(getFrequencyAmount(calculateTax.totalTax, inputs.incomeFrequency))}
                            </p>
                            <p className="text-xs font-medium text-chart-5">
                              {((calculateTax.totalTax / calculateTax.grossIncome) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/20 backdrop-blur-sm text-center hover:scale-[1.02] transition-all duration-300">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Effective Tax Rate</p>
                          <p className="text-2xl font-bold text-white mb-1">{calculateTax.effectiveTaxRate.toFixed(1)}%</p>
                          <div className="w-8 h-1 bg-gradient-to-r from-chart-5 to-chart-2 rounded-full mx-auto"></div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-muted/10 to-muted/5 rounded-xl border border-muted/20 backdrop-blur-sm text-center hover:scale-[1.02] transition-all duration-300">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Gross Income</p>
                          <p className="text-lg font-bold text-white mb-1">
                            {formatCurrency(getFrequencyAmount(calculateTax.grossIncome, inputs.incomeFrequency))}
                          </p>
                          <p className="text-xs text-muted-foreground">{getFrequencyLabel(inputs.incomeFrequency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Tax Calculation</h3>

                {calculateTax ? (
                  <div className="space-y-6">
                    {/* Main Net Income Display */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-2 border-white p-6 rounded-2xl shadow-xl ring-2 ring-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-200">
                          {getFrequencyLabel(inputs.incomeFrequency)} Net Income
                        </h4>
                        <ArrowRight className="h-5 w-5 text-blue-300" />
                      </div>
                      <p className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {formatCurrency(getFrequencyAmount(calculateTax.netIncome, inputs.incomeFrequency))}
                      </p>
                      <p className="text-blue-100">After tax and Medicare levy</p>
                    </div>

                    {/* Tax Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Income Tax
                          </span>
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(getFrequencyAmount(calculateTax.incomeTax, inputs.incomeFrequency))}
                        </p>
                      </div>

                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Medicare Levy
                          </span>
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(getFrequencyAmount(calculateTax.medicareLevy, inputs.incomeFrequency))}
                        </p>
                      </div>

                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Total Tax
                          </span>
                          <Percent className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(getFrequencyAmount(calculateTax.totalTax, inputs.incomeFrequency))}
                        </p>
                      </div>

                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Effective Rate
                          </span>
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {calculateTax.effectiveTaxRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Medicare Levy Surcharge Alert */}
                    {calculateTax.medicareLevySurcharge > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-lg animate-fade-in">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-400" />
                          <h4 className="font-semibold text-white">Medicare Levy Surcharge Applied</h4>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">
                          {formatCurrency(getFrequencyAmount(calculateTax.medicareLevySurcharge, inputs.incomeFrequency))}
                        </p>
                        <p className="text-white text-sm">
                          Higher income earners pay this surcharge (can be avoided with private health insurance)
                        </p>
                      </div>
                    )}

                    {/* Tax Brackets Breakdown Toggle */}
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                        className="w-full bg-theme-secondary/50 border-theme-secondary text-white hover:bg-theme-secondary hover:text-white"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>View Tax Brackets Breakdown</span>
                          {showTaxBreakdown ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </Button>

                      {showTaxBreakdown && taxBreakdown.length > 0 && (
                        <div className="bg-theme-secondary/30 border border-theme-secondary rounded-lg p-4 animate-fade-in">
                          <h4 className="font-semibold text-white mb-4">Tax Brackets Applied</h4>
                          <div className="max-h-80 overflow-y-auto rounded-lg border border-theme-secondary">
                            <Table>
                              <TableHeader className="sticky top-0 bg-theme-primary">
                                <TableRow className="border-theme-secondary">
                                  <TableHead className="text-white font-medium text-xs">Income Range</TableHead>
                                  <TableHead className="text-white font-medium text-xs">Rate</TableHead>
                                  <TableHead className="text-white font-medium text-xs">Taxable</TableHead>
                                  <TableHead className="text-white font-medium text-xs">Tax</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {taxBreakdown.map((bracket, index) => (
                                  <TableRow
                                    key={index}
                                    className={`border-theme-secondary hover:bg-theme-secondary/20 ${bracket.isOffset ? 'bg-blue-500/10' : ''}`}
                                  >
                                    <TableCell className={`text-xs font-mono ${bracket.isOffset ? 'text-blue-300' : 'text-white'}`}>
                                      {bracket.range}
                                    </TableCell>
                                    <TableCell className={`text-xs font-mono ${bracket.isOffset ? 'text-blue-300' : 'text-white'}`}>
                                      {bracket.rate}
                                    </TableCell>
                                    <TableCell className={`text-xs font-mono ${bracket.isOffset ? 'text-blue-300' : 'text-green-300'}`}>
                                      {bracket.isOffset ? '-' : formatCurrency(bracket.taxableAmount)}
                                    </TableCell>
                                    <TableCell className={`text-xs font-mono ${bracket.isOffset ? 'text-green-400' : 'text-amber-300'}`}>
                                      {bracket.isOffset && bracket.taxAmount < 0 ? 
                                        `-${formatCurrency(Math.abs(bracket.taxAmount))}` : 
                                        formatCurrency(bracket.taxAmount)
                                      }
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Tax Total Summary Row */}
                          <div className="mt-4 p-3 bg-theme-primary/50 rounded-lg border border-theme-secondary">
                            <div className="grid grid-cols-4 gap-2 text-sm font-bold">
                              <div className="text-white">Total Income Tax:</div>
                              <div className="text-white">-</div>
                              <div className="text-white">-</div>
                              <div className="text-white">
                                {formatCurrency(taxBreakdown.reduce((sum, bracket) => sum + bracket.taxAmount, 0))}
                              </div>
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="mt-4 p-3 bg-theme-primary/50 rounded-lg border border-theme-secondary">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-white">Marginal Tax Rate: </span>
                                <span className="text-white font-bold">{calculateTax.marginalTaxRate.toFixed(1)}%</span>
                              </div>
                              <div>
                                <span className="text-white">Effective Tax Rate: </span>
                                <span className="text-white font-bold">{calculateTax.effectiveTaxRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-white space-y-1">
                            <p>• Tax brackets apply progressively - each bracket only taxes income within that range</p>
                            <p>• Low Income Tax Offset (LITO) reduces tax payable by up to $700</p>
                            <p>• LITO highlighted in blue - phases out from $37,500 to $66,667</p>
                            <p>• Final total matches the &ldquo;Income Tax&rdquo; shown above</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-theme-secondary/30 p-4 rounded-lg border border-theme-secondary">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-4 w-4 text-white mt-1 flex-shrink-0" />
                        <div className="text-xs text-white space-y-1">
                          <p>• Calculations based on 2024-25 Australian tax brackets</p>
                          <p>• Results are estimates and exclude deductions or offsets</p>
                          <p>• Medicare levy (2%) and surcharge applied per 2024-25 thresholds</p>
                          <p>• Consult with a tax professional for personalized advice</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-theme-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2 text-white">Enter income details</h4>
                    <p className="text-white text-sm">Fill in the form to see your tax calculations</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 