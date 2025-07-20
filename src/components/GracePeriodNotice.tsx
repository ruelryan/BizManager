import React from 'react';
import { Clock, Shield, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface GracePeriodNoticeProps {
  subscription: {
    current_period_end?: string;
    plan_type: string;
    [key: string]: any;
  };
  failureCount: number;
  className?: string;
}

export function GracePeriodNotice({ subscription, failureCount, className = '' }: GracePeriodNoticeProps) {
  // Calculate grace period details
  const maxFailures = 3;
  const remainingAttempts = maxFailures - failureCount;
  const isInGracePeriod = failureCount > 0 && failureCount < maxFailures;
  const isCritical = failureCount >= 2;
  
  // Calculate estimated next retry dates (PayPal typically retries after 1, 3, 5 days)
  const retrySchedule = [1, 3, 5]; // days
  const getNextRetryDates = () => {
    const dates = [];
    const currentDate = new Date();
    
    for (let i = failureCount; i < Math.min(maxFailures, failureCount + 2); i++) {
      if (retrySchedule[i]) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + retrySchedule[i]);
        dates.push({
          attempt: i + 1,
          date: nextDate,
          days: retrySchedule[i]
        });
      }
    }
    
    return dates;
  };

  const nextRetries = getNextRetryDates();
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  
  // Calculate days until subscription would actually end
  const daysUntilExpiry = currentPeriodEnd ? 
    Math.ceil((currentPeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  if (!isInGracePeriod) {
    return null;
  }

  // Removed unused function

  const getStatusIcon = () => {
    if (isCritical) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className={`rounded-lg border-l-4 p-4 ${
      isCritical ? 
        'border-red-500 bg-red-50 dark:bg-red-900/20' :
        'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    } ${className}`}>
      <div className="flex items-start space-x-3">
        {getStatusIcon()}
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className={`font-semibold ${
              isCritical ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {isCritical ? '⚠️ Critical: Payment Grace Period' : '📅 Payment Grace Period Active'}
            </h3>
            
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isCritical ? 
                'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
            }`}>
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </div>
          </div>

          <p className={`text-sm mb-3 ${
            isCritical ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {isCritical ? 
              'Your subscription is at risk of being suspended. We will make one more attempt to charge your payment method.' :
              `We've had trouble charging your payment method, but don't worry - your service continues while we retry.`
            }
          </p>

          {/* Grace Period Features */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className={`text-sm font-medium ${
                isCritical ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                What's protected during grace period:
              </span>
            </div>
            
            <ul className={`text-sm space-y-1 ml-6 ${
              isCritical ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Full access to all {subscription.plan_type} features continues</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>No service interruption or data loss</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Automatic payment retries continue</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span>Access until {currentPeriodEnd?.toLocaleDateString()} ({daysUntilExpiry} days)</span>
              </li>
            </ul>
          </div>

          {/* Retry Schedule */}
          {nextRetries.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className={`text-sm font-medium ${
                  isCritical ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  Upcoming retry schedule:
                </span>
              </div>
              
              <div className="space-y-1 ml-6">
                {nextRetries.map((retry, index) => (
                  <div key={index} className={`text-sm flex items-center space-x-2 ${
                    isCritical ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <span>
                      Attempt #{retry.attempt}: {retry.date.toLocaleDateString()} 
                      <span className="text-xs opacity-75">
                        ({retry.days} day{retry.days !== 1 ? 's' : ''} from now)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What happens next */}
          <div className={`text-xs p-3 rounded-lg ${
            isCritical ? 
              'bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200' :
              'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200'
          }`}>
            <p className="font-medium mb-1">
              {isCritical ? '🚨 Final Notice:' : '💡 What happens next:'}
            </p>
            <p>
              {isCritical ? 
                'If our final payment attempt fails, your subscription will be suspended but you can reactivate it anytime by updating your payment method.' :
                'We\'ll automatically retry charging your payment method. You can also update your payment method anytime to resolve this immediately.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}