import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSystemConfigTable1704067600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_config',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'system_config',
      new TableIndex({
        name: 'idx_key',
        columnNames: ['key'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('system_config');
  }
}
