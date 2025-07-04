"use client"

import { useState, useEffect, useMemo } from "react"

import {
  Calculator,
  DollarSign,
  Calendar,
  Percent,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Label } from "@/components/ui/label"

import { Input } from "@/components/ui/input"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { Slider } from "@/components/ui/slider"

import { Switch } from "@/components/ui/switch"

import { Card, CardContent } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import Image from "next/image"



interface LoanInputs {
  loanAmount: number

  interestRate: number

  loanTerm: number

  repaymentFrequency: "weekly" | "fortnightly" | "monthly"

  hasResidualPayment: boolean

  residualPayment: number
}

interface CalculationResults {
  repaymentPerPeriod: number

  totalAmountPayable: number

  totalInterest: number

  periodsPerYear: number

  totalPeriods: number
}

interface AmortizationEntry {
  paymentNumber: number

  paymentAmount: number

  principalAmount: number

  interestAmount: number

  remainingBalance: number
}

interface ChartDataPoint {
  payment: number

  remainingBalance: number

  principalPayment: number

  interestPayment: number

  cumulativeInterest: number

  cumulativePrincipal: number
}

interface ValidationErrors {
  loanAmount?: string

  interestRate?: string

  loanTerm?: string

  residualPayment?: string
}

interface TouchedFields {
  loanAmount: boolean

  interestRate: boolean

  loanTerm: boolean

  residualPayment: boolean
}

