'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import {
  ArrowLeft,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import {
  Language,
  getSavedLanguage,
  getTranslation,
  isRTL
} from '@/lib/i18n';

type Mode = 'login' | 'register' | 'forgot';

export default function OwnerAuthPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  // Language
  const [language, setLanguage] = useState<Language>('en');
  const t = getTranslation(language);
  const rtl = isRTL(language);

  // State
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getSavedLanguage();
    if (saved) setLanguage(saved);
  }, []);

  // Giriş yap
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Supabase Auth ile giriş
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError(t.errors.unknownError);
        setIsLoading(false);
        return;
      }

      // Staff tablosundan owner bilgisini al
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, role, venue_id')
        .eq('email', email)
        .eq('is_owner', true)
        .eq('is_active', true)
        .single();

      if (staffError || !staffData) {
        // Owner değilse, auth'dan çıkış yap
        await supabase.auth.signOut();
        setError('Bu e-posta ile kayıtlı işletme sahibi bulunamadı');
        setIsLoading(false);
        return;
      }

      // Auth store'a kaydet
      login({
        id: staffData.id,
        name: staffData.full_name,
        role: 'owner',
        venue_id: staffData.venue_id
      });

      // Dashboard'a yönlendir
      router.push('/dashboard');
    } catch (err) {
      setError(t.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  // Kayıt ol
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasyon
    if (password !== confirmPassword) {
      setError(t.errors.passwordMatch);
      return;
    }

    if (password.length < 6) {
      setError(t.errors.passwordMin);
      return;
    }

    setIsLoading(true);

    try {
      // Supabase Auth ile kayıt
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      // Onboarding'e yönlendir (işletme bilgileri için)
      setSuccess('Kayıt başarılı! Yönlendiriliyorsunuz...');
      
      // Kısa bir bekleme sonrası onboarding'e git
      setTimeout(() => {
        router.push('/onboarding?mode=new');
      }, 1500);

    } catch (err) {
      setError(t.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  // Şifremi unuttum
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Şifre sıfırlama linki e-posta adresinize gönderildi');
      }
    } catch (err) {
      setError(t.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' && t.owner.loginTitle}
            {mode === 'register' && t.owner.registerTitle}
            {mode === 'forgot' && t.owner.forgotPassword}
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          {/* Back Button */}
          <button type="button"
            onClick={() => mode === 'login' ? router.push('/') : setMode('login')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${rtl ? 'rotate-180' : ''}`} />
            <span className="text-sm">{t.common.back}</span>
          </button>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-green-400 mb-4 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 mb-4 p-3 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.owner.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.owner.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <button type="button"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button type="button"
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-sm text-orange-500 hover:text-orange-400"
                >
                  {t.owner.forgotPassword}
                </button>
              </div>

              {/* Submit Button */}
              <button type="button"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.owner.loginButton
                )}
              </button>

              {/* Register Link */}
              <p className="text-center text-gray-400 mt-4">
                {t.owner.noAccount}{' '}
                <button type="button"
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                  className="text-orange-500 hover:text-orange-400 font-medium"
                >
                  {t.owner.registerButton}
                </button>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.owner.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.owner.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    minLength={6}
                    required
                  />
                  <button type="button"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.owner.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button type="button"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.owner.registerButton
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-gray-400 mt-4">
                {t.owner.hasAccount}{' '}
                <button type="button"
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="text-orange-500 hover:text-orange-400 font-medium"
                >
                  {t.owner.loginButton}
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">
                E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz.
              </p>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t.owner.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button type="button"
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.common.submit
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}