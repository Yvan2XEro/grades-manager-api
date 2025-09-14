import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '../../lib/auth-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['admin', 'teacher']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof loginSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'teacher',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        role: data.role.toUpperCase(),
      });

      await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      toast.success('Registration successful!');
      navigate(data.role === 'admin' ? '/admin' : '/teacher');
    } catch (error: any) {
      toast.error(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">Create an Account</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              className="input input-bordered w-full"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-error-600">{errors.firstName.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className="input input-bordered w-full"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-error-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="input input-bordered w-full"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="input input-bordered w-full"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="input input-bordered w-full"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error-600">{errors.confirmPassword.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            {...register('role')}
            className="select select-bordered w-full"
          >
            <option value="teacher">Teacher</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full mt-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;