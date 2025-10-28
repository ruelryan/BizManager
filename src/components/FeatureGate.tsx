import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import { useStore, getEffectivePlan } from '../store/useStore';
import { canAccessFeature } from '../utils/plans';
import { trackFeatureGateHit } from '../utils/googleAnalytics';

interface FeatureGateProps {
  feature: 'hasReports' | 'hasPdfInvoices' | 'hasGoalTracking' | 'hasCashFlowReport';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { user } = useStore();
  
  if (!user) {
    return null;
  }

  const effectivePlan = getEffectivePlan(user);
  const hasAccess = canAccessFeature(effectivePlan, feature);

  // Track when users hit feature gates
  React.useEffect(() => {
    if (!hasAccess) {
      trackFeatureGateHit(feature, effectivePlan);
    }
  }, [hasAccess, feature, effectivePlan]);

  if (!hasAccess) {
    return (
      fallback || (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <Lock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Premium Feature</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This feature is available on Starter and Pro plans.
          </p>
          <Link
            to="/pricing"
            className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-purple-700"
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade Now
          </Link>
        </div>
      )
    );
  }

  return <>{children}</>;
}