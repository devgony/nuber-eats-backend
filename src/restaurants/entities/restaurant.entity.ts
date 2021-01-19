import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// @InputType({ isAbstract: true }) // can define more type with abstract, instead of passing 3rd arg of OmitType
@ObjectType() // auto gen schema for graphql
@Entity() // for typeORM
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(type => Number)
  id: number;
  @Field(is => String)
  @Column()
  @IsString()
  @Length(5, 10)
  name: string;

  @Field(type => Boolean, { nullable: true }) // for graphql, {nullable: don't send, defaultValue: send the default value}, but both are fine with default db column
  @Column({ default: true }) // for db
  @IsOptional() // for validator, if value is missing, ignore below validator
  @IsBoolean()
  isVegan: boolean;

  @Field(type => String, { defaultValue: 'Gang-nam' })
  @Column()
  @IsString()
  address: string;

  @Field(type => String)
  @Column()
  @IsString()
  ownerName: string;

  @Field(type => String)
  @Column()
  @IsString()
  categoryName: string;
}
