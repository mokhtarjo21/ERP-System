import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Zap } from 'lucide-react';
import { generateDemoData } from '../lib/demoData';
import { ar } from '../lib/ar';

export function AuthPage() {
  const { signUp, signIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('Demo1234!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await signIn(email, password);
          await generateDemoData();
        } catch (demoErr) {
          console.log('Demo data generation optional');
        }
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ar.messages.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 rtl" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-right">{ar.auth.title}</h1>
        <p className="text-gray-600 mb-8 text-right">{ar.auth.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">{ar.auth.email}</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="demo@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">{ar.auth.password}</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm text-right">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? ar.auth.loading : (isSignUp ? ar.auth.signUp : ar.auth.signIn)}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          {isSignUp ? ar.auth.haveAccount : ar.auth.noAccount}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:underline font-medium"
          >
            {isSignUp ? ar.auth.signIn : ar.auth.signUp}
          </button>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">{ar.auth.demoCredentials}</p>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
            <p className="text-gray-700 text-right"><span className="font-medium">{ar.auth.email}:</span> demo@example.com</p>
            <p className="text-gray-700 text-right"><span className="font-medium">{ar.auth.password}:</span> Demo1234!</p>
            <p className="text-gray-600 mt-2 flex items-center gap-1 justify-end">
              <span>{ar.auth.autoLoadData}</span>
              <Zap className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
