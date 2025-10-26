import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role } from './enum/role.enum';
import { ROLES_KEY } from './jwt-roles.guard';
import { IS_PUBLIC_KEY } from './jwt-strategy';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../../token-blacklists/token-blacklists.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly usersRepository: UsersService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const isBlacklisted =
      await this.tokenBlacklistService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      const user = await this.usersRepository.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Check roles after authentication (outside try-catch to avoid masking the error)
    const requiredRoles = this.getRequiredRoles(context);

    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(
        (role) => role.toLowerCase() === request.user.role.toLowerCase()
      );

      if (!hasRequiredRole) {
        throw new UnauthorizedException(
          `Access denied. Admin privileges required.`
        );
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private getRequiredRoles(context: ExecutionContext): Role[] {
    return (
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? []
    );
  }
}
