import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { validateEmail } from '@/lib/validation';
import { mapAppwriteError, mapGoogleError } from '@/lib/errorMapper';
import { toast } from '@/components/ui/SportixToast';
import { loginWithGoogle, getUserProfile, getCurrentUser } from '@/lib/authService';

export function useLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const submittingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setEmailError('');
    setGeneralError('');
    setNoAccount(false);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setGeneralError('');
    setNoAccount(false);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    try {
      loginWithGoogle();
    } catch (err) {
      const mapped = mapGoogleError(err);
      toast.fromMappedError(mapped);
      setGeneralError(mapped.message);
    }
  }, []);

  const submit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submittingRef.current) return;

    // Client validation first
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setEmailError(emailResult.error || 'Invalid email');
      return;
    }
    if (!password.trim()) {
      setGeneralError('Please enter your password.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setGeneralError('');
    setNoAccount(false);

    try {
      await login(email.trim().toLowerCase(), password);
      toast.success('Welcome back to SPORTiX! ⚡', 'Logged in successfully.');

      const freshUser = await getCurrentUser();
      let freshProfile = null;
      if (freshUser?.id) {
        freshProfile = await getUserProfile(freshUser.id);
      }

      if (freshProfile && freshProfile.is_onboarding_complete) {
        navigate('/app/feed', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }

    } catch (error: any) {
      const raw: string = error?.message || '';
      const isNotFound =
        raw.toLowerCase().includes('user_not_found') ||
        raw.toLowerCase().includes('invalid credentials') ||
        (raw.toLowerCase().includes('not found') &&
         (raw.toLowerCase().includes('user') || raw.toLowerCase().includes('account')));

      if (isNotFound) {
        setNoAccount(true);
      }

      const mapped = mapAppwriteError(error);

      // Session expired: special handling
      if (mapped.code === 'SESSION_EXPIRED') {
        toast.warning(mapped.title, mapped.message);
        navigate('/login');
        return;
      }

      // Show inline error + toast
      setGeneralError(mapped.message);
      toast.fromMappedError(mapped);

    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [email, password, login, navigate]);

  return {
    email,
    password,
    emailError,
    generalError,
    noAccount,
    isSubmitting,
    showPassword,
    handleEmailChange,
    handlePasswordChange,
    toggleShowPassword,
    handleGoogleLogin,
    submit,
  };
}
