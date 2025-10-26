import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1761300493467 implements MigrationInterface {
  name = 'InitialMigration1761300493467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`role\` enum ('User', 'Admin') NULL DEFAULT 'User', \`password\` varchar(255) NULL, \`avatar\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`review\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`score\` int NOT NULL, \`comment\` text NOT NULL, \`userId\` int NULL, \`vinylId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`vinyl\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`name\` varchar(255) NOT NULL, \`authorName\` varchar(255) NOT NULL, \`image\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`price\` decimal(10,2) NOT NULL, \`averageRating\` decimal(3,2) NOT NULL DEFAULT '0.00', \`ownerId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`token_blacklist\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`token\` varchar(500) NOT NULL, \`userId\` int NOT NULL, \`expiresAt\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`system_log\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`message\` varchar(255) NOT NULL, \`level\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`vinylId\` int NOT NULL, \`quantity\` int NOT NULL, \`price\` decimal(10,2) NOT NULL, \`orderId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`stripeSessionId\` varchar(255) NOT NULL, \`stripePaymentIntentId\` varchar(255) NULL, \`totalAmount\` decimal(10,2) NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_1337f93918c70837d3cea105d39\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` ADD CONSTRAINT \`FK_01a98f7acabc7f7ba6d9025bb85\` FOREIGN KEY (\`vinylId\`) REFERENCES \`vinyl\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`vinyl\` ADD CONSTRAINT \`FK_8b62aabe99a265023010f169c1c\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_f1d359a55923bb45b057fbdab0d\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_f1d359a55923bb45b057fbdab0d\``
    );
    await queryRunner.query(
      `ALTER TABLE \`vinyl\` DROP FOREIGN KEY \`FK_8b62aabe99a265023010f169c1c\``
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_01a98f7acabc7f7ba6d9025bb85\``
    );
    await queryRunner.query(
      `ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_1337f93918c70837d3cea105d39\``
    );
    await queryRunner.query(`DROP TABLE \`orders\``);
    await queryRunner.query(`DROP TABLE \`order_items\``);
    await queryRunner.query(`DROP TABLE \`system_log\``);
    await queryRunner.query(`DROP TABLE \`token_blacklist\``);
    await queryRunner.query(`DROP TABLE \`vinyl\``);
    await queryRunner.query(`DROP TABLE \`review\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
