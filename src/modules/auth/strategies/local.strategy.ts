import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthRepository } from '../auth.repository';
import { comparePassword } from '../../../common/utils/hash.util';
import {
  InvalidCredentialsException,
  InvalidOperationException,
} from '../../../common/exceptions/app.exception';
import { UserStatus } from '../../../common/enums';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authRepo: AuthRepository) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) throw new InvalidCredentialsException();

    if (user.status !== UserStatus.ACTIVE) {
      throw new InvalidOperationException(`Account is ${user.status}`);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new InvalidCredentialsException();

    return user;
  }
}
