import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly systemLogsService: SystemLogsService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { firstName, email, lastName, password, confirmPassword, birthdate } =
      createUserDto;

    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
    }

    if (password !== confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const queryRunner = this.usersRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newUser = await this.usersRepository.create(
        {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          birthdate: birthdate ? new Date(birthdate) : undefined,
        },
        queryRunner
      );

      await this.systemLogsService.createLog({
        message: `User ${newUser.id} (${newUser.email}) created`,
      });

      await queryRunner.commitTransaction();
      return { message: 'User Successfully Registered' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const queryRunner = this.usersRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.usersRepository.findById(id);
      if (!user) throw new NotFoundException(`User with ID ${id} not found`);

      const { confirmPassword, password, ...updateData } = updateUserDto;

      if (password) {
        if (password !== confirmPassword) {
          throw new HttpException(
            'Passwords do not match',
            HttpStatus.BAD_REQUEST
          );
        }
        updateData['password'] = await bcrypt.hash(password, 10);
      }

      await this.usersRepository.update(
        id,
        updateData as Partial<User>,
        queryRunner
      );

      await this.systemLogsService.createLog({
        message: `User ${id} updated`,
      });

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const queryRunner = this.usersRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await this.usersRepository.delete(id, queryRunner);
      if (!result.affected)
        throw new NotFoundException(`User with ID ${id} not found`);

      await this.systemLogsService.createLog({
        message: `User ${id} deleted`,
      });

      await queryRunner.commitTransaction();
      return { message: `User with ID ${id} successfully deleted` };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findOneByEmail(email: string) {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  async me(user: User) {
    return this.findOne(user.id);
  }
}
