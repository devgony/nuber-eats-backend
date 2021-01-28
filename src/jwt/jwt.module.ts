import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

@Module({
  // providers: [JwtService]
})
@Global() // don't need to import manually
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    // dynamic: a module returning another module
    return {
      module: JwtModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        JwtService,
      ],
      exports: [JwtService],
    };
  }
}
