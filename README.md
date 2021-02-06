# Nuber Eats

The Backend of Nuber Eats Clone

## 1. Installation

```
nest g application
> nuber-eats-backend
cmd + P > gitignore > node
npm i @nestjs/graphql graphql-tools graphql apollo-server-express
rm src/app.controller.spec.ts src/app.controller.ts src/app.service.ts
```

```ts
// app.module.ts
@Module({
  imports: [
    GraphQLModule.forRoot({
      // cost first way - auto gen by typescript
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // => create 'schema.sql' file
      autoSchemaFile: true, // => create schema in memory only
    }),
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
```

```
nest g mo restaurants
touch src/restaurants/restaurants.resolver.ts
```

```ts
// src/restaurants/restaurants.resolver.ts
@Resolver()
export class RestaurantsResolver {
  @Query(returns => Boolean) // returns can be anything like () or _, Boolean for graphql
  isPizzaGood(): Boolean {
    // Boolean for typescript
    return true;
  }
}
```

> environment

VSCode extension > Material Icon Theme

```ts
// settings.json:
"material-icon-theme.files.associations": {
"*.module.ts": "nest-module",
"*.service.ts": "nest-service",
"*.controller.ts": "nest-controller",
"*.gateway.ts": "nest-gateway",
"*.decorator.ts": "nest-decorator",
"*.filter.ts": "nest-filter",
"*.guard.ts": "nest-guard",
"*.middleware.ts": "nest-middleware",
"*.pipe.ts": "nest-pipe",
"*.resolver.ts": "nest-resolver"
},
```

Avoid parenthsis of arrow

```ts
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid"
}
```

```
mkdir -p src/restaurants/entities
touch src/restaurants/entities/restaurant.entity.ts
```

```ts
// src/restaurants/entities/restaurant.entity.ts
@ObjectType()
export class Restaurant {
  @Field(is => String)
  name: string;
  @Field(type => Boolean, { nullable: true })
  isGood?: boolean;
}
```

## Arguments of Query

```ts
// restaurants.resolver.ts
Restaurant(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
```

## InputTypes and ArgumentTypes

> ### InputTypes
>
> : should send a object name and properties to graphql

```ts
// graphql playground
mutation {
  createRestaurant(createRestaurantInput: {
    name: "kim-bob heaven",
    isVegan: false,
    address: "seoul",
    ownerName: "henry"
  })
}
```

> ### ArgumentTypes
>
> : Can send each of args to grapql without object name

```ts
// graphql playground
mutation {
  createRestaurant(
    name: "kim-bob heaven",
    isVegan: false,
    address: "seoul",
    ownerName: "henry"
  )
}
```

```
mkdir -p src/restaurants/dtos
touch src/restaurants/dtos/create-restaurant.dto.ts
```

```ts
// create-restaurant.dto.ts
@ArgsType()
export class createRestaurantDto {
  @Field(type => String)
  name: string;
  @Field(type => Boolean)
  isVegan: boolean;
  @Field(type => String)
  address: string;
  @Field(type => String)
  ownerName: string;
}
```

## Validating ArgsTypes

```
npm i class-validator class-transformer
```

```ts
// create-restaurant.dto.ts
@Field(type => String)
  @IsString()
  @Length(5, 10)
  name: string;
  ...
// main.ts
app.useGlobalPipes(new ValidationPipe());
```

> ## Database Configuration

## postgreSQL installation for MacOS

https://postgresapp.com/

- postgres
- postico

```sql
alter user henry with password '<PW>';
```

## TypeORM and PostgreSQL

```
npm install --save @nestjs/typeorm typeorm pg
```

```ts
// app.module.ts
TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'henry',
      password: '', // from local? passsword doesn't matter
      database: 'nuber-eats',
      synchronize: true, // migrate current state to modle
      logging: true,
    }),
```

## ConfigService

: similar with dotenv

```
npm i --save @nestjs/config
npm i cross-env
touch .env.dev .env.prod .env.test
echo .env.dev >> .gitignore
```

```ts
// package.json
"start": "cross-env NODE_ENV=prod nest start",
"start:dev": "cross-env NODE_ENV=dev nest start --watch",

// app.module.ts
envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
ignoreEnvFile: process.env.NODE_ENV === 'prod',
```

> vaildate env with joi

```
npm i joi
```

