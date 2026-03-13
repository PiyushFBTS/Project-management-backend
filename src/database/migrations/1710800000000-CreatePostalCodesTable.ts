import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostalCodesTable1710800000000 implements MigrationInterface {
  private esc(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Create postal_codes table ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE postal_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        area_name VARCHAR(200) NULL,
        city_id INT NOT NULL,
        INDEX IDX_postal_city (city_id),
        INDEX IDX_postal_code (code),
        CONSTRAINT FK_postal_city FOREIGN KEY (city_id)
          REFERENCES cities(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 2. Seed Indian pincodes ─────────────────────────────────────────
    console.log('  → Seeding Indian postal codes...');

    let indiaInserted = 0;
    try {
      const indiaData: Array<{
        pincode: number;
        officeName: string;
        districtName: string;
        stateName: string;
      }> = require('india-pincode-lookup/pincodes.json');

      // Group by unique pincode → district (districtName matches city name best)
      const pincodeMap = new Map<string, { code: string; areaName: string; district: string; state: string }>();
      for (const row of indiaData) {
        const key = `${row.pincode}-${row.districtName}`;
        if (!pincodeMap.has(key)) {
          pincodeMap.set(key, {
            code: String(row.pincode),
            areaName: row.officeName,
            district: row.districtName,
            state: row.stateName,
          });
        }
      }

      // Get India country ID
      const [indiaRow] = await queryRunner.query(`SELECT id FROM countries WHERE code = 'IN'`);
      if (indiaRow) {
        const indiaId = indiaRow.id;

        // Get all Indian states: name → id
        const stateRows: Array<{ id: number; name: string }> = await queryRunner.query(
          `SELECT id, name FROM states WHERE country_id = ${indiaId}`,
        );
        const stateNameMap: Record<string, number> = {};
        for (const s of stateRows) stateNameMap[s.name.toUpperCase()] = s.id;

        // Get all Indian cities: name+state_id → id
        const indianStateIds = stateRows.map((s) => s.id);
        if (indianStateIds.length > 0) {
          const cityRows: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
            `SELECT id, name, state_id FROM cities WHERE state_id IN (${indianStateIds.join(',')})`,
          );
          const cityLookup: Record<string, number> = {};
          for (const c of cityRows) {
            cityLookup[`${c.name.toUpperCase()}-${c.state_id}`] = c.id;
          }

          // Match pincodes to cities
          const rows: Array<{ code: string; areaName: string; cityId: number }> = [];
          for (const pin of pincodeMap.values()) {
            const stateId = stateNameMap[pin.state.toUpperCase()];
            if (!stateId) continue;
            const cityId = cityLookup[`${pin.district.toUpperCase()}-${stateId}`];
            if (!cityId) continue;
            rows.push({ code: pin.code, areaName: pin.areaName, cityId });
          }

          // Deduplicate by code+cityId
          const seen = new Set<string>();
          const uniqueRows = rows.filter((r) => {
            const key = `${r.code}-${r.cityId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          // Batch insert
          for (const batch of this.chunk(uniqueRows, 1000)) {
            const values = batch
              .map((r) => `('${r.code}', '${this.esc(r.areaName)}', ${r.cityId})`)
              .join(',');
            await queryRunner.query(
              `INSERT INTO postal_codes (code, area_name, city_id) VALUES ${values}`,
            );
            indiaInserted += batch.length;
          }
        }
      }
    } catch (e) {
      console.log('  → India pincode package not available, skipping:', (e as Error).message);
    }
    console.log(`  → Inserted ${indiaInserted} Indian postal codes.`);

    // ── 3. Seed US zip codes ────────────────────────────────────────────
    console.log('  → Seeding US postal codes...');

    let usInserted = 0;
    try {
      const zipcodes = require('zipcodes');
      const allZips: Array<{
        zip: string;
        city: string;
        state: string;
        country: string;
      }> = Object.values(zipcodes.codes);

      const usZips = allZips.filter((z) => z.country === 'US');

      // Get US country ID
      const [usRow] = await queryRunner.query(`SELECT id FROM countries WHERE code = 'US'`);
      if (usRow) {
        const usId = usRow.id;

        // Get US states: code → id
        const usStates: Array<{ id: number; code: string }> = await queryRunner.query(
          `SELECT id, code FROM states WHERE country_id = ${usId}`,
        );
        const stateCodeMap: Record<string, number> = {};
        for (const s of usStates) stateCodeMap[s.code] = s.id;

        // Get US cities: name+state_id → id
        const usStateIds = usStates.map((s) => s.id);
        if (usStateIds.length > 0) {
          const usCities: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
            `SELECT id, name, state_id FROM cities WHERE state_id IN (${usStateIds.join(',')})`,
          );
          const cityLookup: Record<string, number> = {};
          for (const c of usCities) {
            cityLookup[`${c.name.toUpperCase()}-${c.state_id}`] = c.id;
          }

          // Match zip codes to cities
          const rows: Array<{ code: string; areaName: string; cityId: number }> = [];
          for (const z of usZips) {
            const stateId = stateCodeMap[z.state];
            if (!stateId) continue;
            const cityId = cityLookup[`${z.city.toUpperCase()}-${stateId}`];
            if (!cityId) continue;
            rows.push({ code: z.zip, areaName: z.city, cityId });
          }

          // Batch insert
          for (const batch of this.chunk(rows, 1000)) {
            const values = batch
              .map((r) => `('${r.code}', '${this.esc(r.areaName)}', ${r.cityId})`)
              .join(',');
            await queryRunner.query(
              `INSERT INTO postal_codes (code, area_name, city_id) VALUES ${values}`,
            );
            usInserted += batch.length;
          }
        }
      }
    } catch (e) {
      console.log('  → US zipcodes package not available, skipping:', (e as Error).message);
    }
    console.log(`  → Inserted ${usInserted} US postal codes.`);
    console.log(`  → Total postal codes: ${indiaInserted + usInserted}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS postal_codes');
  }
}
