import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: User, done: Function) {
    done(null, user);
  }

  async deserializeUser(payload: User, done: Function) {
    const user = await this.authService.findUser(payload.id);
    return user ? done(null, user) : done(null, null);
  }
}
