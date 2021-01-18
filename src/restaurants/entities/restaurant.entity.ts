import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType() // auto gen schema for graphql
@Entity() // for typeORM
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(type => Number)
  id: number;
  @Field(is => String)
  @Column()
  name: string;
  @Field(type => Boolean)
  @Column()
  isVegan: boolean;
  @Field(type => String)
  @Column()
  address: string;
  @Field(type => String)
  @Column()
  ownerName: string;
  @Field(type => String)
  @Column()
  categoryName: string;
}
