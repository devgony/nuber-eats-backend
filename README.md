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

# #5 USER AUTHENTICATION

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

```
nest g mo jwt
nest g s jwt
```
