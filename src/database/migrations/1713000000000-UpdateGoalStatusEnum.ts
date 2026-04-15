import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGoalStatusEnum1713000000000 implements MigrationInterface {
  public async up(qr: QueryRunner): Promise<void> {
    // Widen to varchar so we can rewrite values without enum constraint conflicts
    await qr.query(`ALTER TABLE \`employee_goals\` MODIFY \`status\` VARCHAR(20) NOT NULL DEFAULT 'not_started'`);
    await qr.query(`UPDATE \`employee_goals\` SET \`status\` = 'finished' WHERE \`status\` = 'completed'`);
    await qr.query(`UPDATE \`employee_goals\` SET \`status\` = CASE WHEN \`progress_percent\` >= 100 THEN 'finished' WHEN \`progress_percent\` > 0 THEN 'in_progress' ELSE 'not_started' END WHERE \`status\` IN ('active', 'dropped')`);
    await qr.query(`ALTER TABLE \`employee_goals\` MODIFY \`status\` ENUM('not_started', 'started', 'in_progress', 'finished') NOT NULL DEFAULT 'not_started'`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE \`employee_goals\` MODIFY \`status\` VARCHAR(20) NOT NULL DEFAULT 'active'`);
    await qr.query(`UPDATE \`employee_goals\` SET \`status\` = 'completed' WHERE \`status\` = 'finished'`);
    await qr.query(`UPDATE \`employee_goals\` SET \`status\` = 'active' WHERE \`status\` IN ('not_started', 'started', 'in_progress')`);
    await qr.query(`ALTER TABLE \`employee_goals\` MODIFY \`status\` ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active'`);
  }
}
