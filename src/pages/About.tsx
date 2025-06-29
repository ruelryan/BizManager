import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Beaker, Code, Briefcase, Award, GraduationCap, CheckCircle, ArrowRight } from 'lucide-react';

export function About() {
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
        <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Precision in Science, Excellence in Code</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl">
              From laboratory precision to web development innovation - bringing analytical expertise and technical leadership to every project.
            </p>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
              <img 
                src="/263811169_609784763605045_5307824981917022036_n.jpg" 
                alt="Ruel Ryan Rosal" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-gray-700 dark:text-gray-300">
                As a Registered Chemist (RCh) with extensive experience in laboratory management and quality control, I've developed a unique approach to problem-solving that combines scientific precision with practical business acumen. My journey from leading technical teams at PASAR Corporation to managing laboratory operations at Cebu Agua Lab has equipped me with invaluable skills in analytical thinking, process optimization, and quality assurance.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Today, I apply this same methodical approach to web development, creating solutions that are not only technically sound but also aligned with real business needs. As the owner of E & J Appliances Furniture since 2022, I understand firsthand the challenges businesses face and develop web applications that address these pain points effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Our Core Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Beaker className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Analytical Precision</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every project benefits from the same methodical approach and attention to detail that's essential in laboratory science. I break down complex problems into manageable components and build solutions with precision.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Business-Focused</h3>
              <p className="text-gray-600 dark:text-gray-400">
                As a business owner myself, I understand that technology must serve practical needs. I develop solutions with real-world business requirements in mind, focusing on usability, efficiency, and measurable outcomes.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Technical Excellence</h3>
              <p className="text-gray-600 dark:text-gray-400">
                My background in implementing ISO 17025 standards and quality management systems translates to web development through clean code, thorough testing, and robust documentation. Quality isn't just a goal—it's a requirement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise & Certifications */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Expertise & Certifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                  <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Professional Qualifications</h3>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Registered Chemist (RCh)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Philippine Professional Regulation Commission</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Pollution Control Officer</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Department of Environment and Natural Resources</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Basic Occupational Safety and Health Training</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">DOLE - OSHC</div>
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Technical Expertise</h3>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Laboratory Management Systems</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">ISO 17025 implementation and quality control</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Web Development</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">React, TypeScript, Node.js, and database management</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Business Operations</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Inventory management, e-commerce, and process optimization</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Key Achievements</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-md">
              <ul className="space-y-6">
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Quality Management Excellence</h3>
                    <p className="text-gray-700 dark:text-gray-300">Successfully implemented ISO 17025 standards at PASAR Corporation, improving operational efficiency by 35% and establishing robust quality control systems.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Technical Leadership</h3>
                    <p className="text-gray-700 dark:text-gray-300">Led laboratory operations at Cebu Agua Lab, managing technical staff and ensuring compliance with regulatory requirements while optimizing analytical procedures.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mr-4 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Business Growth</h3>
                    <p className="text-gray-700 dark:text-gray-300">Established and grew E & J Appliances Furniture from startup to profitable operation, implementing custom web solutions for inventory and sales management.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Me */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Why Work With Me</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border border-blue-100 dark:border-blue-800">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                My unique background combines scientific precision with practical business experience, allowing me to approach web development projects with both technical excellence and business acumen. When you work with me, you get:
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">A methodical approach to problem-solving that breaks down complex challenges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Solutions built with both technical excellence and business objectives in mind</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Attention to detail that ensures quality at every step of the development process</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">A business owner's perspective that understands your challenges and goals</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Work Together?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's discuss how my unique blend of scientific precision and business acumen can help your next web development project succeed.
          </p>
          <Link 
            to="/contact" 
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg"
          >
            Get in Touch
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Ruel Ryan Rosal, RCh. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}