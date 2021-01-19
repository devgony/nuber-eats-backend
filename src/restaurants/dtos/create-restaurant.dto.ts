import { ArgsType, Field, InputType, OmitType } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';
import { Restaurant } from '../entities/restaurant.entity';

// @ArgsType()
@InputType() // to use OmitType, we need InputType
export class CreateRestaurantDto extends OmitType(
  Restaurant,
  ['id'], // don't need to transfer id
  InputType,
) {} // if Parent and Child type is different, pass 3rd arg

// {
//   @Field(type => String)
//   @IsString()
//   @Length(5, 10)
//   name: string;
//   @Field(type => Boolean)
//   @IsBoolean()
//   isVegan: boolean;
//   @Field(type => String)
//   @IsString()
//   address: string;
//   @Field(type => String)
//   @IsString()
//   ownerName: string;
//   @Field(type => String)
//   @IsString()
//   categoryName: string;
// }
