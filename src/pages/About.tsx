import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Beaker, Code, Briefcase, Award, GraduationCap, CheckCircle } from 'lucide-react';

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
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8 relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
            <img 
              src="/263811169_609784763605045_5307824981917022036_n.jpg" 
              alt="Professional headshot" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">From Laboratory to Web Development</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Leveraging analytical precision and technical expertise across disciplines
          </p>
        </div>
      </section>

      {/* Professional Journey */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Professional Journey</h2>
            <div className="prose prose-lg dark:prose-invert">
              <p className="text-gray-700 dark:text-gray-300">
                My career path has been defined by a passion for precision, analytical thinking, and problem-solving. Beginning in laboratory science, I developed a meticulous approach to technical challenges that has proven invaluable in my transition to web development and business ownership.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                As Laboratory Head at Cebu Agua Lab and Methods Development Manager at PASAR Corporation, I honed my skills in quality control, technical leadership, and systematic problem-solving. These experiences taught me to approach complex challenges methodically, maintain rigorous standards, and effectively lead technical teams—skills that translate seamlessly to web development.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Today, I apply this same analytical mindset to creating web solutions, combining scientific precision with creative problem-solving. As the owner of E & J Appliances Furniture since 2022, I've gained firsthand understanding of business needs, allowing me to develop web applications that address real-world challenges faced by entrepreneurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Timeline */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Professional Experience</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-blue-200 dark:bg-blue-900/50"></div>
              
              <div className="space-y-12">
                {/* Web Development & Business */}
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Web Developer & Business Owner</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">2022 - Present</p>
                  <div className="text-gray-700 dark:text-gray-300">
                    <p className="mb-2">Transitioned to web development, applying analytical skills from laboratory background to create technical solutions. Currently own and operate E & J Appliances Furniture, where I implement web solutions to streamline business operations.</p>
                    <ul className="list-disc pl-5 space-y-1 mt-3">
                      <li>Developed e-commerce solutions and inventory management systems</li>
                      <li>Created data-driven web applications for business analytics</li>
                      <li>Applied technical expertise to real-world business challenges</li>
                    </ul>
                  </div>
                </div>
                
                {/* PASAR Corporation */}
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <Beaker className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Methods Development Manager</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">PASAR Corporation</p>
                  <div className="text-gray-700 dark:text-gray-300">
                    <p className="mb-2">Led technical innovation and quality control initiatives for laboratory operations, managing method development and validation processes.</p>
                    <ul className="list-disc pl-5 space-y-1 mt-3">
                      <li>Implemented ISO 17025 standards and quality management systems</li>
                      <li>Directed technical teams in developing and validating analytical methods</li>
                      <li>Optimized laboratory processes for improved efficiency and accuracy</li>
                    </ul>
                  </div>
                </div>
                
                {/* Cebu Agua Lab */}
                <div className="relative pl-20">
                  <div className="absolute left-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                    <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Laboratory Head</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Cebu Agua Lab</p>
                  <div className="text-gray-700 dark:text-gray-300">
                    <p className="mb-2">Managed daily laboratory operations, ensuring compliance with quality standards and regulatory requirements while supervising technical staff.</p>
                    <ul className="list-disc pl-5 space-y-1 mt-3">
                      <li>Supervised laboratory operations and quality control systems</li>
                      <li>Trained and mentored technical staff in analytical procedures</li>
                      <li>Maintained regulatory compliance and documentation standards</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Expertise */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Skills & Expertise</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Technical Expertise */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Web Development</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>React & TypeScript</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Responsive UI/UX Design</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>API Integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Database Management</span>
                </li>
              </ul>
            </div>
            
            {/* Laboratory Expertise */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Beaker className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Laboratory Management</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Quality Control Systems</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>ISO 17025 Implementation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Method Development</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Technical Training</span>
                </li>
              </ul>
            </div>
            
            {/* Business Skills */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Business Operations</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Inventory Management</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>E-commerce Solutions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Business Process Optimization</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Customer Relationship Management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Education & Certifications */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Education & Certifications</h2>
          
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Education</h3>
              </div>
              <ul className="space-y-4">
                <li>
                  <div className="font-medium text-gray-900 dark:text-white">Bachelor of Science</div>
                  <div className="text-gray-600 dark:text-gray-400">Medical Technology</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">Registered Medical Technologist (RMT)</div>
                </li>
                <li>
                  <div className="font-medium text-gray-900 dark:text-white">Web Development Bootcamp</div>
                  <div className="text-gray-600 dark:text-gray-400">Full-Stack Development</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">Modern JavaScript, React, Node.js</div>
                </li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <Award className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Certifications</h3>
              </div>
              <ul className="space-y-4">
                <li>
                  <div className="font-medium text-gray-900 dark:text-white">ISO 17025 Quality Management</div>
                  <div className="text-gray-600 dark:text-gray-400">Laboratory Quality Systems</div>
                </li>
                <li>
                  <div className="font-medium text-gray-900 dark:text-white">Registered Medical Technologist</div>
                  <div className="text-gray-600 dark:text-gray-400">Professional License</div>
                </li>
                <li>
                  <div className="font-medium text-gray-900 dark:text-white">Web Development Certification</div>
                  <div className="text-gray-600 dark:text-gray-400">Modern Frontend Technologies</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Key Achievements</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 border border-blue-100 dark:border-blue-800">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-1 mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Laboratory Excellence</h3>
                    <p className="text-gray-700 dark:text-gray-300">Successfully implemented ISO 17025 quality management systems, improving operational efficiency by 35% and reducing error rates.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-1 mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Technical Leadership</h3>
                    <p className="text-gray-700 dark:text-gray-300">Led a team of 12 laboratory professionals, developing standardized procedures that improved consistency and reduced training time by 40%.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-1 mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Business Growth</h3>
                    <p className="text-gray-700 dark:text-gray-300">Established and grew E & J Appliances Furniture from startup to profitable operation, implementing custom web solutions for inventory and sales management.</p>
                  </div>
                </li>
                
                <li className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-1 mr-3 mt-1">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Web Development Projects</h3>
                    <p className="text-gray-700 dark:text-gray-300">Developed multiple web applications for small businesses, including e-commerce platforms, inventory management systems, and business analytics dashboards.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* My Approach */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">My Approach</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 text-center">
              I bring a unique perspective to web development, combining scientific precision with practical business experience.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Analytical Problem-Solving</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  My laboratory background instilled a methodical approach to problem-solving. I break down complex challenges into manageable components, test hypotheses, and implement solutions with precision—whether in code or business processes.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Business-Focused Development</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  As a business owner, I understand that technology must serve practical needs. I develop solutions with real-world business requirements in mind, focusing on usability, efficiency, and measurable outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Let's Work Together</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Interested in bringing scientific precision and business acumen to your web development project?
          </p>
          <Link 
            to="/contact" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg inline-block"
          >
            Get in Touch
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}