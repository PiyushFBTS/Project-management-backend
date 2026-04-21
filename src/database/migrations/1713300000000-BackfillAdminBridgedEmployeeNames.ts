import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Existing admin-bridged employee rows were created with `emp_name = <email-prefix>`
 * (e.g. "rahul.admin"). Now that admins fill task sheets, these rows surface in
 * reports as ugly strings. Copy the real admin display name from `admin_users`
 * so reports show "Rahul Sharma" instead.
 *
 * Scope: only rows that look like admin bridges — empCode starts with "ADM-"
 * and consultant_type = 'management'.
 */
export class BackfillAdminBridgedEmployeeNames1713300000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      UPDATE employees e
      INNER JOIN admin_users a ON a.email = e.email
      SET e.emp_name = a.name
      WHERE e.emp_code LIKE 'ADM-%'
        AND e.consultant_type = 'management'
        AND a.name IS NOT NULL
        AND a.name <> ''
        AND e.emp_name <> a.name
    `);
  }

  public async down(): Promise<void> {
    // No-op: reverting to email-prefix names would lose information.
  }
}
