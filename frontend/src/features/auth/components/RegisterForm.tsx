import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      // Clear any previous errors
      setError('root', { message: '' });
      const response = await authService.register(data);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        // Backend error response
        if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError('root', {
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Create account
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Get started with ERP Builder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs text-slate-200">
                  First name <span className="font-normal text-slate-500">(optional)</span>
                </Label>
                <Input id="firstName" type="text" placeholder="John" {...register('firstName')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs text-slate-200">
                  Last name <span className="font-normal text-slate-500">(optional)</span>
                </Label>
                <Input id="lastName" type="text" placeholder="Doe" {...register('lastName')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-slate-200">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-slate-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {errors.root && errors.root.message && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
                <p className="text-xs text-red-300 text-center">{errors.root.message}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500"
            >
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex items-center justify-center border-t">
          <p className="text-xs text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

