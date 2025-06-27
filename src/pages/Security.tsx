import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Server, Database, Key, FileCheck, Bell, Eye } from 'lucide-react';

export function Security() {
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Security at BizManager</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We take the security of your business data seriously. Learn about our comprehensive approach to protecting your information.
          </p>
        </div>
      </section>

      {/* Security Overview */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Security Commitment</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-gray-700 dark:text-gray-300">
                At BizManager, security isn't just a feature—it's the foundation of our platform. We understand that your business data is one of your most valuable assets, which is why we've implemented industry-leading security measures to ensure it remains protected at all times.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Our security approach follows a defense-in-depth strategy, with multiple layers of protection across our infrastructure, application, and operations. We continuously monitor, test, and improve our security controls to stay ahead of emerging threats.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                We're committed to transparency about our security practices and are happy to answer any questions you may have about how we protect your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Key Security Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Data Encryption</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All data is encrypted both in transit and at rest using industry-standard encryption protocols (TLS 1.3, AES-256).
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure Authentication</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Multi-factor authentication, secure password policies, and session management protect your account access.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Data Isolation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Row-level security ensures your data is completely isolated from other customers' data.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Infrastructure Security</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our infrastructure is hosted on enterprise-grade cloud providers with SOC 2 and ISO 27001 certifications.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Monitoring & Alerts</h3>
              <p className="text-gray-600 dark:text-gray-400">
                24/7 monitoring for suspicious activities with automated alerts and incident response procedures.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Regular Audits</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We conduct regular security audits and penetration testing to identify and address potential vulnerabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Privacy */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Data Privacy</h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 mb-8">
              <div className="flex items-start mb-4">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-1" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Our Privacy Principles</h3>
              </div>
              <ul className="space-y-4 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 font-bold">✓</span>
                  <span><strong>Your Data Belongs to You</strong> - We never sell your data to third parties or use it for advertising purposes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 font-bold">✓</span>
                  <span><strong>Transparency</strong> - We're clear about what data we collect and how we use it in our Privacy Policy.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 font-bold">✓</span>
                  <span><strong>Data Minimization</strong> - We only collect the data necessary to provide and improve our services.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 font-bold">✓</span>
                  <span><strong>Control</strong> - You can access, export, or delete your data at any time through your account settings.</span>
                </li>
              </ul>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              We comply with relevant data protection regulations and are committed to maintaining the highest standards of data privacy. Our comprehensive Privacy Policy details how we collect, use, and protect your information.
            </p>
            
            <div className="text-center">
              <Link 
                to="/privacy-policy.html" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security FAQ */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Security FAQ</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">How is my data backed up?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data is automatically backed up multiple times daily to geographically distributed locations. We maintain point-in-time recovery capabilities with a recovery point objective (RPO) of less than 1 hour.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">What happens if there's a security breach?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We have a comprehensive incident response plan in place. In the unlikely event of a breach, we will promptly notify affected users, take immediate steps to contain and remediate the issue, and provide clear guidance on any actions you should take.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Can I export my data if I decide to leave?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can export all your business data at any time through your account settings. We provide exports in standard formats (CSV, Excel) that can be imported into other systems.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">How do you handle third-party integrations?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                When you connect third-party services to BizManager, we only request the minimum permissions necessary. We regularly review our integration partners' security practices and require them to maintain high security standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report Security Issues */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Report Security Issues</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              We appreciate the work of security researchers in improving the security of our platform. If you believe you've found a security vulnerability in BizManager, we encourage you to report it to us responsibly.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Please email <a href="mailto:security@bizmanager.com" className="text-blue-600 dark:text-blue-400 underline">security@bizmanager.com</a> with details of the issue. We commit to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Acknowledge receipt of your report within 24 hours</li>
              <li>Provide an initial assessment of the report within 48 hours</li>
              <li>Work with you to understand and resolve the issue quickly</li>
              <li>Keep you informed about our progress</li>
              <li>Recognize your contribution if you wish (or maintain your anonymity)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              We do not engage in legal action against security researchers who act in good faith and follow responsible disclosure principles.
            </p>
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