import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getCurrentUser() {
    // Untuk sementara return mock user
    // Nanti bisa diganti dengan actual auth dari JWT
    return this.userService.getMockCurrentUser();
  }
}
