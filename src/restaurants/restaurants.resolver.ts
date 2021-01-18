import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { argsToArgsConfig } from 'graphql/type/definition';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

@Resolver(of => Restaurant) // of is not mendatory
export class RestaurantsResolver {
  constructor(private readonly restaurantService: RestaurantService) {} // import service into resolver
  @Query(returns => Boolean) // returns can be anything like () or _, Boolean for graphql
  isPizzaGood(): Boolean {
    // Boolean for typescript
    return true;
  }
  @Query(returns => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }
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
}
