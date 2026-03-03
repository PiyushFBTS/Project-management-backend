import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketNumber1709700000000 implements MigrationInterface {
  name = 'AddTicketNumber1709700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`project_tasks\` ADD COLUMN \`ticket_number\` VARCHAR(30) NULL AFTER \`phase_id\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`idx_task_ticket\` ON \`project_tasks\` (\`ticket_number\`)`,
    );

    // Backfill existing tasks with ticket numbers
    const tasks = await queryRunner.query(`
      SELECT t.id, t.project_id, p.project_code
      FROM project_tasks t
      JOIN projects p ON p.id = t.project_id
      ORDER BY t.project_id, t.id
    `);

    const counters: Record<number, number> = {};
    for (const task of tasks) {
      counters[task.project_id] = (counters[task.project_id] ?? 0) + 1;
      const seq = String(counters[task.project_id]).padStart(3, '0');
      const ticketNumber = `${task.project_code}-${seq}`;
      await queryRunner.query(
        `UPDATE \`project_tasks\` SET \`ticket_number\` = ? WHERE \`id\` = ?`,
        [ticketNumber, task.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_task_ticket\` ON \`project_tasks\``);
    await queryRunner.query(`ALTER TABLE \`project_tasks\` DROP COLUMN \`ticket_number\``);
  }
}
