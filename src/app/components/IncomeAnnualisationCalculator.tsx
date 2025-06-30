"use client"

import { useState, useEffect, useMemo } from "react"
import { Calculator, DollarSign, Calendar, TrendingUp, AlertCircle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

interface AnnualisationInputs {
  ytdIncome: number
  paysReceived: number
  payFrequency: "weekly" | "fortnightly" | "monthly" | "quarterly"
}

interface AnnualisationResults {
  averagePayAmount: number
  annualisedIncome: number
  totalPayPeriodsInYear: number
  remainingPayPeriods: number
  projectedRemainingIncome: number
  monthsElapsed: number
}

interface ValidationErrors {
  ytdIncome?: string
  paysReceived?: string
}

interface TouchedFields {
  ytdIncome: boolean
  paysReceived: boolean
}

export default function IncomeAnnualisationCalculator() {
  const [inputs, setInputs] = useState<AnnualisationInputs>({
    ytdIncome: 0,
    paysReceived: 0,
    payFrequency: "fortnightly",
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    ytdIncome: false,
    paysReceived: false,
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Pay frequency configurations
  const payFrequencyConfig = {
    weekly: { periodsPerYear: 52, label: "Weekly", description: "52 pays/year" },
    fortnightly: { periodsPerYear: 26, label: "Fortnightly", description: "26 pays/year" },
    monthly: { periodsPerYear: 12, label: "Monthly", description: "12 pays/year" },
    quarterly: { periodsPerYear: 4, label: "Quarterly", description: "4 pays/year" },
  }

  // Validate inputs
  const validateInputs = (currentInputs: AnnualisationInputs, touched: TouchedFields): ValidationErrors => {
    const newErrors: ValidationErrors = {}
    const maxPaysForFrequency = payFrequencyConfig[currentInputs.payFrequency].periodsPerYear

    if (touched.ytdIncome && currentInputs.ytdIncome <= 0) {
      newErrors.ytdIncome = "YTD income must be greater than 0"
    }

    if (touched.paysReceived && currentInputs.paysReceived <= 0) {
      newErrors.paysReceived = "Pay periods received must be greater than 0"
    }

    if (touched.paysReceived && currentInputs.paysReceived > maxPaysForFrequency) {
      newErrors.paysReceived = `Cannot exceed ${maxPaysForFrequency} pays for ${payFrequencyConfig[currentInputs.payFrequency].label.toLowerCase()} frequency`
    }

    return newErrors
  }

  // Calculate annualisation results
  const calculateAnnualisation = useMemo((): AnnualisationResults | null => {
    if (!isFormValid) return null

    const { ytdIncome, paysReceived, payFrequency } = inputs
    const { periodsPerYear } = payFrequencyConfig[payFrequency]

    // Calculate average pay amount
    const averagePayAmount = ytdIncome / paysReceived

    // Calculate annualised income
    const annualisedIncome = averagePayAmount * periodsPerYear

    // Calculate remaining periods and projected income
    const remainingPayPeriods = periodsPerYear - paysReceived
    const projectedRemainingIncome = averagePayAmount * remainingPayPeriods

    // Estimate months elapsed (approximate)
    const weeksElapsed = payFrequency === "weekly" ? paysReceived : 
                        payFrequency === "fortnightly" ? paysReceived * 2 :
                        payFrequency === "monthly" ? paysReceived * 4.33 :
                        paysReceived * 13
    const monthsElapsed = weeksElapsed / 4.33

    return {
      averagePayAmount,
      annualisedIncome,
      totalPayPeriodsInYear: periodsPerYear,
      remainingPayPeriods,
      projectedRemainingIncome,
      monthsElapsed,
    }
  }, [inputs, isFormValid])

  // Generate breakdown data
  const annualisationBreakdown = useMemo(() => {
    if (!calculateAnnualisation || !isFormValid) return []

    const { ytdIncome, paysReceived } = inputs
    const { remainingPayPeriods, projectedRemainingIncome } = calculateAnnualisation

    return [
      {
        description: "YTD Income Received",
        periods: paysReceived,
        amount: ytdIncome,
        type: "actual" as const,
      },
      {
        description: "Projected Remaining Income",
        periods: remainingPayPeriods,
        amount: projectedRemainingIncome,
        type: "projected" as const,
      },
    ]
  }, [calculateAnnualisation, inputs, isFormValid])

  // Update validation when inputs change
  useEffect(() => {
    const newErrors = validateInputs(inputs, touchedFields)
    setErrors(newErrors)
    setIsFormValid(
      Object.keys(newErrors).length === 0 && 
      inputs.ytdIncome > 0 && 
      inputs.paysReceived > 0
    )
  }, [inputs, touchedFields])

  const handleInputChange = (field: keyof AnnualisationInputs, value: string | number) => {
    setInputs((prev) => ({
      ...prev,
      [field]: typeof value === "string" && field !== "payFrequency" ? Number(value) : value,
    }))

    // Mark field as touched (except for payFrequency)
    if (field !== "payFrequency") {
      setTouchedFields((prev) => ({
        ...prev,
        [field]: true,
      }))
    }
  }

  // Utility functions
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
          <h1 className="text-4xl lg:text-5xl font-sans text-slate-600">Income Annualisation Calculator</h1>
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
                {/* Income Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">YTD Income Details</h3>

                  <div className="space-y-5">
                    {/* YTD Income */}
                    <div className="space-y-2">
                      <Label htmlFor="ytdIncome" className="text-sm font-medium text-slate-300">
                        Year-to-Date Income
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 text-lg font-bold">$</span>
                        </div>
                        <Input
                          type="number"
                          id="ytdIncome"
                          value={inputs.ytdIncome || ""}
                          onChange={(e) => handleInputChange("ytdIncome", e.target.value)}
                          className={`pl-8 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 text-lg ${
                            touchedFields.ytdIncome && errors.ytdIncome ? "border-red-400 focus:border-red-400" : ""
                          }`}
                          placeholder="65,000"
                        />
                      </div>
                      {touchedFields.ytdIncome && errors.ytdIncome && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{errors.ytdIncome}</p>
                        </div>
                      )}
                    </div>

                    {/* Pay Periods Received */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-slate-300">Pay Periods Received</Label>
                        <Badge className="bg-slate-600 text-slate-300 border-slate-500">
                          {inputs.paysReceived} {inputs.paysReceived === 1 ? "pay" : "pays"}
                        </Badge>
                      </div>
                      <Slider
                        value={[inputs.paysReceived]}
                        onValueChange={([value]) => {
                          handleInputChange("paysReceived", value)
                          setTouchedFields((prev) => ({ ...prev, paysReceived: true }))
                        }}
                        max={payFrequencyConfig[inputs.payFrequency].periodsPerYear}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>0 pays</span>
                        <span>{payFrequencyConfig[inputs.payFrequency].periodsPerYear} pays</span>
                      </div>
                      {touchedFields.paysReceived && errors.paysReceived && (
                        <div className="flex items-center space-x-2 text-red-400 animate-fade-in">
                          <AlertCircle className="h-4 w-4" />
                          <p className="text-sm">{errors.paysReceived}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pay Frequency */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-slate-300">Pay Frequency</Label>
                  <RadioGroup
                    value={inputs.payFrequency}
                    onValueChange={(value) => {
                      handleInputChange("payFrequency", value)
                      // Reset pays received when frequency changes
                      setInputs(prev => ({ ...prev, paysReceived: 0 }))
                      setTouchedFields(prev => ({ ...prev, paysReceived: false }))
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {Object.entries(payFrequencyConfig).map(([key, config]) => (
                      <div key={key} className="relative">
                        <RadioGroupItem value={key} id={key} className="peer sr-only" />
                        <Label
                          htmlFor={key}
                          className="flex flex-col items-center justify-center p-4 bg-slate-700/30 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 peer-data-[state=checked]:border-blue-400 peer-data-[state=checked]:bg-blue-500/10 transition-all duration-200"
                        >
                          <Calendar className="h-5 w-5 mb-2 text-slate-400 peer-data-[state=checked]:text-blue-400" />
                          <span className="font-medium text-sm text-white">{config.label}</span>
                          <Badge variant="secondary" className="mt-1 text-xs bg-slate-600 text-slate-300">
                            {config.description}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Information Panel */}
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="text-xs text-slate-400 space-y-1">
                      <p className="text-blue-400 font-medium">Lender Use Case:</p>
                      <p>• Annualise PAYG earnings for loan assessment</p>
                      <p>• Higher accuracy with more pay periods completed</p>
                      <p>• Ideal for part-year employment verification</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Results */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Annualisation Results</h3>

                {calculateAnnualisation ? (
                  <div className="space-y-6">
                    {/* Main Annualised Income Display */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-2 border-white p-6 rounded-2xl shadow-xl ring-2 ring-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-blue-200">Annualised Income</h4>
                        <ArrowRight className="h-5 w-5 text-blue-300" />
                      </div>
                      <p className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {formatCurrency(calculateAnnualisation.annualisedIncome)}
                      </p>
                      <p className="text-blue-100">Projected annual earnings</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Average Pay
                          </span>
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(calculateAnnualisation.averagePayAmount)}
                        </p>
                      </div>

                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Pays Remaining
                          </span>
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {formatNumber(calculateAnnualisation.remainingPayPeriods)}
                        </p>
                      </div>

                      <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                            Months Elapsed
                          </span>
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-lg font-bold text-white">
                          {calculateAnnualisation.monthsElapsed.toFixed(1)}
                        </p>
                      </div>

                    </div>

                    {/* Pay Period Visualization */}
                    <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        <span>Pay Period Progress</span>
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="relative">
                          <div className="w-full bg-slate-800/50 rounded-full h-4 border border-slate-600">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                              style={{ 
                                width: `${(inputs.paysReceived / calculateAnnualisation.totalPayPeriodsInYear) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white drop-shadow-lg">
                              {((inputs.paysReceived / calculateAnnualisation.totalPayPeriodsInYear) * 100).toFixed(1)}% Complete
                            </span>
                          </div>
                        </div>

                        {/* Visual Days Grid */}
                        <div className="grid grid-cols-13 gap-1.5 p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                          {Array.from({ length: calculateAnnualisation.totalPayPeriodsInYear }, (_, index) => (
                            <div
                              key={index}
                              className={`
                                w-4 h-4 rounded-sm transition-all duration-200 border
                                ${index < inputs.paysReceived 
                                  ? 'bg-green-500 border-green-400 shadow-sm shadow-green-500/50' 
                                  : 'bg-slate-600/50 border-slate-500 hover:bg-slate-500/70'
                                }
                              `}
                              title={`Pay ${index + 1}: ${index < inputs.paysReceived ? 'Received' : 'Remaining'}`}
                            />
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-sm border border-green-400"></div>
                            <span className="text-green-400 font-medium">
                              {inputs.paysReceived} Paid
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-slate-600/50 rounded-sm border border-slate-500"></div>
                            <span className="text-slate-400 font-medium">
                              {calculateAnnualisation.remainingPayPeriods} Remaining
                            </span>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Periods</p>
                            <p className="text-lg font-bold text-white">{calculateAnnualisation.totalPayPeriodsInYear}</p>
                          </div>
                          <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <p className="text-xs text-green-400 uppercase tracking-wider mb-1">Completed</p>
                            <p className="text-lg font-bold text-green-400">{inputs.paysReceived}</p>
                          </div>
                          <div className="text-center p-3 bg-slate-500/10 rounded-lg border border-slate-500/30">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pending</p>
                            <p className="text-lg font-bold text-slate-300">{calculateAnnualisation.remainingPayPeriods}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Toggle */}
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700 hover:text-white"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>View Income Breakdown</span>
                          {showBreakdown ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </Button>

                      {showBreakdown && annualisationBreakdown.length > 0 && (
                        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 animate-fade-in">
                          <h4 className="font-semibold text-white mb-4">Annualisation Breakdown</h4>
                          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-600">
                            <Table>
                              <TableHeader className="sticky top-0 bg-slate-800">
                                <TableRow className="border-slate-600">
                                  <TableHead className="text-slate-300 font-medium text-xs">Component</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Periods</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Amount</TableHead>
                                  <TableHead className="text-slate-300 font-medium text-xs">Type</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {annualisationBreakdown.map((item, index) => (
                                  <TableRow
                                    key={index}
                                    className="border-slate-600 hover:bg-slate-700/20"
                                  >
                                    <TableCell className="text-slate-300 text-xs">
                                      {item.description}
                                    </TableCell>
                                    <TableCell className="text-white text-xs font-mono">
                                      {formatNumber(item.periods)}
                                    </TableCell>
                                    <TableCell className={`text-xs font-mono ${item.type === "actual" ? "text-green-300" : "text-amber-300"}`}>
                                      {formatCurrency(item.amount)}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      <Badge variant="secondary" className={`text-xs ${item.type === "actual" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                                        {item.type === "actual" ? "Actual" : "Projected"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Total Summary */}
                          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
                            <div className="grid grid-cols-4 gap-2 text-sm font-bold">
                              <div className="text-slate-300">Total Annual:</div>
                              <div className="text-white">
                                {formatNumber(calculateAnnualisation.totalPayPeriodsInYear)}
                              </div>
                              <div className="text-white">
                                {formatCurrency(calculateAnnualisation.annualisedIncome)}
                              </div>
                              <div className="text-blue-400">Calculated</div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-slate-400 space-y-1">
                            <p>• Green = Actual income already received</p>
                            <p>• Amber = Projected income based on average pay</p>
                            <p>• Formula: (YTD Income ÷ Pays Received) × Total Annual Pays</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                        <div className="text-xs text-slate-400 space-y-1">
                          <p>• Calculations assume consistent pay amounts for remaining periods</p>
                          <p>• Results are estimates for lending assessment purposes</p>
                          <p>• Accuracy improves with more completed pay periods</p>
                          <p>• Consider bonuses, overtime, and employment changes separately</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calculator className="h-8 w-8 text-slate-400" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2 text-white">Enter income details</h4>
                    <p className="text-slate-400 text-sm">Fill in YTD income and pay periods to calculate annualised earnings</p>
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