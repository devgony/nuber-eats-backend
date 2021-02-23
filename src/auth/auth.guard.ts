import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  // CanActivate: if it returns true, continue request else stop
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    // console.log(roles);
    if (!roles) {
      // !role means public service
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext(); // turn it from http to graphql context
    const token = gqlContext.token;
    // console.log(token);
    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.userService.findById(decoded['id']);
        if (!user) {
          return false;
        }
        gqlContext['user'] = user; // ???
        if (roles.includes('Any')) {
          return true;
        }
        // console.log(user);
        //if roles includes defined role, true
        return roles.includes(user.role);
      }
    } else {
      return false;
    }
  }
}
