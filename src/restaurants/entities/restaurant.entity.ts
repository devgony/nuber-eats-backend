import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Category } from './category.entity';

@InputType('RestaurantInputType', { isAbstract: true }) // can define more type with abstract, instead of passing 3rd arg of OmitType
@ObjectType() // auto gen schema for graphql
@Entity() // for typeORM
export class Restaurant extends CoreEntity {
  @Field(is => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(type => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(type => String, { defaultValue: 'Gang-nam' })
  @Column()
  @IsString()
  address: string;

  @Field(type => Category, { nullable: true }) // allow none category
  @ManyToOne(type => Category, category => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category;

  @Field(type => User) // all restaurant should have owner
  @ManyToOne(type => User, user => user.restaurants, {
    onDelete: 'CASCADE',
  })
  owner: User;

  // @Field(type => Boolean, { nullable: true }) // for graphql, {nullable: don't send, defaultValue: send the default value}, but both are fine with default db column
  // @Column({ default: true }) // for db
  // @IsOptional() // for validator, if value is missing, ignore below validator
  // @IsBoolean()
  // isVegan: boolean;
}
