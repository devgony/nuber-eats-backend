import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/ouput.dto';
import { User } from 'src/users/entities/user.entity';

// PickType: pick specific properties
@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
]) {}

@ObjectType()
export class CreateAccountOuput extends CoreOutput {} // reuse and just to rename
