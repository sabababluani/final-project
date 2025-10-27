import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateGoogleUserDto } from '../users/dto/create-google-user.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { loginUserDto } from './dto/login-user.dto';
import { TokenBlacklistService } from '../token-blacklists/token-blacklists.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { ConfigService } from '@nestjs/config';
import { GoogleRedirectRequest } from './interfaces/google-redirect-request.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly systemLogsService: SystemLogsService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  async register(createUserDto: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { email } = createUserDto;
      const existingUser = await this.usersService.findOneByEmail(email);

      if (existingUser) {
        throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
      }

      const user = await this.usersService.create(createUserDto);

      await this.systemLogsService.createLog({
        message: `New user registered with email: ${email}`,
      });

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validateUser(userDto: CreateGoogleUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { email: userDto.email },
      });

      if (user) {
        await this.systemLogsService.createLog({
          message: `Google user logged in: ${user.email}, ID: ${user.id}`,
        });
        await queryRunner.commitTransaction();
        return user;
      }

      const newUser = queryRunner.manager.create(User, userDto);
      const savedUser = await queryRunner.manager.save(newUser);

      await this.systemLogsService.createLog({
        message: `New Google user created: ${savedUser.email}, ID: ${savedUser.id}`,
      });

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    return user;
  }

  private async generateToken(payload: JwtPayload) {
    const secret = this.configService.get<string>('JWT_SECRET');
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        secret,
        expiresIn: this.configService.get<number>('JWT_EXPIRATION_TIME'),
      }),
    };
  }

  async handleRedirect(req: GoogleRedirectRequest) {
    const user = req.user;
    const payload = { sub: user.id, email: user.email, role: user.role };

    await this.systemLogsService.createLog({
      message: `User ID: ${user.id} authenticated via OAuth redirect`,
    });

    return this.generateToken(payload);
  }

  async login(body: loginUserDto) {
    const { email, password } = body;
    const user = await this.usersService.findOneByEmail(email);
    const isPasswordCorrect =
      user && (await bcrypt.compare(password, user.password));

    if (!isPasswordCorrect) {
      await this.systemLogsService.createLog({
        message: `Failed login attempt for email: ${email}`,
      });
      throw new BadRequestException('Password is incorrect');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    await this.systemLogsService.createLog({
      message: `User logged in: ${user.email}, ID: ${user.id}`,
    });

    return this.generateToken(payload);
  }

  async logout(token: string, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const decodedToken = this.jwtService.decode(token);

      if (!decodedToken || !decodedToken.exp) {
        throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
      }

      const expiresAt = new Date(decodedToken.exp * 1000);
      await this.tokenBlacklistService.addToBlacklist(token, userId, expiresAt);

      await this.systemLogsService.createLog({
        message: `User ID: ${userId} logged out`,
      });

      await queryRunner.commitTransaction();
      return { message: 'Successfully logged out' };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Logout failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }
}
