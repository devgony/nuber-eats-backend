import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';

@Module({
  // providers: [JwtService]
})
@Global() // don't need to import manually
export class JwtModule {
  static forRoot(): DynamicModule {
    // dynamic: a module returning another module
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [JwtService],
    };
  }
}