```ts
// app.module.ts
import * as Joi from 'joi'; // joi need to be import by JS way
...
validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod').required(),
...
```

> ## TYPEORM AND NEST

## Entity

: just add @Entity() and @Column to each column, use it with graphql together

```ts
// restaurant.entity.ts
@ObjectType() // auto gen schema for graphql
@Entity() // for typeORM
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(type => Number)
  id: number;
  @Field(is => String)
  @Column()
...

// app.module.ts
TypeOrmModule.forRoot({
...
    synchronize: process.env.NODE_ENV !== 'prod', // migrate current state to model
    entities: [Restaurant],
...
```

## Data Mapper vs Active Record

> ### Data Mapper: our choice here

- For bigger project
- Always can interact with DB using repository
- NestJS already has this way
- Good for testing

> ### Active Record

- For smaller project
- simple, human friendly

## Inject repository

> ### 1. Module

```ts
// restaurants.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Restaurant])], // Import repository
  providers: [RestaurantsResolver, RestaurantService], // Provide service
})
```

> ### 2. Service

```
touch src/restaurants/restaurants.service.ts
```

```ts
// src/restaurants/restaurants.service.ts
@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}
  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }
```

> ### 3. Resolver

```ts
// restaurants.resolver.ts
...
constructor(private readonly restaurantService: RestaurantService) {} // import service into resolver
@Query(returns => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }
...
```

## Create (insert) restaurant

```ts
// restaurant.service.ts
createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurants.create(createRestaurantDto); // don't need to list all the properties
    return this.restaurants.save(newRestaurant);
  }
...

// restaurant.resolver.ts
@Mutation(returns => Boolean)
  async createRestaurant(
    @Args() createRestaurantDto: CreateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(createRestaurantDto);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
...
```

## Mapped types

: merge dto to entity

:what the hell was code first?

```ts
//restaurants.resolver.ts
@Args('input') createRestaurantDto: CreateRestaurantDto, // for OmitType, go back to InputType
...

// create-restaurants.dto.ts
@InputType() // to use OmitType, we need InputType
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'], // don't need to transfer id
  InputType,
) {} // if Parent and Child type is different, pass 3rd arg
```

or optionally

```ts
// restaurant.entity.ts
@InputType({ isAbstract: true }) // can define more type with abstract, instead of passing 3rd arg of OmitType
```

And use validation at entity

```ts
// restaurant.entity.ts
@Field(is => String)
  @Column()
  @IsString()
  @Length(5, 10)
  name: string;
```

## Add Default attribute to column

```ts
// restaurant.entity.ts
@Field(type => Boolean, { nullable: true }) // for graphql, {nullable: don't send, defaultValue: send the default value}, but both are fine with default db column
@Column({ default: true }) // for db
@IsOptional() // for validator, if value is missing, ignore below validator
```

## Recap

restaurant.entity.ts => create-restaurant.dto => restaurants.service.ts => restaurants.resolver.ts => restaurants.module.ts

## Update Restaurant

```ts
// touch src/restaurants/dtos/update-restaurant.dto.ts
@InputType()
// PartialType for optional args
class UpdateRestaurantDtoInputType extends PartialType(
  CreateRestaurantDto,
) {}

@ArgsType()
export class UpdateRestaurantDto {
  @Field(type => Number)
  id: number;
  @Field(type => UpdateRestaurantDtoInputType)
  data: UpdateRestaurantDtoInputType;
}

// restaurants.resolver.ts
@Mutation(returns => Boolean)
  async updateRestaurant(
    // use merged args with dto
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.updateRestaurant(updateRestaurantDto);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

// restaurant.service.ts
updateRestaurant({ id, data }: UpdateRestaurantDto) {
    return this.restaurants.update(id, { ...data });
  }
```

## Create user Model

> ### User Model:

- id
- createdAt
- updatedAt

- email
- password
- role(client|owner|delivery)

> ### User CRUD:

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

```ts
nest g mo users

// app.module.ts
  // entities: [Restaurant],
  // RestaurantsModule,
  UsersModule,
```

## Create Mutaion

```ts
// touch src/users/dtos/create-account.dto.ts
// PickType: pick specific properties
@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {}

@ObjectType()
export class CreateAccountOuput {
  @Field(type => String, { nullable: true })
  error?: string;
  @Field(type => String)
  ok: boolean;
}

// src/users/users.resolver.ts
@Mutation(returns => CreateAccountOuput)
  createAccount(@Args('input') createAccountInput: CreateAccountInput) {}
```

