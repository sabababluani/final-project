import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBirthDateToUsers1761487872601 implements MigrationInterface {
  name = 'AddBirthDateToUsers1761487872601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`birthdate\` date NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`avatar\` \`avatar\` varchar(255) NULL DEFAULT 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`avatar\` \`avatar\` varchar(255) NULL`
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`birthdate\``);
  }
}
