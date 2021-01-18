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

## CongigService

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
- Always interact with DB using repository
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
