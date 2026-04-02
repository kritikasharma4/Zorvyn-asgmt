import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateRecordsTable1704067300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'records',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['income', 'expense'],
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createForeignKey(
      'records',
      new TableForeignKey({
        name: 'fk_records_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex('records', new TableIndex({ name: 'idx_user_id', columnNames: ['user_id'] }));
    await queryRunner.createIndex('records', new TableIndex({ name: 'idx_date', columnNames: ['date'] }));
    await queryRunner.createIndex('records', new TableIndex({ name: 'idx_type', columnNames: ['type'] }));
    await queryRunner.createIndex('records', new TableIndex({ name: 'idx_category', columnNames: ['category'] }));
    await queryRunner.createIndex('records', new TableIndex({ name: 'idx_currency', columnNames: ['currency'] }));
    await queryRunner.createIndex('records', new TableIndex({ name: 'idx_is_deleted', columnNames: ['is_deleted'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('records');
  }
}
