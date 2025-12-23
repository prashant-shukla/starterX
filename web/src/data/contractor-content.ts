// Shared static content for contractor training and workflows.
// Centralized so components can import from one place. This can later be replaced
// with backend-driven content or fetched from a CMS.

export const BOOKKEEPER_TRAINING: Array<any> = [
  {
    week: 'Week 1',
    title: 'Foundations of Bookkeeping',
    videos: [
      { title: 'Intro to the Platform', duration: '8:34', description: 'Overview of workflows and navigation' },
      { title: 'Basic Transactions', duration: '12:02', description: 'Recording income and expenses' }
    ]
  },
  {
    week: 'Week 2',
    title: 'Advanced Bookkeeping',
    videos: [
      { title: 'Reconciling Accounts', duration: '10:45' },
      { title: 'Month-end Close', duration: '14:20' }
    ]
  }
]

export const CLIENT_WORKFLOWS: any = {
  onboarding: [
    { title: 'Collect Client Info', description: 'Gather contact and company details, initial permissions.' },
    { title: 'Set Up Accounts', description: 'Connect bank accounts and chart of accounts.' }
  ],
  catchUp: [
    { title: 'Historical Data Import', description: 'Import past transactions and reconcile historical balances.' },
    { title: 'Cleanup Review', description: 'Review and categorize historical transactions.' }
  ],
  monthly: [
    { title: 'Monthly Reconciliations', description: 'Reconcile bank and credit card accounts.' },
    { title: 'Financial Review', description: 'Prepare P&L and balance sheet for client review.' }
  ]
}

export default {
  BOOKKEEPER_TRAINING,
  CLIENT_WORKFLOWS
}
