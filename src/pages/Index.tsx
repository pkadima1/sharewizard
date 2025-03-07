import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
const Index = () => {
  return <div className="min-h-screen bg-gray-50 py-[100px]">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 py-16 max-w-6xl">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
            Welcome to EngagePerfect
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
            Generate Perfect Social Media Content
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Create engaging social media posts with AI and share them directly on Twitter, LinkedIn, Facebook, and other platforms.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/dashboard" className="px-8 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors">
              Get Started
            </Link>
            
            <Link to="/profile" className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View Profile
            </Link>
          </div>
        </div>
        
        <div className="mt-20 p-8 bg-white rounded-2xl shadow-subtle text-center animate-fade-in">
          <h2 className="text-2xl font-semibold mb-4">
            Your Social Media Assistant
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            EngagePerfect helps you create compelling content for your social media profiles. 
            With AI-powered caption generation, you can craft the perfect message for any platform.
          </p>
        </div>
      </main>
    </div>;
};
export default Index;