### Define enum type

```ts
enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' }); // for graphql
```

### createAccount

> ### 1. check user existance

: error handling => return is better than throw (we handle the errors like GO)

```ts
mutation {
  createAccount(input: {
    email: "devgony@gmail.com",
    password: "1234",
		role: Owner
  }) {
    ok,
    error
  }
}
```

: returning object can avoid redundant if clause

```ts
// /Users/henry/Node/nuber-eats-backend/src/users/users.service.ts
return { ok: false, error: 'There is a user with that email already' };
```

> ### 2. create user

> ### 3. hash password

listener: like trigger on specific entity

- @BeforeInsert()

npm i bcrypt
npm i @types/bcrypt --dev-only

```ts
// /Users/henry/Node/nuber-eats-backend/src/users/entities/user.entity.ts
@BeforeInsert()
  async hashPassword(): Promise<void> {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(); // for the case of "Couldn't create account"
    }
  }
```

## Login User

### 0. reuse and rename common dto

move mutation

```ts
// from
src/users/dtos/create-account.dto.ts CreateAccountOutput()
// to
src/common/dtos/output.dto.ts MutationOutput()
```

And create LoginOuput

```ts
// login.dto.ts
@InputType()
export class LoginInput extends PickType(User, ['email', 'password']) {}

@ObjectType()
export class LoginOuput extends MutationOutput {
  // just to rename
  @Field(type => String, { nullable: true })
  token?: string;
}
```

### 1. find user with email

### 2. check if the pw is correct and return token

- define checkPassword() at `src/users/entities/user.entity.ts` so that we can use whenever! calling by User.checkPassword

```ts
// src/users/entities/user.entity.ts
async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const ok = await bcrypt.compare(aPassword, this.password);
      return ok;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
```

### 3. make a JWT and give ti to user

## 5 USER AUTHENTICATION

- not use passport but do manually
- learn how to create custom module.forRoot

> ### dependency injection

```ts
npm i jsonwebtoken
npm i @types/jsonwebtoken --only-dev

// app.module.ts
SECRET_KEY: Joi.string().required(),
```

> https://randomkeygen.com/

```ts
// users.module.ts
imports: [TypeOrmModule.forFeature([User]), ConfigService], // import repository, SECRET_KEY

// user.service.ts
constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}
...
const token = jwt.sign({ id: user.id }, this.config.get('SECRET_KET'));
```

## create jwt module

> ### purpose of jwt

- check if token is modified or not
- not for encrypting secret
- everybody can see, don't put password

1. create dynamic module(with explicit config)
2. apply config option
3. convert to static module

```ts
nest g mo jwt
nest g s jwt

// jwt.module.ts
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

// app.module.ts
    JwtModule.forRoot(),

// users.module.ts
// ConfigService, JwtService // we don't need to import global module => comment out


```

### interface => options

```ts
// touch src/jwt/jwt.interfaces.ts
export interface JwtModuleOptions {
  privateKey: string;
}
```

### constants => CONFIG_OPTIONS

```ts
// touch src/jwt/jwt.constants.ts
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
```

`[JwtService]` = shortcut of `{provide: JwtService, useClass: JwtService}`

```ts
// src/jwt/jwt.module.ts
static forRoot(options: JwtModuleOptions): DynamicModule {
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
```

```ts
// src/jwt/jwt.service.ts
constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions, // we can inject whatever
  ) {}
  sign(userId: number): string {
    return jwt.sign({ id: userId }, this.options.privateKey);
  }

// src/users/users.service.ts
...
    // private readonly config: ConfigService, // don't need anymore
...
      const token = this.jwtService.sign(user.id);
```

### Can use module and forRoot options like ConfigModule

```ts
// src/app.module.ts
JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
```

## Middleware

### To install middleware

create middleware

```ts
// src/jwt/jwt.middleware.ts
//// Class version
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(req.headers);
    next();
  }
}
//// function version
export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(req.headers);
  next();
}
```

install middleware (to specific route)

```ts
// src/app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(jwtMiddleware).forRoutes({
      path: '/graphql', // apply for all router: '*'
      method: RequestMethod.POST, // RequestMethod.ALL
    });
  }
}
```

or globally

