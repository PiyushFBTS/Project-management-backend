import { MigrationInterface, QueryRunner } from 'typeorm';
import { Country as CSCCountry, State as CSCState, City as CSCCity } from 'country-state-city';

export class SeedCompleteLocationData1710700000000 implements MigrationInterface {
  private esc(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Save existing company location references (by name, not ID) ──
    const companyRefs: Array<{
      id: number;
      countryCode: string | null;
      stateName: string | null;
      cityName: string | null;
    }> = [];

    const companies = await queryRunner.query(
      `SELECT c.id,
              co.code  AS country_code,
              s.name   AS state_name,
              ci.name  AS city_name
       FROM companies c
       LEFT JOIN countries co ON co.id = c.country_id
       LEFT JOIN states   s  ON s.id  = c.state_id
       LEFT JOIN cities   ci ON ci.id = c.city_id
       WHERE c.country_id IS NOT NULL
          OR c.state_id   IS NOT NULL
          OR c.city_id    IS NOT NULL`,
    );

    for (const row of companies) {
      companyRefs.push({
        id: row.id,
        countryCode: row.country_code,
        stateName: row.state_name,
        cityName: row.city_name,
      });
    }

    // ── 2. Clear all location tables ────────────────────────────────────
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryRunner.query('TRUNCATE TABLE cities');
    await queryRunner.query('TRUNCATE TABLE states');
    await queryRunner.query('TRUNCATE TABLE countries');
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── 3. Widen phone_code to handle longer codes ─────────────────────
    await queryRunner.query(`ALTER TABLE countries MODIFY phone_code VARCHAR(20) NULL`);

    // ── 4. Insert all countries ─────────────────────────────────────────
    const allCountries = CSCCountry.getAllCountries();
    for (const batch of this.chunk(allCountries, 50)) {
      const values = batch
        .map((c) => {
          const phone = c.phonecode ? '+' + c.phonecode.replace(/\+/g, '') : '';
          return `('${this.esc(c.name)}', '${c.isoCode}', '${this.esc(phone.substring(0, 20))}')`;
        })
        .join(',');
      await queryRunner.query(
        `INSERT INTO countries (name, code, phone_code) VALUES ${values}`,
      );
    }

    // Build country code → id map
    const countryRows: Array<{ id: number; code: string }> =
      await queryRunner.query('SELECT id, code FROM countries');
    const countryIdMap: Record<string, number> = {};
    for (const r of countryRows) countryIdMap[r.code] = r.id;

    // ── 4. Insert all states ────────────────────────────────────────────
    const allStates = CSCState.getAllStates();

    // Group by country for efficient batching
    const statesByCountry: Record<string, typeof allStates> = {};
    for (const s of allStates) {
      if (!statesByCountry[s.countryCode]) statesByCountry[s.countryCode] = [];
      statesByCountry[s.countryCode].push(s);
    }

    for (const [cc, states] of Object.entries(statesByCountry)) {
      const countryId = countryIdMap[cc];
      if (!countryId) continue;

      for (const batch of this.chunk(states, 200)) {
        const values = batch
          .map((s) => {
            const code = s.isoCode ? `'${this.esc(s.isoCode.substring(0, 10))}'` : 'NULL';
            return `('${this.esc(s.name)}', ${code}, ${countryId})`;
          })
          .join(',');
        await queryRunner.query(
          `INSERT INTO states (name, code, country_id) VALUES ${values}`,
        );
      }
    }

    // Build state lookup: "countryCode-stateCode" → id
    const stateRows: Array<{ id: number; code: string | null; country_id: number }> =
      await queryRunner.query('SELECT id, code, country_id FROM states');
    const countryCodeById: Record<number, string> = {};
    for (const [code, id] of Object.entries(countryIdMap)) countryCodeById[id] = code;

    const stateIdMap: Record<string, number> = {};
    for (const r of stateRows) {
      const cc = countryCodeById[r.country_id];
      if (cc && r.code) stateIdMap[`${cc}-${r.code}`] = r.id;
    }

    // ── 5. Insert all cities (biggest dataset — batch aggressively) ─────
    const allCities = CSCCity.getAllCities();
    console.log(`  → Inserting ${allCities.length} cities in batches...`);

    let insertedCities = 0;
    for (const batch of this.chunk(allCities, 2000)) {
      const validRows: string[] = [];
      for (const city of batch) {
        const key = `${city.countryCode}-${city.stateCode}`;
        const stateId = stateIdMap[key];
        if (stateId) {
          validRows.push(`('${this.esc(city.name)}', ${stateId})`);
        }
      }
      if (validRows.length > 0) {
        await queryRunner.query(
          `INSERT INTO cities (name, state_id) VALUES ${validRows.join(',')}`,
        );
        insertedCities += validRows.length;
      }
    }
    console.log(`  → Inserted ${insertedCities} cities total.`);

    // ── 6. Restore company location references ──────────────────────────
    for (const ref of companyRefs) {
      const sets: string[] = [];

      // Resolve country
      let newCountryId: number | null = null;
      if (ref.countryCode) {
        newCountryId = countryIdMap[ref.countryCode] ?? null;
        sets.push(`country_id = ${newCountryId ?? 'NULL'}`);
      }

      // Resolve state
      let newStateId: number | null = null;
      if (ref.stateName && newCountryId) {
        const [s] = await queryRunner.query(
          `SELECT id FROM states WHERE name = '${this.esc(ref.stateName)}' AND country_id = ${newCountryId} LIMIT 1`,
        );
        newStateId = s?.id ?? null;
        sets.push(`state_id = ${newStateId ?? 'NULL'}`);
      }

      // Resolve city
      if (ref.cityName && newStateId) {
        const [c] = await queryRunner.query(
          `SELECT id FROM cities WHERE name = '${this.esc(ref.cityName)}' AND state_id = ${newStateId} LIMIT 1`,
        );
        sets.push(`city_id = ${c?.id ?? 'NULL'}`);
      }

      if (sets.length > 0) {
        await queryRunner.query(
          `UPDATE companies SET ${sets.join(', ')} WHERE id = ${ref.id}`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Seed-only — reverting would need a backup restore
  }
}
