import { useState } from 'react';
import { useAuth } from '@lib/context/auth-context';
import { Button } from '@components/ui/button';
import { CustomIcon } from '@components/ui/custom-icon';

type EmailAuthModalProps = {
  onClose: () => void;
};

type Mode = 'signup' | 'signin';

export function EmailAuthModal({ onClose }: EmailAuthModalProps): JSX.Element {
  const { signUpWithEmail, signInWithEmail } = useAuth();

  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError.code ?? '';

      if (code === 'auth/email-already-in-use')
        setError('An account with this email already exists.');
      else if (code === 'auth/invalid-email')
        setError('Please enter a valid email address.');
      else if (code === 'auth/weak-password')
        setError('Password must be at least 6 characters.');
      else if (code === 'auth/user-not-found' || code === 'auth/wrong-password')
        setError('Invalid email or password.');
      else if (code === 'auth/invalid-credential')
        setError('Invalid email or password.');
      else
        setError(firebaseError.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-dark-primary'>
        <button
          className='absolute right-4 top-4 rounded-full p-1 text-light-secondary transition hover:bg-light-primary/10
                     dark:text-dark-secondary dark:hover:bg-dark-secondary/10'
          onClick={onClose}
          aria-label='Close'
        >
          <CustomIcon iconName='CloseIcon' className='h-5 w-5' />
        </button>

        <div className='mb-6 flex justify-center'>
          <CustomIcon
            className='h-8 w-8 text-accent-blue'
            iconName='TwitterIcon'
          />
        </div>

        <h2 className='mb-6 text-center text-2xl font-bold text-light-primary dark:text-dark-primary'>
          {isSignUp ? 'Create your account' : 'Sign in to Twitter'}
        </h2>

        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          {isSignUp && (
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='name'
                className='text-sm font-semibold text-light-secondary dark:text-dark-secondary'
              >
                Name
              </label>
              <input
                id='name'
                type='text'
                required
                autoComplete='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
                className='rounded-md border border-light-border bg-transparent px-3 py-2 text-light-primary outline-none
                           transition focus:border-accent-blue dark:border-dark-border dark:text-dark-primary'
              />
            </div>
          )}

          <div className='flex flex-col gap-1'>
            <label
              htmlFor='email'
              className='text-sm font-semibold text-light-secondary dark:text-dark-secondary'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              required
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className='rounded-md border border-light-border bg-transparent px-3 py-2 text-light-primary outline-none
                         transition focus:border-accent-blue dark:border-dark-border dark:text-dark-primary'
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label
              htmlFor='password'
              className='text-sm font-semibold text-light-secondary dark:text-dark-secondary'
            >
              Password
            </label>
            <input
              id='password'
              type='password'
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              className='rounded-md border border-light-border bg-transparent px-3 py-2 text-light-primary outline-none
                         transition focus:border-accent-blue dark:border-dark-border dark:text-dark-primary'
            />
          </div>

          {error && (
            <p className='rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400'>
              {error}
            </p>
          )}

          <Button
            type='submit'
            disabled={loading}
            className='mt-2 w-full justify-center bg-light-primary py-2 font-bold text-white transition
                       hover:bg-light-primary/90 disabled:cursor-not-allowed disabled:opacity-60
                       dark:bg-dark-primary dark:text-light-primary dark:hover:bg-dark-primary/80'
          >
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
              ? 'Sign up'
              : 'Sign in'}
          </Button>
        </form>

        <p className='mt-6 text-center text-sm text-light-secondary dark:text-dark-secondary'>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type='button'
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup');
              setError(null);
            }}
            className='font-semibold text-accent-blue hover:underline'
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
