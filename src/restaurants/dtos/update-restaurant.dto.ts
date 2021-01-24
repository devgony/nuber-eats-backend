import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

@InputType()
// PartialType for optional args
class UpdateRestaurantDtoInputType extends PartialType(CreateRestaurantDto) {}

// @ArgsType()
@InputType()
export class UpdateRestaurantDto {
  @Field(type => Number)
  id: number;
  @Field(type => UpdateRestaurantDtoInputType)
  data: UpdateRestaurantDtoInputType;
}
