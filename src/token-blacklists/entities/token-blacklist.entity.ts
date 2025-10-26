import { BaseEntity } from '../../common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class TokenBlacklist extends BaseEntity {
  @Column({ type: 'varchar', length: 500 })
  token: string;

  @Column()
  userId: number;

  @Column()
  expiresAt: Date;
}
