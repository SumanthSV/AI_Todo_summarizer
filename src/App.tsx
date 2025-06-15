import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { TodoApp } from "./TodoApp";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      <header className="sticky top-0 z-50 glass backdrop-blur-strong h-16 lg:h-20 flex justify-between items-center border-b border-white/20 shadow-medium px-4 lg:px-8">
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center animate-pulse-glow">
            <svg className="w-4 h-4 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg lg:text-2xl font-bold gradient-text-purple text-shadow">
            AI Todo Summarizer
          </h1>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      
      <main className="flex-1">
        <Content />
      </main>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'card-modern border-0 shadow-large',
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }
        }}
      />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 bg-pattern-dots">
        <div className="flex flex-col items-center space-y-6 animate-bounce-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text-purple mb-2">Loading your workspace</h2>
            <p className="text-gray-600 animate-pulse">Preparing your productivity dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <div className="min-h-screen">
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white py-8 lg:py-6 px-4 lg:px-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-pattern-dots"></div>
            </div>
            
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="animate-fade-in-up">
                <h1 className="text-3xl lg:text-5xl font-bold mb-2 lg:mb-4 text-shadow">
                  Welcome back, {loggedInUser?.email?.split('@')[0] || 'friend'}! 👋
                </h1>
                <p className="text-purple-200 text-base lg:text-xl leading-relaxed">
                  Manage your todos and get AI-powered insights about your productivity
                </p>
              </div>
            </div>
          </div>
          <TodoApp />
        </div>
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4 lg:p-6 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 bg-pattern-grid">
          <div className="max-w-md w-full">
            <div className="text-center mb-6 lg:mb-8 animate-fade-in-up">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto mb-4 lg:mb-6 animate-float shadow-glow">
                <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold gradient-text-purple mb-3 lg:mb-4 text-shadow">
                AI Todo Summarizer
              </h1>
              <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
                Get personalized insights about your productivity with AI-powered todo analysis
              </p>
            </div>
            <div className="card-modern p-6 lg:p-8 animate-scale-in delay-300">
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
