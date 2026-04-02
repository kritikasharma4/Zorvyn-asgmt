# Finance Dashboard Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a NestJS backend for a multi-role finance dashboard system with role-based access control, financial record management, and comprehensive analytics.

**Architecture:** Layered architecture (Controllers → Guards → Services → Repositories → Database) with clear separation of concerns. 5 database tables, 8 NestJS modules, 41 API endpoints with role-based access control and soft-delete patterns.

**Tech Stack:** NestJS, MySQL 8+, TypeORM, JWT (@nestjs/jwt, @nestjs/passport), Swagger (@nestjs/swagger), class-validator, bcrypt

**Key Constraints:**
- Record fields (type, category, date, currency) are immutable after creation
- Only amount and notes can be updated
- Single active currency enforced system-wide
- Admins can only create records for non-admin users
- Soft-delete pattern for users and records
- 3-tier role system: Viewer (read own), Analyst (read all), Admin (full)

---

## File Structure Overview

```
src/
├── main.ts                          # Entry point with Swagger setup
├── app.module.ts                    # Root module imports
├── auth/                            # Authentication & JWT
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   └── dtos/
│       ├── login.dto.ts
│       └── register.dto.ts
├── users/                           # User management
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dtos/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── user-response.dto.ts
├── config/                          # System configuration
│   ├── config.module.ts
│   ├── config.service.ts
│   ├── config.controller.ts
│   ├── config.repository.ts
│   ├── entities/
│   │   └── system-config.entity.ts
│   └── dtos/
│       ├── set-max-users.dto.ts
│       └── set-currency.dto.ts
├── categories/                      # Financial categories
│   ├── categories.module.ts
│   ├── categories.service.ts
│   ├── categories.controller.ts
│   ├── categories.repository.ts
│   ├── entities/
│   │   └── category.entity.ts
│   └── dtos/
│       └── create-category.dto.ts
├── records/                         # Financial records
│   ├── records.module.ts
│   ├── records.service.ts
│   ├── records.controller.ts
│   ├── records.repository.ts
│   ├── entities/
│   │   └── record.entity.ts
│   └── dtos/
│       ├── create-record.dto.ts
│       ├── update-record.dto.ts
│       ├── record-filter.dto.ts
│       └── record-response.dto.ts
├── analytics/                       # Analytics & reporting
│   ├── analytics.module.ts
│   ├── analytics.service.ts
│   ├── analytics.controller.ts
│   ├── admin-analytics.controller.ts
│   ├── visibility-config.service.ts
│   ├── visibility-config.repository.ts
│   ├── entities/
│   │   └── visibility-config.entity.ts
│   └── dtos/
│       ├── summary.dto.ts
│       ├── category-breakdown.dto.ts
│       ├── trend.dto.ts
│       └── visibility-config.dto.ts
├── common/                          # Shared utilities
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── role.guard.ts
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── validators/
│   │   ├── category.validator.ts
│   │   └── currency.validator.ts
│   ├── exceptions/
│   │   └── custom-exceptions.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interfaces/
│       └── index.ts
├── database/
│   ├── database.module.ts
│   ├── typeorm.config.ts
│   ├── migrations/
│   │   ├── 1704067200000-CreateUsersTable.ts
│   │   ├── 1704067300000-CreateRecordsTable.ts
│   │   ├── 1704067400000-CreateCategoriesTable.ts
│   │   ├── 1704067500000-CreateVisibilityConfigTable.ts
│   │   └── 1704067600000-CreateSystemConfigTable.ts
│   └── seeds/
│       ├── admin.seed.ts
│       ├── categories.seed.ts
│       ├── visibility.seed.ts
│       └── system-config.seed.ts
└── config/
    └── env.ts

test/
├── auth.spec.ts
├── users.spec.ts
├── records.spec.ts
└── analytics.spec.ts

.env.example
.env
docker-compose.yml
README.md
package.json
tsconfig.json
nest-cli.json
```

---

## Task Breakdown

### Phase 1: Project Setup & Database Layer

### Task 1: Create NestJS Project & Install Dependencies

**Files:**
- Create: `package.json` (update/create)
- Create: `tsconfig.json`
- Create: `nest-cli.json`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize NestJS project**

```bash
npx @nestjs/cli@latest new finance-dashboard
cd finance-dashboard
```

- [ ] **Step 2: Install required dependencies**

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/typeorm typeorm mysql2
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/swagger swagger-ui-express
npm install class-validator class-transformer
npm install bcrypt dotenv
npm install @types/bcrypt --save-dev
npm install @types/node --save-dev
```

- [ ] **Step 3: Create .env.example file**

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=finance_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h

# App
PORT=3000
NODE_ENV=development
```

- [ ] **Step 4: Create .gitignore file**

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env
.env.local

