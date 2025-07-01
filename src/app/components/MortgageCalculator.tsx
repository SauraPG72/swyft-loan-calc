"use client"

import { useState, useEffect, useMemo } from "react"
import { Calculator, DollarSign, Calendar, Percent, TrendingUp, AlertCircle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

interface MortgageInputs {
  loanAmount: number
  interestRate: number
  loanTerm: number
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

export default function MortgageCalculator() {
  const [inputs, setInputs] = useState<MortgageInputs>({
    loanAmount: 0,
    interestRate: 0,
    loanTerm: 0,
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
  const [showAmortizationTable, setShowAmortizationTable] = useState(false)

  // Validate inputs
  const validateInputs = (currentInputs: MortgageInputs, touched: TouchedFields): ValidationErrors => {
    const newErrors: ValidationErrors = {}

    if (touched.loanAmount && currentInputs.loanAmount <= 0) {
      newErrors.loanAmount = "Loan amount must be greater than 0"
    }

    if (touched.interestRate && (currentInputs.interestRate < 0 || currentInputs.interestRate > 100)) {
      newErrors.interestRate = "Interest rate must be between 0 and 100"
    }

    if (touched.loanTerm && (currentInputs.loanTerm <= 0 || currentInputs.loanTerm > 30)) {
      newErrors.loanTerm = "Loan term must be between 0 and 30 years"
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

  // Calculate mortgage repayments using PMT formula
  const calculateRepayments = useMemo((): CalculationResults | null => {
    if (!isFormValid) return null

    const { loanAmount, interestRate, loanTerm, hasResidualPayment, residualPayment } = inputs

    // Mortgages are always monthly
    const periodsPerYear = 12

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

  // Update form validation
  useEffect(() => {
    const newErrors = validateInputs(inputs, touchedFields)
    setErrors(newErrors)

    const hasRequiredFields = inputs.loanAmount > 0 && inputs.interestRate >= 0 && inputs.loanTerm > 0
    const hasNoErrors = Object.keys(newErrors).length === 0
    const hasAllTouched = touchedFields.loanAmount && touchedFields.interestRate && touchedFields.loanTerm

    setIsFormValid(hasRequiredFields && hasNoErrors && hasAllTouched)
  }, [inputs, touchedFields])

  const handleInputChange = (field: keyof MortgageInputs, value: string | number | boolean) => {
    if (typeof value === "string") {
      const numValue = parseFloat(value) || 0
      setInputs((prev) => ({ ...prev, [field]: numValue }))
    } else {
      setInputs((prev) => ({ ...prev, [field]: value }))
    }

    if (field !== "hasResidualPayment") {
      setTouchedFields((prev) => ({ ...prev, [field]: true }))
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-AU").format(num)
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
          <h1 className="text-4xl lg:text-5xl text-slate-600">Mortgage Calculator</h1>
        </div>

        {/* Main Card */}
        <Card className="bg-slate-800/80 backdrop-blur-xl border-slate-700/50 shadow-2xl text-white rounded-3xl relative">
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
                {/* Mortgage Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Mortgage Details</h3>

                  <div className="space-y-5">
                    {/* Loan Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="loanAmount" className="text-sm font-medium text-slate-300">
                        Loan Amount
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-lg font-bold">$</span>
                        </div>
                        <Input
                          type="number"
                          id="loanAmount"
                          value={inputs.loanAmount || ""}
                          onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                          className={`pl-8 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 text-lg ${
                            touchedFields.loanAmount && errors.loanAmount ? "border-red-400 focus:border-red-400" : ""
                          }`}
                          placeholder="800,000"
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
                      <Label htmlFor="interestRate" className="text-sm font-medium text-slate-300">
                        Interest Rate (per annum)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          id="interestRate"
                          step="0.01"
                          value={inputs.interestRate || ""}
                          onChange={(e) => handleInputChange("interestRate", e.target.value)}
                          className={`pr-12 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 text-lg ${
                            touchedFields.interestRate && errors.interestRate
                              ? "border-red-400 focus:border-red-400"
                              : ""
                          }`}
                          placeholder="6.50"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <Percent className="h-5 w-5 text-slate-400" />
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
                        <Label className="text-sm font-medium text-slate-300">Loan Term</Label>
                        <Badge className="bg-slate-600 text-slate-300 border-slate-500">
                          {inputs.loanTerm} {inputs.loanTerm === 1 ? "year" : "years"}
                        </Badge>
                      </div>
                      <Slider
                        value={[inputs.loanTerm]}
                        onValueChange={([value]) => {
                          handleInputChange("loanTerm", value)
                          setTouchedFields((prev) => ({ ...prev, loanTerm: true }))
                        }}
                        max={30}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>0 years</span>
                        <span>30 years</span>
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

                {/* Repayment Frequency - Fixed to Monthly */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-slate-300">Repayment Frequency</Label>
                  <div className="relative">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                      <Calendar className="h-5 w-5 mb-2 text-blue-400" />
                      <span className="font-medium text-sm text-white">Monthly</span>
                      <Badge variant="secondary" className="mt-1 text-xs bg-slate-600 text-slate-300">
                        12/year
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Balloon Payment */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-300">Balloon Payment</Label>
                    <Switch
                      checked={inputs.hasResidualPayment}
                      onCheckedChange={(checked) => handleInputChange("hasResidualPayment", checked)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  {inputs.hasResidualPayment && (
                    <div className="space-y-4 p-4 bg-slate-700/30 border border-slate-600 rounded-lg animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-300">Balloon Amount</span>
                        <Badge className="bg-slate-600 text-slate-300 border-slate-500">
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
                      <div className="flex justify-between text-xs text-slate-400">
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
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/30 border-2 border-white p-6 rounded-2xl shadow-xl ring-2 ring-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-orange-200">
                          Monthly Payment
                        </h4>
                        <ArrowRight className="h-5 w-5 text-orange-300" />
                      </div>
                      <p className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {formatCurrency(calculateRepayments.repaymentPerPeriod)}
                      </p>
                      <p className="text-orange-100">Your monthly mortgage payment</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Total Payable
                          </span>
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(calculateRepayments.totalAmountPayable)}
                        </p>
                      </div>

                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Total Interest
                          </span>
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(calculateRepayments.totalInterest)}
                        </p>
                      </div>

                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Total Payments
                          </span>
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">{formatNumber(calculateRepayments.totalPeriods)}</p>
                      </div>

                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Per Year</span>
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatNumber(calculateRepayments.periodsPerYear)}
                        </p>
                      </div>
                    </div>

                    {/* Balloon Payment Alert */}
                    {inputs.hasResidualPayment && inputs.residualPayment > 0 && (
                      <div className="bg-slate-700/30 border border-slate-600 p-4 rounded-lg animate-fade-in">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertCircle className="h-5 w-5 text-amber-400" />
                          <h4 className="font-semibold text-white">Balloon Payment Due</h4>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">{formatCurrency(inputs.residualPayment)}</p>
                        <p className="text-slate-300 text-sm">Final payment at loan completion</p>
                      </div>
                    )}

                    {/* Amortization Table Toggle */}
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAmortizationTable(!showAmortizationTable)}
                        className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 hover:text-white"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>View Amortization Schedule</span>
                          {showAmortizationTable ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </Button>

                      {showAmortizationTable && amortizationSchedule.length > 0 && (
                        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-fade-in">
                          <h4 className="font-semibold text-white mb-4">Payment Schedule</h4>
                          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-600">
                            <Table>
                              <TableHeader className="sticky top-0 bg-slate-800">
                                <TableRow className="border-slate-600">
                                  <TableHead className="text-slate-300 font-medium text-xs">#</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Payment</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Principal</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Interest</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Balance</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {amortizationSchedule.map((entry) => (
                                  <TableRow
                                    key={entry.paymentNumber}
                                    className="border-slate-600 hover:bg-slate-700/20"
                                  >
                                    <TableCell className="text-slate-300 text-xs font-mono">
                                      {calculateRepayments && entry.paymentNumber > calculateRepayments.totalPeriods ? "B" : entry.paymentNumber}
                                    </TableCell>
                                    <TableCell className="text-white text-xs font-mono">
                                      {formatCurrency(entry.paymentAmount)}
                                    </TableCell>
                                    <TableCell className="text-green-300 text-xs font-mono">
                                      {formatCurrency(entry.principalAmount)}
                                    </TableCell>
                                    <TableCell className="text-amber-300 text-xs font-mono">
                                      {formatCurrency(entry.interestAmount)}
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs font-mono">
                                      {formatCurrency(entry.remainingBalance)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                           {/* Summary Row */}
                           <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                             <div className="grid grid-cols-5 gap-2 text-xs">
                               <div className="text-slate-400">Totals:</div>
                               <div className="text-white font-mono">
                                 {formatCurrency(amortizationSchedule.reduce((sum, entry) => sum + entry.paymentAmount, 0))}
                               </div>
                               <div className="text-green-300 font-mono">
                                 {formatCurrency(amortizationSchedule.reduce((sum, entry) => sum + entry.principalAmount, 0))}
                               </div>
                               <div className="text-amber-300 font-mono">
                                 {formatCurrency(amortizationSchedule.reduce((sum, entry) => sum + entry.interestAmount, 0))}
                               </div>
                               <div className="text-slate-300">-</div>
                             </div>
                           </div>

                           <div className="mt-3 text-xs text-slate-400 space-y-1">
                             <p>• B = Balloon Payment</p>
                             <p>• Principal (green) reduces loan balance</p>
                             <p>• Interest (amber) is the cost of borrowing</p>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                        <div className="text-xs text-slate-400 space-y-1">
                          <p>• Calculations are estimates and exclude fees, charges, or taxes</p>
                          <p>• Results assume fixed interest rate for entire loan term</p>
                          <p>• Consult with a financial advisor for personalized advice</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2 text-white">Enter mortgage details</h4>
                    <p className="text-slate-400 text-sm">Fill in the form to see your repayment calculations</p>
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