export default function LoanCalculator() {
  const [inputs, setInputs] = useState<LoanInputs>({
    loanAmount: 0,

    interestRate: 0,

    loanTerm: 0,

    repaymentFrequency: "monthly",

    hasResidualPayment: false,

    residualPayment: 0,
  })

  const [errors, setErrors] = useState<ValidationErrors>({})

  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    loanAmount: false,

    interestRate: false,

    loanTerm: false,

    residualPayment: false,
  })

  const [isFormValid, setIsFormValid] = useState(false)

  const [showAmortizationChart, setShowAmortizationChart] = useState(false)

  // Validate inputs

  const validateInputs = (currentInputs: LoanInputs, touched: TouchedFields): ValidationErrors => {
    const newErrors: ValidationErrors = {}

    if (touched.loanAmount && currentInputs.loanAmount <= 0) {
      newErrors.loanAmount = "Loan amount must be greater than 0"
    }

    if (touched.interestRate && (currentInputs.interestRate < 0 || currentInputs.interestRate > 100)) {
      newErrors.interestRate = "Interest rate must be between 0 and 100"
    }

    if (touched.loanTerm && (currentInputs.loanTerm <= 0 || currentInputs.loanTerm > 7)) {
      newErrors.loanTerm = "Loan term must be between 0 and 7 years"
    }

    if (currentInputs.hasResidualPayment && touched.residualPayment && currentInputs.residualPayment < 0) {
      newErrors.residualPayment = "Residual payment cannot be negative"
    }

    if (
      currentInputs.hasResidualPayment &&
      touched.residualPayment &&
      currentInputs.residualPayment >= currentInputs.loanAmount
    ) {
      newErrors.residualPayment = "Residual payment must be less than loan amount"
    }

    return newErrors
  }

  // Calculate loan repayments using PMT formula

  const calculateRepayments = useMemo((): CalculationResults | null => {
    if (!isFormValid) return null

    const { loanAmount, interestRate, loanTerm, repaymentFrequency, hasResidualPayment, residualPayment } = inputs

    // Determine periods per year based on frequency

    const periodsPerYear = repaymentFrequency === "weekly" ? 52 : repaymentFrequency === "fortnightly" ? 26 : 12

    // Calculate periodic interest rate

    const periodicRate = interestRate / 100 / periodsPerYear

    // Calculate total number of payments

    const totalPeriods = loanTerm * periodsPerYear

    // Principal amount to be amortized (loan amount minus residual)

    const actualResidual = hasResidualPayment ? residualPayment : 0

    const principalToAmortize = loanAmount - actualResidual

    if (periodicRate === 0) {
      // Handle case where interest rate is 0%

      const repaymentPerPeriod = principalToAmortize / totalPeriods

      const totalAmountPayable = principalToAmortize + actualResidual

      return {
        repaymentPerPeriod,

        totalAmountPayable,

        totalInterest: 0,

        periodsPerYear,

        totalPeriods,
      }
    }

    // PMT formula: PMT = [P × r × (1 + r)^n] / [(1 + r)^n – 1]

    const powerTerm = Math.pow(1 + periodicRate, totalPeriods)

    const repaymentPerPeriod = (principalToAmortize * periodicRate * powerTerm) / (powerTerm - 1)

    // Total amount payable includes all payments plus residual

    const totalAmountPayable = repaymentPerPeriod * totalPeriods + actualResidual

    const totalInterest = totalAmountPayable - loanAmount

    return {
      repaymentPerPeriod,

      totalAmountPayable,

      totalInterest,

      periodsPerYear,

      totalPeriods,
    }
  }, [inputs, isFormValid])

  // Generate amortization schedule

  const amortizationSchedule = useMemo((): AmortizationEntry[] => {
    if (!calculateRepayments || !isFormValid) return []

    const { loanAmount, interestRate, hasResidualPayment, residualPayment } = inputs

    const { repaymentPerPeriod, totalPeriods, periodsPerYear } = calculateRepayments

    const periodicRate = interestRate / 100 / periodsPerYear

    const actualResidual = hasResidualPayment ? residualPayment : 0

    const principalToAmortize = loanAmount - actualResidual

    const schedule: AmortizationEntry[] = []

    let remainingBalance = principalToAmortize

    for (let paymentNumber = 1; paymentNumber <= totalPeriods; paymentNumber++) {
      const interestAmount = remainingBalance * periodicRate

      const principalAmount = repaymentPerPeriod - interestAmount

      // Handle final payment to avoid rounding errors

      if (paymentNumber === totalPeriods) {
        const adjustedPrincipal = remainingBalance

        const adjustedPayment = adjustedPrincipal + interestAmount

        schedule.push({
          paymentNumber,

          paymentAmount: adjustedPayment,

          principalAmount: adjustedPrincipal,

          interestAmount,

          remainingBalance: 0,
        })
      } else {
        remainingBalance -= principalAmount

        schedule.push({
          paymentNumber,

          paymentAmount: repaymentPerPeriod,

          principalAmount,

          interestAmount,

          remainingBalance: Math.max(0, remainingBalance),
        })
      }
    }

    // Add balloon payment if applicable

    if (hasResidualPayment && residualPayment > 0) {
      schedule.push({
        paymentNumber: totalPeriods + 1,

        paymentAmount: residualPayment,

        principalAmount: residualPayment,

        interestAmount: 0,

        remainingBalance: 0,
      })
    }

    return schedule
  }, [calculateRepayments, inputs, isFormValid])

  // Generate chart data

  const chartData = useMemo((): ChartDataPoint[] => {
    if (!amortizationSchedule.length) return []

    let cumulativeInterest = 0
    let cumulativePrincipal = 0

    return amortizationSchedule.map((entry) => {
      cumulativeInterest += entry.interestAmount
      cumulativePrincipal += entry.principalAmount

      return {
        payment: entry.paymentNumber,
        remainingBalance: Math.round(entry.remainingBalance),
        principalPayment: Math.round(entry.principalAmount),
        interestPayment: Math.round(entry.interestAmount),
        cumulativeInterest: Math.round(cumulativeInterest),
        cumulativePrincipal: Math.round(cumulativePrincipal),
      }
    })
  }, [amortizationSchedule])

  // Update validation when inputs change

  useEffect(() => {
    const newErrors = validateInputs(inputs, touchedFields)

    setErrors(newErrors)

    setIsFormValid(
      Object.keys(newErrors).length === 0 && inputs.loanAmount > 0 && inputs.interestRate >= 0 && inputs.loanTerm > 0,
    )
  }, [inputs, touchedFields])

  const handleInputChange = (field: keyof LoanInputs, value: string | number | boolean) => {
    setInputs((prev) => ({
      ...prev,

      [field]: typeof value === "string" && field !== "repaymentFrequency" ? Number(value) : value,
    }))

    // Mark field as touched (except for boolean fields like hasResidualPayment)

    if (field !== "hasResidualPayment" && field !== "repaymentFrequency") {
      setTouchedFields((prev) => ({
        ...prev,

        [field]: true,
      }))
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",

      currency: "AUD",

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-AU").format(num)
  }

  const getFrequencyLabel = (frequency: string): string => {
    const labels: { [key: string]: string } = {
      weekly: "Weekly",

      fortnightly: "Fortnightly",

      monthly: "Monthly",
    }

    return labels[frequency] || frequency
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements - Subtle curves like in the image */}

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
          <h1 className="text-4xl lg:text-5xl text-theme-primary font-theme">Leasing Calculator</h1>
        </div>

        {/* Main Card - More Transparent */}

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
                {/* Loan Details */}

                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Loan Details</h3>

                  <div className="space-y-5">
                    {/* Loan Amount */}

                    <div className="space-y-2">
                      <Label htmlFor="loanAmount" className="text-sm font-medium text-white font-theme">
                        Loan Amount
                      </Label>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-white text-lg font-bold">$</span>
                        </div>

                        <Input
                          type="number"
                          id="loanAmount"
                          value={inputs.loanAmount || ""}
                          onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                          className={`pl-8 bg-theme-secondary/50 border-theme-secondary text-white placeholder-theme-secondary/70 focus:border-blue-400 focus:ring-blue-400/20 h-12 text-lg ${
                            touchedFields.loanAmount && errors.loanAmount ? "border-red-400 focus:border-red-400" : ""
                          }`}
                          placeholder="500,000"
                        />
                      </div>

                      {touchedFields.loanAmount && errors.loanAmount && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />

                          <p className="text-sm">{errors.loanAmount}</p>
                        </div>
                      )}
                    </div>

                    {/* Interest Rate */}

                    <div className="space-y-2">
                      <Label htmlFor="interestRate" className="text-sm font-medium text-white">
                        Interest Rate (per annum)
                      </Label>

                      <div className="relative">
                        <Input
                          type="number"
                          id="interestRate"
                          step="0.01"
                          value={inputs.interestRate || ""}
                          onChange={(e) => handleInputChange("interestRate", e.target.value)}
                          className={`pr-12 bg-theme-secondary/50 border-theme-secondary text-white placeholder-theme-secondary/70 focus:border-blue-400 focus:ring-blue-400/20 h-12 text-lg ${
                            touchedFields.interestRate && errors.interestRate
                              ? "border-red-400 focus:border-red-400"
                              : ""
                          }`}
                          placeholder="4.50"
                        />

                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <Percent className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      {touchedFields.interestRate && errors.interestRate && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />

                          <p className="text-sm">{errors.interestRate}</p>
                        </div>
                      )}
                    </div>

                    {/* Loan Term */}

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-white">Loan Term</Label>

                        <Badge className="bg-theme-secondary text-white border-theme-secondary">
                          {inputs.loanTerm} {inputs.loanTerm === 1 ? "year" : "years"}
                        </Badge>
                      </div>

                      <Slider
                        value={[inputs.loanTerm]}
                        onValueChange={([value]) => {
                          handleInputChange("loanTerm", value)

                          setTouchedFields((prev) => ({ ...prev, loanTerm: true }))
                        }}
                        max={7}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />

                      <div className="flex justify-between text-xs text-white">
                        <span>0 years</span>

                        <span>7 years</span>
                      </div>

                      {touchedFields.loanTerm && errors.loanTerm && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />

                          <p className="text-sm">{errors.loanTerm}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Repayment Frequency */}

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-white">Repayment Frequency</Label>

                  <RadioGroup
                    value={inputs.repaymentFrequency}
                    onValueChange={(value) => handleInputChange("repaymentFrequency", value)}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: "monthly", label: "Monthly", desc: "12/year" },

                      { value: "fortnightly", label: "Fortnightly", desc: "26/year" },

                      { value: "weekly", label: "Weekly", desc: "52/year" },
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

                {/* Balloon Payment */}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-white">Balloon Payment</Label>

                    <Switch
                      checked={inputs.hasResidualPayment}
                      onCheckedChange={(checked) => handleInputChange("hasResidualPayment", checked)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  {inputs.hasResidualPayment && (
                    <div className="space-y-4 p-4 bg-theme-secondary/30 border border-theme-secondary rounded-lg animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-white">Balloon Amount</span>

                        <Badge className="bg-theme-secondary text-white border-theme-secondary">
                          {formatCurrency(inputs.residualPayment)}
                        </Badge>
                      </div>

                      <Slider
                        value={[inputs.residualPayment]}
                        onValueChange={([value]) => {
                          handleInputChange("residualPayment", value)

                          setTouchedFields((prev) => ({ ...prev, residualPayment: true }))
                        }}
                        max={Math.max(inputs.loanAmount * 0.5, 10000)}
                        step={Math.max(Math.floor(inputs.loanAmount * 0.001), 100)}
                        className="w-full"
                      />

                      <div className="flex justify-between text-xs text-white">
                        <span>$0</span>

                        <span>{formatCurrency(Math.max(inputs.loanAmount * 0.5, 10000))}</span>
                      </div>

                      {touchedFields.residualPayment && errors.residualPayment && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />

                          <p className="text-sm">{errors.residualPayment}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Results */}

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Repayment Summary</h3>

                {calculateRepayments ? (
                  <div className="space-y-6">
                    {/* Main Payment Display */}

                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-2 border-white p-6 rounded-2xl shadow-xl ring-2 ring-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-200">
                          {getFrequencyLabel(inputs.repaymentFrequency)} Payment
                        </h4>

                        <ArrowRight className="h-5 w-5 text-blue-300" />
                      </div>

                      <p className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {formatCurrency(calculateRepayments.repaymentPerPeriod)}
                      </p>

                      <p className="text-blue-100">Your regular payment amount</p>
                    </div>

                    {/* Summary Cards */}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Total Payable
                          </span>

                          <DollarSign className="h-4 w-4 text-white" />
                        </div>

                        <p className="text-lg font-bold text-white">
                          {formatCurrency(calculateRepayments.totalAmountPayable)}
                        </p>
                      </div>

                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Total Interest
                          </span>

                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>

                        <p className="text-lg font-bold text-white">
                          {formatCurrency(calculateRepayments.totalInterest)}
                        </p>
                      </div>

                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">
                            Total Payments
                          </span>

                          <Calendar className="h-4 w-4 text-white" />
                        </div>

                        <p className="text-lg font-bold text-white">{formatNumber(calculateRepayments.totalPeriods)}</p>
                      </div>

                      <div className="bg-theme-secondary/50 p-4 rounded-lg border border-theme-secondary">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-white uppercase tracking-wider">Per Year</span>

                          <Calendar className="h-4 w-4 text-white" />
                        </div>

                        <p className="text-lg font-bold text-white">
                          {formatNumber(calculateRepayments.periodsPerYear)}
                        </p>
                      </div>
                    </div>

                    {/* Balloon Payment Alert */}

                    {inputs.hasResidualPayment && inputs.residualPayment > 0 && (
                      <div className="bg-theme-secondary/30 border border-theme-secondary p-4 rounded-lg animate-fade-in">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-400" />

                          <h4 className="font-semibold text-white">Balloon Payment Due</h4>
                        </div>

                        <p className="text-2xl font-bold text-white mb-1">{formatCurrency(inputs.residualPayment)}</p>

                        <p className="text-white text-sm">Final payment at loan completion</p>
                      </div>
                    )}

                    {/* Payment Schedule Chart Toggle */}

                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAmortizationChart(!showAmortizationChart)}
                        className="w-full bg-theme-secondary/50 border-theme-secondary text-white hover:bg-theme-secondary hover:text-white"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>View Payment Schedule Chart</span>

                          {showAmortizationChart ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </Button>

                      {showAmortizationChart && chartData.length > 0 && (
                        <div className="bg-theme-secondary/30 border border-theme-secondary rounded-lg p-6 animate-fade-in">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="font-semibold text-white">Payment Schedule Visualization</h4>
                            <div className="text-right">
                              <p className="text-xs text-white uppercase tracking-wider">Total Payments</p>
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(
                                  amortizationSchedule.reduce((sum, entry) => sum + entry.paymentAmount, 0),
                                )}
                              </p>
                            </div>
                          </div>

                          <ChartContainer
                            config={{
                              remainingBalance: {
                                label: "Remaining Balance",
                                color: "#3b82f6",
                              },
                              principalPayment: {
                                label: "Principal Payment",
                                color: "#10b981",
                              },
                              interestPayment: {
                                label: "Interest Payment",
                                color: "#f59e0b",
                              },
                              cumulativeInterest: {
                                label: "Cumulative Interest",
                                color: "#8b5cf6",
                              },
                              cumulativePrincipal: {
                                label: "Cumulative Principal",
                                color: "#06b6d4",
                              },
                            }}
                            className="h-[400px] w-full"
                          >
                            <LineChart
                              accessibilityLayer
                              data={chartData}
                              margin={{
                                top: 20,
                                left: 20,
                                right: 20,
                                bottom: 20,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />

                              <XAxis
                                dataKey="payment"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                tickFormatter={(value) => `#${value}`}
                              />

                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                              />

                              <ChartTooltip
                                cursor={{ stroke: "rgba(255, 255, 255, 0.2)", strokeWidth: 1 }}
                                contentStyle={{
                                  backgroundColor: "rgba(30, 41, 59, 0.95)",
                                  border: "1px solid rgba(71, 85, 105, 0.5)",
                                  borderRadius: "8px",
                                  color: "white",
                                  fontSize: "14px",
                                  backdropFilter: "blur(8px)",
                                }}
                                labelStyle={{ color: "white", fontWeight: "500" }}
                                formatter={(value, name) => [
                                  formatCurrency(Number(value)),
                                  name === "remainingBalance"
                                    ? "Remaining Balance"
                                    : name === "principalPayment"
                                      ? "Principal Payment"
                                      : name === "interestPayment"
                                        ? "Interest Payment"
                                        : name === "cumulativeInterest"
                                          ? "Cumulative Interest"
                                          : "Cumulative Principal",
                                ]}
                                labelFormatter={(label) => `Payment #${label}`}
                              />

                              <Line
                                dataKey="remainingBalance"
                                type="monotone"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{
                                  r: 4,
                                  fill: "#3b82f6",
                                }}
                              />

                              <Line
                                dataKey="principalPayment"
                                type="monotone"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                  r: 4,
                                  fill: "#10b981",
                                }}
                              />

                              <Line
                                dataKey="interestPayment"
                                type="monotone"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                  r: 4,
                                  fill: "#f59e0b",
                                }}
                              />

                              <Line
                                dataKey="cumulativeInterest"
                                type="monotone"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                activeDot={{
                                  r: 4,
                                  fill: "#8b5cf6",
                                }}
                              />

                              <Line
                                dataKey="cumulativePrincipal"
                                type="monotone"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                  r: 4,
                                  fill: "#06b6d4",
                                }}
                              />
                            </LineChart>
                          </ChartContainer>

                          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-white">
                            <div className="space-y-1">
                              <p>
                                • <span className="text-blue-400">Remaining Balance</span> decreases over time
                              </p>
                              <p>
                                • <span className="text-green-400">Principal Payment</span> increases over time
                              </p>
                              <p>
                                • <span className="text-cyan-400">Cumulative Principal</span> total equity built
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p>
                                • <span className="text-amber-400">Interest Payment</span> decreases over time
                              </p>
                              <p>
                                • <span className="text-purple-400">Cumulative Interest</span> total cost paid
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Disclaimer */}

                    <div className="bg-theme-secondary/30 p-4 rounded-lg border border-theme-secondary">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-4 w-4 text-white mt-1 flex-shrink-0" />

                        <div className="text-xs text-white space-y-1">
                          <p>• Calculations are estimates and exclude fees, charges, or taxes</p>

                          <p>• Results assume fixed interest rate for entire loan term</p>

                          <p>• Consult with a financial advisor for personalized advice</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-theme-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>

                    <h4 className="font-semibold text-lg mb-2 text-white">Enter loan details</h4>

                    <p className="text-white text-sm">Fill in the form to see your repayment calculations</p>
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
