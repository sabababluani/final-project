import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vinyl } from '../../vinyls/entities/vinyl.entity';
import { BaseEntity } from '../../common/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Review extends BaseEntity {
  @ApiProperty({
    description: 'Rating score (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @Column('int')
  score: number;

  @ApiProperty({
    description: 'Review comment or feedback',
    example: 'Amazing album! The sound quality is pristine.',
  })
  @Column('text')
  comment: string;

  @ApiProperty({
    description: 'User who wrote the review',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.reviews, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ApiProperty({
    description: 'Vinyl being reviewed',
    type: () => Vinyl,
  })
  @ManyToOne(() => Vinyl, (vinyl) => vinyl.reviews, { onDelete: 'CASCADE' })
  vinyl: Vinyl;
}
