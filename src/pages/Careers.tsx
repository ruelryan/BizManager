import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, DollarSign, Briefcase, Send } from 'lucide-react';

export function Careers() {
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote (Philippines)',
      type: 'Full-time',
      salary: '₱80,000 - ₱120,000/month',
      description: 'We\'re looking for an experienced frontend developer to help build and improve our React-based web application. You'll work closely with our design and backend teams to create intuitive, responsive interfaces.',
      requirements: [
        'At least 4 years of experience with modern JavaScript and React',
        'Strong understanding of TypeScript, state management, and responsive design',
        'Experience with Tailwind CSS or similar utility-first CSS frameworks',
        'Familiarity with testing frameworks like Jest and React Testing Library',
        'Excellent problem-solving skills and attention to detail'
      ]
    },
    {
      title: 'Backend Developer',
      department: 'Engineering',
      location: 'Makati City, Philippines',
      type: 'Full-time',
      salary: '₱70,000 - ₱100,000/month',
      description: 'Join our backend team to develop and maintain the APIs and services that power our business management platform. You\'ll work with modern technologies to build scalable, reliable systems.',
      requirements: [
        'At least 3 years of experience with Node.js and PostgreSQL',
        'Experience with RESTful API design and implementation',
        'Knowledge of serverless architectures and cloud services (AWS/Azure/GCP)',
        'Understanding of security best practices and performance optimization',
        'Ability to write clean, maintainable code with proper documentation'
      ]
    },
    {
      title: 'Product Marketing Manager',
      department: 'Marketing',
      location: 'Hybrid (Manila, Philippines)',
      type: 'Full-time',
      salary: '₱60,000 - ₱90,000/month',
      description: 'We\'re seeking a creative and data-driven Product Marketing Manager to help us reach more small businesses in the Philippines. You'll develop marketing strategies, create compelling content, and work with our sales team to drive growth.',
      requirements: [
        'At least 3 years of experience in B2B SaaS marketing',
        'Strong understanding of the Philippine small business market',
        'Excellent written and verbal communication skills in both English and Filipino',
        'Experience with digital marketing channels and analytics',
        'Ability to translate technical features into compelling benefits'
      ]
    },
    {
      title: 'Customer Success Specialist',
      department: 'Customer Support',
      location: 'Manila, Philippines',
      type: 'Full-time',
      salary: '₱35,000 - ₱50,000/month',
      description: 'Help our customers get the most out of BizManager by providing exceptional support and training. You\'ll be the voice of our company, ensuring customers are successful and satisfied with our platform.',
      requirements: [
        'At least 2 years of customer support experience, preferably in SaaS',
        'Strong problem-solving skills and patience',
        'Excellent communication skills in both English and Filipino',
        'Basic technical understanding of web applications',
        'Ability to work in shifts to provide extended support hours'
      ]
    }
  ];

  const benefits = [
    {
      title: 'Competitive Compensation',
      description: 'Above-market salary packages with performance bonuses and equity options for all full-time employees.'
    },
    {
      title: 'Flexible Work Arrangements',
      description: 'Remote-first culture with flexible hours. We care about results, not when or where you work.'
    },
    {
      title: 'Health and Wellness',
      description: 'Comprehensive health insurance, HMO coverage for dependents, and wellness allowance for gym memberships or fitness activities.'
    },
    {
      title: 'Professional Growth',
      description: 'Learning budget for courses, conferences, and certifications. Regular mentorship and career development planning.'
    },
    {
      title: 'Work-Life Balance',
      description: 'Generous paid time off, including vacation days, sick leave, and personal days. We encourage everyone to disconnect and recharge.'
    },
    {
      title: 'Modern Equipment',
      description: 'Your choice of high-end laptop and peripherals, plus a budget for setting up your home office.'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header with back button */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Help us build the future of business management software for entrepreneurs across the Philippines and beyond.
          </p>
        </div>
      </section>

      {/* Company Culture */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Culture</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-gray-700 dark:text-gray-300">
                At BizManager, we're building more than just software—we're creating tools that empower entrepreneurs to succeed. Our team is passionate about making a real difference in the lives of small business owners across the Philippines.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                We believe in a collaborative, transparent, and inclusive work environment where everyone's voice is heard. We value innovation, continuous learning, and a healthy work-life balance. Our remote-first approach means you can work from anywhere in the Philippines, with flexible hours that suit your lifestyle.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                If you're excited about solving real problems for real businesses, if you thrive in a fast-paced environment where you can make an impact, and if you're committed to excellence in everything you do—we want to hear from you!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Why Work With Us</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Open Positions</h2>
          
          <div className="max-w-5xl mx-auto space-y-8">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{position.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Briefcase className="h-4 w-4 mr-1" />
                      <span>{position.department}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{position.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{position.type}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{position.salary}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-6">{position.description}</p>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Requirements:</h4>
                  <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-600 dark:text-gray-400">
                    {position.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                  
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    Apply for this position
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Our Hiring Process</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-blue-200 dark:bg-blue-900/50"></div>
              
              <div className="space-y-12">
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Application Review</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our team reviews your application, resume, and any work samples you've provided. We aim to respond to all applications within 5 business days.
                  </p>
                </div>
                
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Initial Interview</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    A 30-45 minute video call with our HR team to discuss your background, experience, and what you're looking for in your next role.
                  </p>
                </div>
                
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Technical Assessment</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Depending on the role, you may be asked to complete a take-home assignment or participate in a technical interview to demonstrate your skills.
                  </p>
                </div>
                
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">4</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Team Interview</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Meet with the team you'll be working with to discuss your experience in more depth and get a feel for the team dynamics.
                  </p>
                </div>
                
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">5</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Final Interview</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    A conversation with a senior leader to discuss your career goals, answer any remaining questions, and ensure mutual fit.
                  </p>
                </div>
                
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <span className="text-green-600 dark:text-green-400 font-bold text-xl">✓</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Offer & Onboarding</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    If there's a mutual fit, we'll extend an offer and work with you to ensure a smooth onboarding process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* General Application */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Don't See a Perfect Fit?</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              We're always looking for talented individuals to join our team. If you don't see a position that matches your skills but believe you could contribute to BizManager, we'd still love to hear from you!
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Send your resume and a brief note about how you could help us build better business management tools to <a href="mailto:careers@bizmanager.com" className="text-blue-600 dark:text-blue-400 underline">careers@bizmanager.com</a>.
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
              <Send className="h-4 w-4 mr-2" />
              Submit General Application
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 BizManager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}