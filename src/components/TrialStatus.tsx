import React from 'react';
import { Clock, Crown, AlertTriangle } from 'lucide-react';
import { useStore, isInFreeTrial, getTrialDaysRemaining, hasUsedTrial } from '../store/useStore';

export function TrialStatus() {
  const { user } = useStore();

  if (!user) return null;

  const inTrial = isInFreeTrial(user);
  const daysRemaining = getTrialDaysRemaining(user);
  const trialUsed = hasUsedTrial(user);

  // Don't show anything if user has a paid subscription
  if (user.subscription?.status === 'ACTIVE') {
    return null;
  }

  // Trial is active
  if (inTrial) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                Pro Trial Active
              </h3>
              <div className="flex items-center space-x-1 text-sm font-medium text-purple-700 dark:text-purple-300">
                <Clock className="h-4 w-4" />
                <span>{daysRemaining} days left</span>
              </div>
            </div>
            <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
              You're experiencing all Pro features during your free trial. 
              {daysRemaining <= 3 && (
                <span className="font-medium"> Your trial expires soon!</span>
              )}
            </p>
            <div className="mt-3">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(10, (daysRemaining / 14) * 100)}%` }}
                />
              </div>
            </div>
            {daysRemaining <= 3 && (
              <div className="mt-3">
                <a
                  href="/upgrade"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Subscribe Now
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Trial has expired or user is on free plan
  if (trialUsed && user.plan === 'free') {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                Trial Expired
              </h3>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded">
                Free Plan
              </span>
            </div>
            <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
              Your 14-day Pro trial has ended. Upgrade to continue using Pro features.
            </p>
            <div className="mt-3">
              <a
                href="/upgrade"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User hasn't used trial yet
  if (!trialUsed && user.plan === 'free') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Crown className="h-6 w-6 text-green-600 dark:text-green-400 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Start Your Free Trial
              </h3>
              <span className="text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">
                14 Days Free
              </span>
            </div>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              Try all Pro features free for 14 days. No credit card required.
            </p>
            <div className="mt-3">
              <button
                onClick={async () => {
                  try {
                    await useStore.getState().startFreeTrial();
                  } catch (error) {
                    console.error('Failed to start trial:', error);
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}