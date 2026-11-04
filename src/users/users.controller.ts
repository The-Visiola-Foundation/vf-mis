import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@Public()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

}
