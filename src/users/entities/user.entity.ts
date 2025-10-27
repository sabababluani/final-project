import { Role } from '../../auth/guards/enum/role.enum';
import { BaseEntity } from '../../common/base.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Vinyl } from '../../vinyls/entities/vinyl.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @Column()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @Column()
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @Column()
  email: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: Role,
    example: Role.USER,
  })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
    nullable: true,
  })
  role: string;

  @ApiPropertyOptional({
    description: 'User password (hidden in responses)',
    writeOnly: true,
  })
  @Column({ select: false, nullable: true })
  password: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @Column({
    nullable: true,
    default:
      'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg',
  })
  avatar: string;

  @ApiPropertyOptional({
    description: 'User birthdate',
    example: '1990-01-15',
    type: 'string',
    format: 'date',
  })
  @Column({ type: 'date', nullable: true })
  birthdate?: Date;

  @ApiPropertyOptional({
    description: 'Vinyls owned by the user',
    type: () => [Vinyl],
  })
  @OneToMany(() => Vinyl, (vinyl) => vinyl.owner)
  vinyls: Vinyl[];

  @ApiPropertyOptional({
    description: 'Reviews written by the user',
    type: () => [Review],
  })
  @OneToMany(() => Review, (review) => review.user, { cascade: true })
  reviews: Review[];
}