# Build
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize NestJS project with dependencies"
```

---

### Task 2: Create Database Configuration & TypeORM Setup

**Files:**
- Create: `src/database/database.module.ts`
- Create: `src/database/typeorm.config.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Create typeorm.config.ts**

```typescript
// src/database/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'finance_db',
  entities: [__dirname + '/../**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: true,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
};
```

- [ ] **Step 2: Create database.module.ts**

```typescript
// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig)],
})
export class DatabaseModule {}
```

- [ ] **Step 3: Update app.module.ts to import DatabaseModule**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 4: Update main.ts with Swagger setup**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Finance Dashboard API')
    .setDescription('Multi-role finance dashboard with RBAC')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
```

- [ ] **Step 5: Commit**

```bash
git add src/database/ src/app.module.ts src/main.ts
git commit -m "feat: configure TypeORM and Swagger setup"
```

---

### Task 3: Create User Entity & Database Migration

**Files:**
- Create: `src/users/entities/user.entity.ts`
- Create: `src/database/migrations/1704067200000-CreateUsersTable.ts`

- [ ] **Step 1: Create User entity**

```typescript
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Record } from '../../records/entities/record.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['viewer', 'analyst', 'admin'],
    default: 'analyst',
  })
  role: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Record, (record) => record.user, { onDelete: 'CASCADE' })
  records: Record[];
}
```

- [ ] **Step 2: Create CreateUsersTable migration**

```typescript
// src/database/migrations/1704067200000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['viewer', 'analyst', 'admin'],
            default: "'analyst'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
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

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_is_deleted',
        columnNames: ['is_deleted'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/users/entities/ src/database/migrations/1704067200000-CreateUsersTable.ts
git commit -m "feat: create User entity and migration"
```

---

### Task 4: Create Record, Category, VisibilityConfig, and SystemConfig Entities & Migrations

**Files:**
- Create: `src/records/entities/record.entity.ts`
- Create: `src/categories/entities/category.entity.ts`
- Create: `src/analytics/entities/visibility-config.entity.ts`
- Create: `src/config/entities/system-config.entity.ts`
- Create: `src/database/migrations/1704067300000-CreateRecordsTable.ts`
- Create: `src/database/migrations/1704067400000-CreateCategoriesTable.ts`
- Create: `src/database/migrations/1704067500000-CreateVisibilityConfigTable.ts`
- Create: `src/database/migrations/1704067600000-CreateSystemConfigTable.ts`

- [ ] **Step 1: Create Record entity**

```typescript
// src/records/entities/record.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('records')
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['income', 'expense'] })
  type: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

- [ ] **Step 2: Create Category entity**

```typescript
// src/categories/entities/category.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
```

- [ ] **Step 3: Create VisibilityConfig entity**

```typescript
// src/analytics/entities/visibility-config.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('analyst_visibility_config')
export class VisibilityConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  field_name: string;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

- [ ] **Step 4: Create SystemConfig entity**

```typescript
// src/config/entities/system-config.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
```

- [ ] **Step 5: Create CreateRecordsTable migration**

```typescript
// src/database/migrations/1704067300000-CreateRecordsTable.ts
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
```

- [ ] **Step 6: Create CreateCategoriesTable migration**

```typescript
// src/database/migrations/1704067400000-CreateCategoriesTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCategoriesTable1704067400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'idx_name',
        columnNames: ['name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('categories');
  }
}
```

- [ ] **Step 7: Create CreateVisibilityConfigTable migration**

```typescript
// src/database/migrations/1704067500000-CreateVisibilityConfigTable.ts
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
```

- [ ] **Step 8: Create CreateSystemConfigTable migration**

```typescript
// src/database/migrations/1704067600000-CreateSystemConfigTable.ts
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
```

- [ ] **Step 9: Commit**

```bash
git add src/records/entities/ src/categories/entities/ src/analytics/entities/ src/config/entities/
git add src/database/migrations/1704067300000-CreateRecordsTable.ts
git add src/database/migrations/1704067400000-CreateCategoriesTable.ts
git add src/database/migrations/1704067500000-CreateVisibilityConfigTable.ts
git add src/database/migrations/1704067600000-CreateSystemConfigTable.ts
git commit -m "feat: create Record, Category, VisibilityConfig, SystemConfig entities and migrations"
```

---

## Continuation Notice

This plan is extensive (~1500+ lines). I've created **Phase 1: Project Setup & Database Layer** with detailed tasks 1-4.

**Remaining Phases (in separate sections):**
- Phase 2: Common Layer & Guards
- Phase 3: Authentication Module
- Phase 4: System Configuration & Categories
- Phase 5: Users Module
- Phase 6: Records Module
- Phase 7: Analytics Module
- Phase 8: Final Setup & Documentation

Would you like me to:

A) **Continue with the complete plan** (all remaining phases in this document)
B) **Save this Phase 1 and start implementation** (we can continue planning after Phase 1)

**Which approach?**