```ts
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // app.use(jwtMiddleware); // global install but works with funtional only
  await app.listen(3000);
}
```

> implement vs extents?

## JWT Middleware

- To inject UsersService (repository), use Class middleware and install at `app.module.ts` not `main.ts`
- To inject UsersService, export it at `users.module.ts`

```ts
  exports: [UsersService], // export to the world
```

- Create verify function at `jwt.service.ts`

```ts
// jwt.service.ts
verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
```

- Create findById at `users.service.ts`

```ts
async findById(id: number): Promise<User> {
    return this.users.findOne({ id });
  }
```

- Middleware to match proper jwt

```ts
@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      const token = req.headers['x-jwt'];
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        try {
          const user = await this.userService.findById(decoded['id']);
          console.log(user);
          req['user'] = user;
        } catch (e) {}
      }
    }
    next();
  }
}
```

## GraphQL Context

Anything you put in context will show up at all resolvers

```ts
//src/app.module.ts
context: ({ req }) => ({ user: req['user'] }),

//src/users/users.resolver.ts
me(@Context() context) {
    if (!context.user) {
      return;
    } else {
      return context.user;
    }
  }
```

> ## gql playground polling setup

`"schema.polling.enable": false,`

## AuthGuard

> ### CanActivate: if it returns true, continue request else stop

```
nest g mo auth
```

CommonModule comment out?
useguard up to each roles => later with metadata

```ts
// src/auth/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  // CanActivate: if it returns true, continue request else stop
  canActivate(context: ExecutionContext) {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    if (!user) {
      return false;
    }
    console.log(user);
    return true;
  }
}
```

## AuthUser (own) decorator

to get the required user

```ts
export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext['user'];
    return user; // whatever it returns, it will be sent to authguard
  },
);
```

## Auth recap

- Send token at header
- Create middleware to use http
- middleware take header and verify jwt
- if there is id, find the user and attach to req
- Send info to all resolver by Apollo context
- User resolver has authguard to implement

## User profile mutation

what was the purpose of dto?

1. better code experience
2. type validator(real time)

- Rename from MutationOutput to CoreOutput
- create `UserProfileInput` and `UserProfileOutput`
- CoreOutput => UserProfileOutput => users.resolver.ts (handle error)

what was diff between InputType, ObjectType?

- editProfile(EditProfileInput): EditProfileOutput {}
- use inputDto and defactoring to avoid not null errror
- pw hashing => @BeforeUpdate() but..
- use save instead of update
  - update or if entities don't exist, insert
  - but.. what about inputDto?
- need to fix when send email only

## Verification

### touch src/users/entities/verification.entity.ts

- verification <> user is 1 : 1
- select user from verification? => add `@JoinColumn()` to verification

```ts
// touch src/users/entities/verification.entity.ts
  @OneToOne(type => User)
  @JoinColumn()
  user: User;
```

### add verification to entities at `src/app.module.ts`

### add verified column to `src/users/entities/user.entity.ts`

### import Verification at users.module.ts

### Random verifing code

Get simple and quick random code without installation

```ts
Math.random().toString(36).substring(2);
```

Otherwise, use "uuid"

```ts
// src/users/entities/verification.entity.ts
@BeforeInsert()
  createCode(): void {
    this.code = uuidv4();
  }
```

### inject repository to `src/users/users.service.ts`

- create account => save user to verification
- edit profile = > save user to verification

```ts
await this.verifications.save(this.verifications.create({ user }));
```

### verification is so small not enough to make new service => merge into user service

### Verify!

- findOne => default: no relation
- { loadRelationIds: true } => get userID only
- { relations: ['user'] } => get all columns of user

### hash error handling

1. just don't fetch as default {select: false} at `src/users/entities/user.entity.ts`
2. hash only if password exists

- To delete row on parent key => { onDelete: 'CASCADE' }) at `src/users/entities/verification.entity.ts`
- if need, specify the column to fetch => { select: ['id', 'password'] }, at login of `src/users/entities/verification.entity.ts`

### Cleaning

- browser automatically await
- Resolver just get inputDto and send to Service
- Service do all the logics
- GQL Resolver, function Resolver, Service wil have same output "Dto"

- additional edit

```ts
// jwt.middleware.ts
const { user } = await this.userService.findById(decoded['id']);
```

- need to be fixed => editProfile send duplicated userId

## Verification

### Delete verification

### Sign in mailgun

