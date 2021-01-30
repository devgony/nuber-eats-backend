import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOuput,
} from 'src/users/dtos/create-account.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput, LoginOuput } from './dtos/login.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(of => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}
  // @Query(returns => Boolean)
  // hi() {
  //   return true;
  // }

  @Mutation(returns => CreateAccountOuput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOuput> {
    return this.usersService.createAccount(createAccountInput);
    //   try {
    //   return this.usersService.createAccount(createAccountInput);
    // } catch (e) {
    //   return {
    //     ok: false,
    //     error: e,
    //   };
    // }
  }

  @Mutation(returns => LoginOuput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOuput> {
    return this.usersService.login(loginInput);
    // try {
    //   return this.usersService.login(loginInput);
    // } catch (error) {
    //   return { ok: false, error };
    // }
  }

  @Query(returns => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User) {
    // own decorator to get current login user
    return authUser;
  }

  @UseGuards(AuthGuard)
  @Query(returns => UserProfileOutput)
  async userProfile(
    @Args() userProfileInput: UserProfileInput,
  ): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.userId);
    // try {
    //   const user = await this.usersService.findById(userProfileInput.userId);
    //   if (!user) {
    //     throw Error();
    //   }
    //   return {
    //     ok: true,
    //     user,
    //   };
    // } catch (e) {
    //   return {
    //     error: 'User Not Found',
    //     ok: false,
    //   };
    // }
  }

  @UseGuards(AuthGuard)
  @Mutation(returns => EditProfileOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editProfileInput: EditProfileInput,
  ): Promise<EditProfileOutput> {
    return this.usersService.editProfile(authUser.id, editProfileInput);
    // try {
    //   await this.usersService.editProfile(authUser.id, editProfileInput);
    //   return {
    //     ok: true,
    //   };
    // } catch (error) {
    //   return {
    //     ok: false,
    //     error,
    //   };
    // }
  }

  @Mutation(returns => VerifyEmailOutput)
  verifyEmail(
    @Args('input') { code }: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(code);
    // try {
    //   await this.usersService.verifyEmail(code);
    //   return {
    //     ok: true,
    //   };
    // } catch (error) {
    //   return {
    //     ok: false,
    //     error,
    //   };
    // }
  }
}
