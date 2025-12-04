import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../common/config/database.config';
import { AuthError, NotFoundError } from '../../common/errors';
import { IUser, IRegisterRequest, ILoginRequest, IAuthResponse } from './auth.types';

class AuthService {
  async register(data: IRegisterRequest): Promise<IAuthResponse> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AuthError('Email already registered');
    }

    // Hash password with 10 rounds
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Extract domain from email for company creation
    const emailDomain = data.email.split('@')[1];
    const companyDomain = `${emailDomain.split('.')[0]}.local`;

    // Create user with a default company if they don't have one
    const user = await prisma.$transaction(async (tx) => {
      // Create or find a default company for this user
      let company = await tx.company.findFirst({
        where: { domain: companyDomain },
      });

      if (!company) {
        company = await tx.company.create({
          data: {
            name: `${data.firstName || 'User'}'s Company`,
            domain: companyDomain,
            isActive: true,
          },
        });
      }

      // Create user with company
      return await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          role: (data.role as IUser['role']) || 'EMPLOYEE',
          companyId: company.id,
        },
      });
    });

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
    });

    // Return token and user (without password)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  async login(email: string, password: string): Promise<IAuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthError('Account is deactivated');
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
    });

    // Return token and user (without password)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  async verifyToken(token: string): Promise<IUser> {
    try {
      // Verify JWT
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
      ) as { id: string; email: string };

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (!user.isActive) {
        throw new AuthError('Account is deactivated');
      }

      // Return user
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
      };
    } catch (error) {
      if (error instanceof AuthError || error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Invalid or expired token');
    }
  }

  private generateToken(user: IUser): string {
    const payload = {
      id: user.id,
      email: user.email,
    };

    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }
}

export const authService = new AuthService();

