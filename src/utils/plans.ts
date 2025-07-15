import { Plan } from '../types';

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: '₱',
    features: {
      maxProducts: 10,
      maxSalesPerMonth: 30,
      hasReports: false,
      hasPdfInvoices: false,
      hasGoalTracking: false,
      hasCashFlowReport: false,
      hasExpenseTracking: false,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    currency: '₱',
    popular: true,
    features: {
      maxProducts: null,
      maxSalesPerMonth: null,
      hasReports: true,
      hasPdfInvoices: false,
      hasGoalTracking: false,
      hasCashFlowReport: false,
      hasExpenseTracking: true,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    currency: '₱',
    features: {
      maxProducts: null,
      maxSalesPerMonth: null,
      hasReports: true,
      hasPdfInvoices: true,
      hasGoalTracking: true,
      hasCashFlowReport: true,
      hasExpenseTracking: true,
    },
  },
];

const getPlanFeatures = (planId: string) => {
  return plans.find((plan) => plan.id === planId)?.features;
};

export const canAccessFeature = (userPlan: string, feature: keyof Plan['features']) => {
  const planFeatures = getPlanFeatures(userPlan);
  return planFeatures ? planFeatures[feature] : false;
};