https://app.mailgun.com/

### Optionally we can use nestJS-mailer

https://nest-modules.github.io/mailer/docs/mailer.html

### Create mail module manually

```
nest g mo mail
```

### GOT

```ts
npm i got
Buffer.from('api:YOUR_API_KEY').toString('base64')
> YXBpOllPVVJfQVBJX0tFWQ==
npm i form-data

// touch src/mail/mail.service.ts
sendEmail(username, template, code, emailVars) => FormData() => got() => mailgun => my mail
```

## TEST

```ts
touch users.service.spec.ts
npm run test:watch
npm run test:cov
```

## Fix dir

```ts
"moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1"
    },
```

### should be defined

=> To do isolated 'unit test' do mock

### createAccount

1. whatever created account it is, if email already exists, get error
2. mock repository with generics

```ts
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
```

### ignore coverage

````ts
// add to package.json
"coveragePathIgnorePatterns": [
      "node_modules",
      ".entity.ts",
      ".constants.ts"
    ]
    ```

// remove from package.json
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
````

### match returned value

```ts
expect(result).toMatchObject({
  ok: false,
  error: 'There is a user with that email already',
});
```

### duplicated mockRepository

=> change from object to function

### expect times, args

```ts
expect().toHaveBeenCalledTimes(1);
expect().toHaveBeenCalledWith(createAccountArgs);
```

### Verification

```ts
let verificationRepository: MockRepository<Verification>;
verificationRepository = module.get(getRepositoryToken(Verification));
```

### mailService

### last result

BeforAll => BeforEach

BeforEach: unit test

BeforeAll: e2e test

### mock specific property of object

```ts
       checkPassword: jest.fn(() => Promise.resolve(true)),
```

## JWT Service Test

### How to mock external library

should test out of dependency => mock package

```ts
// jwt.service.spec.ts
const module = await Test.createTestingModule({
  providers: [
    JwtService,
    {
      provide: CONFIG_OPTIONS,
      useValue: { privateKey: TEST_KEY },
    },
  ],
}).compile();
```

## Mail Service Test

### spyOn function

Error: received value must be a mock or spy function

=> To use(test) it later, do spy function not mock

it runs both origin function and intercepted one by spy function

```ts
jest.spyOn(service, 'sendEmail').mockImplementation(async () => {});
```

package that doesn't use function 'got', 'form-data' => just mock the package not function and use spyOn

### html unit cov page

coverage/lcov-report/index.html

## E2E Test

```ts
// /Users/henry/Node/nuber-eats-backend/test/jest-e2e.json
"moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  },

// cp .env.dev .env.test but ,
DB_NAME=nuber-eats-test

// app.module.ts
validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
...
logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
```

- Create database nuber-eats-test
- after all the test, drop DB and close test
- set decent order of tests

```ts
// users.e2e-spec.ts
const GRAPHQL_ENDPOINT = '/graphql';

// package.json
 "test:e2e": "jest --config ./test/jest-e2e.json --detectOpenHandles"
//=> got the problem: got
// rollback
"test:e2e": "jest --config ./test/jest-e2e.json

// add mock
jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});
```

### toBe(Exactly match) Vs toEqual(any types)

### get token at the top (after login test)

## user null from jwt.middleware.ts? => already fixed above

### users entity

@Column({ unique: true })

> # => challenge to handle unique error

One to One verification problem => delete verification before edit

Jest review

```ts
describe('parent', () => {
  beforeAll()
  describe('child', () => {
    beforeAll()
    it('should ~', () => {})
  })
}
```

## Restaurant

### User entity add validation

### modify restaurant.entity.ts

- remove id, extends coreEntity
- add
  - name
  - category
    - one to many(target, inverse ref)
  - address
  - coverImage

### init

- add to entity again
- delete test table

### relationship

- cascade

Error: Schema must contain uniquely named types but contains multiple types named "Category".

- It has inputType and objectType => set the name

`@InputType('CategoryInputType', { isAbstract: true })`

### create restaurant gets the authUser

### Slug? : for standard name

### use category repository => import the module forRoot

defects

1. no secutiry

- check owner role

### Role based auth

### Set metadata

### use guard every where

auth.module.ts => import APP_GUARD

role.decorator.ts (SetMetaData) => send metadata from each service => auth.guard.ts (undefined => true, Any => true, UserRole => ture)
