import { BaseEntity } from '../../common/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class SystemLog extends BaseEntity {
  @Column()
  message: string;

  @Column({ nullable: true })
  level?: string;
}
