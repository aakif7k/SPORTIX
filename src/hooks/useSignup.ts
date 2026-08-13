import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  validateFullName, validateUsername, validateEmail,
  validatePassword, validateConfirmPassword,
} from '@/lib/validation';
import type { PasswordStrength } from '@/lib/validation';
import { checkUsernameAvailability } from '@/lib/asyncValidators';
import type { AsyncValidationState } from '@/lib/asyncValidators';
import { mapAppwriteError } from '@/lib/errorMapper';
import { toast } from '@/components/ui/SportixToast';
import { createNotification } from '@/lib/notifications/notificationService';

export interface SignupFormState {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  sport: string;
  sports: string[];
  experienceLevel: string;
  location: string;
  city: string;
}

export interface SignupErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function useSignup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [form, setForm] = useState<SignupFormState>({
    fullName: '', username: '', email: '',
    password: '', confirmPassword: '',
    role: 'athlete', sport: 'Multi-Sport', sports: [],
    experienceLevel: 'beginner', location: '', city: '',
  });

  const [errors, setErrors] = useState<SignupErrors>({});
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [usernameState, setUsernameState] = useState<AsyncValidationState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Prevent duplicate submissions
  const submittingRef = useRef(false);

  const validateField = useCallback((
    field: string,
    value: unknown,
    currentPassword?: string
  ) => {
    const v = String(value || '');

    switch (field) {
      case 'fullName': {
        const res = validateFullName(v);
        setErrors(prev => ({
          ...prev,
          fullName: res.valid ? undefined : res.error
        }));
        break;
      }
      case 'username': {
        const res = validateUsername(v);
        setErrors(prev => ({
          ...prev,
          username: res.valid ? undefined : res.error
        }));
        break;
      }
      case 'email': {
        const res = validateEmail(v);
        setErrors(prev => ({
          ...prev,
          email: res.valid ? undefined : res.error
        }));
        break;
      }
      case 'password': {
        const { result: pwResult } = validatePassword(v);
        setErrors(prev => ({
          ...prev,
          password: pwResult.valid ? undefined : pwResult.error
        }));
        break;
      }
      case 'confirmPassword': {
        const res = validateConfirmPassword(currentPassword || form.password, v);
        setErrors(prev => ({
          ...prev,
          confirmPassword: res.valid ? undefined : res.error
        }));
        break;
      }
    }
  }, [form.password]);

  const updateField = useCallback(<K extends keyof SignupFormState>(
    field: K,
    value: SignupFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Live validation for changed field
    if (submitAttempted || field === 'username'
        || field === 'password' || field === 'confirmPassword') {
      validateField(field, value, field === 'password' ? (value as string) : form.password);
    }

    // Username: debounced async check
    if (field === 'username' && typeof value === 'string') {
      const val = value as string;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      const localResult = validateUsername(val);

      if (!localResult.valid || val.length < 3) {
        setUsernameState('idle');
        return;
      }

      setUsernameState('checking');
      debounceTimer.current = setTimeout(async () => {
        const { state } = await checkUsernameAvailability(val);
        setUsernameState(state);
        if (state === 'taken') {
          setErrors(prev => ({
            ...prev,
            username: 'Username already taken. Try another.',
          }));
        } else if (state === 'available') {
          setErrors(prev => ({ ...prev, username: undefined }));
        }
      }, 400); // 400ms debounce
    }

    // Password strength
    if (field === 'password' && typeof value === 'string') {
      const { strength } = validatePassword(value as string);
      setPasswordStrength(strength);
      // Also revalidate confirm password
      if (form.confirmPassword) {
        const confirmResult = validateConfirmPassword(
          value as string, form.confirmPassword
        );
        setErrors(prev => ({
          ...prev,
          confirmPassword: confirmResult.valid
            ? undefined : confirmResult.error,
        }));
      }
    }
  }, [form, submitAttempted, validateField]);

  const validateAll = useCallback((): boolean => {
    const newErrors: SignupErrors = {};

    const fullNameResult = validateFullName(form.fullName);
    if (!fullNameResult.valid) newErrors.fullName = fullNameResult.error;

    const usernameResult = validateUsername(form.username);
    if (!usernameResult.valid) newErrors.username = usernameResult.error;

    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) newErrors.email = emailResult.error;

    const { result: pwResult } = validatePassword(form.password);
    if (!pwResult.valid) newErrors.password = pwResult.error;

    const confirmResult = validateConfirmPassword(
      form.password, form.confirmPassword
    );
    if (!confirmResult.valid)
      newErrors.confirmPassword = confirmResult.error;

    if (usernameState === 'taken') {
      newErrors.username = 'Username already taken. Try another.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0
      && usernameState !== 'taken'
      && usernameState !== 'checking';
  }, [form, usernameState]);

  const isFormValid = useCallback((): boolean => {
    return (
      validateFullName(form.fullName).valid &&
      validateUsername(form.username).valid &&
      validateEmail(form.email).valid &&
      validatePassword(form.password).result.valid &&
      validateConfirmPassword(form.password, form.confirmPassword).valid &&
      usernameState === 'available' &&
      !isSubmitting
    );
  }, [form, usernameState, isSubmitting]);

  const submit = useCallback(async () => {
    // Prevent double submission
    if (submittingRef.current) return;

    setSubmitAttempted(true);
    const valid = validateAll();
    if (!valid) {
      toast.error(
        'Please fix the errors',
        'Check the highlighted fields below.'
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        role: form.role,
        sport: form.sport,
        sports: form.sports,
        experienceLevel: form.experienceLevel,
        location: form.location,
        city: form.city,
      });

      // Success notification
      toast.success(
        'Welcome to SPORTiX! ⚡',
        "Your account is ready. Let's go."
      );

      // Create welcome notification in Appwrite DB
      const currentUid = localStorage.getItem('sportix_uid');
      if (currentUid) {
        createNotification({
          type: 'welcome',
          title: 'Welcome to SPORTiX!',
          message: 'Your athlete profile is created. Explore events, squads, and the feed.',
          recipientId: currentUid,
        });
      }

      navigate('/onboarding');

    } catch (error) {
      const mapped = mapAppwriteError(error);

      // Email already exists: show inline + toast
      if (mapped.field === 'email') {
        setErrors(prev => ({
          ...prev,
          email: mapped.message,
        }));
      }

      toast.fromMappedError(mapped);

    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }, [form, validateAll, register, navigate]);

  return {
    form, errors, passwordStrength, usernameState,
    isSubmitting, updateField, submit, isFormValid,
  };
}
