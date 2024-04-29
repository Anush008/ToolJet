import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGranularPermissionsTable1714015564318 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        CREATE TYPE resource_type AS ENUM ('app', 'data_source');  
       `
    );

    await queryRunner.query(
      `
      CREATE TABLE granular_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID,
        name VARCHAR NOT NULL,
        type resource_type NOT NULL,
        is_all BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES group_permissions(id) ON DELETE CASCADE
    );  
       `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS granular_permissions`);
  }
}