import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  // CanActivate: if it returns true, continue request else stop
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
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
    const user: User = gqlContext['user'];
    if (!user) {
      return false;
    }
    if (roles.includes('Any')) {
      return true;
    }
    // console.log(user);
    //if roles includes defined role, true
    return roles.includes(user.role);
  }
}
