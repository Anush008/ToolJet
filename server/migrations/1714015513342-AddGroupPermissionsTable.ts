import { MigrationInterface, QueryRunner } from 'typeorm';
import { DATA_BASE_CONSTRAINTS } from '@module/group_permissions/constants/group-permissions.constant';

export class AddGroupPermissionsTable1714015513342 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
       CREATE TYPE group_permissions_type AS ENUM ('custom', 'default');
        `
    );

    await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS group_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID,
        name VARCHAR NOT NULL,
        type group_permissions_type NOT NULL DEFAULT 'custom',
        editable BOOLEAN NOT NULL DEFAULT true,
        only_builders BOOLEAN NOT NULL,
        app_create BOOLEAN DEFAULT false,
        app_delete BOOLEAN DEFAULT false,
        folder_crud BOOLEAN DEFAULT false,
        org_constant_crud BOOLEAN DEFAULT false,
        data_source_create BOOLEAN DEFAULT false,
        data_source_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
        CONSTRAINT ${DATA_BASE_CONSTRAINTS.GROUP_NAME_UNIQUE} UNIQUE (organization_id, name)
    );
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_permissions`);
    await queryRunner.query(`DROP TYPE IF EXISTS group_permissions_type;`);
  }
}