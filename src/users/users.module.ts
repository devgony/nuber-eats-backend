import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Verification]),
    //  ConfigService, JwtService // we don't need to import global module
  ], // import repository, SECRET_KEY
  providers: [UsersService, UsersResolver],
  exports: [UsersService], // export to the world
})
export class UsersModule {}
