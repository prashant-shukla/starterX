import type { ComponentType } from 'react'

export interface SimpleReport {
  id: string
  name: string
  type: string
  date: string
  period: string
  revenue: string
  expenses: string
  net: string
}

export interface DetailedReport {
  id: string
  monthName: string
  publishedDate: string
  type: string
  reportsCount: number
  revenue: number
  costs: number
  profit: number
  detailedData: {
    profitLoss: {
      totalRevenue: number
      totalExpenses: number
      grossProfit: number
      netIncome: number
      categories: Array<{ name: string; amount: number }>
    }
    balanceSheet: {
      totalAssets: number
      totalLiabilities: number
      equity: number
      currentAssets: number
      currentLiabilities: number
    }
    cashFlow: {
      operatingCashFlow: number
      investingCashFlow: number
      financingCashFlow: number
      netCashFlow: number
      monthlyData: Array<{ month: string; inflow: number; outflow: number; net: number }>
    }
  }
}

export interface OtherDocument {
  id: number | string
  name: string
  date: string
  uploadedBy?: string
  uploadedDate?: string
  fileName?: string
  size?: string
}

export interface BankAccount {
  name: string
  type: string
  lastFour: string
  balance: number
  icon?: string
}

export interface CreditCard {
  name: string
  type: string
  lastFour: string
  balance: number
  icon?: string
}

export interface FinancialItem {
  name: string
  amount: number
}

export interface QuickAction {
  label: string
  query: string
  icon: ComponentType<any> | any
}

export interface NavigationItem {
  id: string
  label: string
  icon?: string
  badge?: string
}

export interface Company {
  value: string
  label: string
}

export type OnboardingClient = {
  id: string
  name: string
  firstName: string
  lastName: string
  joined?: string
  clientSetup: { completed: number; total: number }
  accountsIntegrations: { completed: number; total: number }
  documentsCollection: { completed: number; total: number }
  review: { completed: number; total: number }
  status: string
  manager: string
}

export type Contractor = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateJoined: string
  status: string
  position: string
  payoutPercentage: number
  assignedClients: number
  login?: string
  password?: string
}

export type ContractorPayout = {
  id: string
  name: string
  totalPayout: number
  paidStatus: string
  clientDetails: any[]
}

export type MonthlyData = {
  month: string
  monthly: number
  catchUp: number
  cfo: number
  payroll: number
  qbFee: number
  status: 'paid' | 'not-paid' | 'issues' | string
  notes: string
}

export default {} as unknown as void
