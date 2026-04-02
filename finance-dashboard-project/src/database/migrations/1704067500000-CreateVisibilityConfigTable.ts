import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateVisibilityConfigTable1704067500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'analyst_visibility_config',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'field_name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'is_visible',
            type: 'boolean',
            default: true,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('analyst_visibility_config');
  }
}
