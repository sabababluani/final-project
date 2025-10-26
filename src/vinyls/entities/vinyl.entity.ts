import { BaseEntity } from '../../common/base.entity';
import { Review } from '../../reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity()
export class Vinyl extends BaseEntity {
  @ApiProperty({
    description: 'Name of the vinyl record',
    example: 'Abbey Road',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Name of the artist or band',
    example: 'The Beatles',
  })
  @Column()
  authorName: string;

  @ApiProperty({
    description: 'URL of the vinyl record cover image',
    example: 'https://example.com/images/abbey-road.jpg',
  })
  @Column()
  image: string;

  @ApiProperty({
    description: 'Detailed description of the vinyl record',
    example: 'Iconic album featuring classic hits',
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'Price of the vinyl record in USD',
    example: 29.99,
    type: 'number',
  })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({
    description: 'Average rating based on user reviews (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
  })
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @ApiProperty({
    description: 'Owner of the vinyl listing',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.vinyls, {
    eager: true,
    onDelete: 'CASCADE',
  })
  owner: User;

  @ApiPropertyOptional({
    description: 'Reviews for this vinyl',
    type: () => [Review],
  })
  @OneToMany(() => Review, (review) => review.vinyl, { cascade: true })
  reviews: Review[];
}
