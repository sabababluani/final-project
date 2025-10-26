import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
  }

  async create(
    userData: Partial<User>,
    queryRunner: QueryRunner
  ): Promise<User> {
    const newUser = queryRunner.manager.create(User, userData);
    return queryRunner.manager.save(newUser);
  }

  async update(
    id: number,
    updateData: Partial<User>,
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.manager.update(User, id, updateData);
  }

  async delete(
    id: number,
    queryRunner: QueryRunner
  ): Promise<{ affected?: number | null }> {
    return queryRunner.manager.delete(User, id);
  }

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
