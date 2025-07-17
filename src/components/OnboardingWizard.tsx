import React, { useState } from 'react';

const steps = [
  {
    title: 'Welcome',
    content: (
      <div>
        <h2 className="text-2xl font-bold mb-2">Welcome to BizManager!</h2>
        <p className="mb-4">Let’s get your business set up in a few quick steps.</p>
      </div>
    ),
  },
  {
    title: 'Business Info',
    content: (
      <div>
        <h2 className="text-xl font-semibold mb-2">Business Information</h2>
        <label htmlFor="businessName" className="block mb-1">Business Name</label>
        <input id="businessName" name="businessName" className="w-full mb-3 p-2 border rounded" placeholder="Enter your business name" />
        <label htmlFor="businessAddress" className="block mb-1">Business Address</label>
        <input id="businessAddress" name="businessAddress" className="w-full mb-3 p-2 border rounded" placeholder="Enter your business address" />
      </div>
    ),
  },
  {
    title: 'Add Product',
    content: (
      <div>
        <h2 className="text-xl font-semibold mb-2">Add Your First Product</h2>
        <label htmlFor="productName" className="block mb-1">Product Name</label>
        <input id="productName" name="productName" className="w-full mb-3 p-2 border rounded" placeholder="Enter product name" />
      </div>
    ),
  },
  {
    title: 'Dashboard Tour',
    content: (
      <div>
        <h2 className="text-xl font-semibold mb-2">Quick Dashboard Tour</h2>
        <p className="mb-4">Explore the dashboard features and navigation.</p>
      </div>
    ),
  },
];

export function OnboardingWizard({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full p-6 relative">
        <button
          aria-label="Close onboarding"
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none"
        >
          ×
        </button>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex-1 h-2 mx-1 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                aria-label={`Step ${i + 1}: ${s.title}`}
              />
            ))}
          </div>
          <h3 className="text-lg font-bold mb-2">{steps[step].title}</h3>
        </div>
        <div className="mb-6">{steps[step].content}</div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {step === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
} 