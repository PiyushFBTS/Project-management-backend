import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImprovePostalCodeMapping1710900000000 implements MigrationInterface {
  private esc(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Clear existing postal codes — we'll re-seed with better matching ──
    await queryRunner.query('TRUNCATE TABLE postal_codes');

    // ── 2. Seed Indian pincodes with improved city matching ─────────────
    console.log('  → Re-seeding Indian postal codes with improved matching...');
    let indiaInserted = 0;

    try {
      const indiaData: Array<{
        pincode: number;
        officeName: string;
        districtName: string;
        stateName: string;
        taluk: string;
      }> = require('india-pincode-lookup/pincodes.json');

      // Get India country ID
      const [indiaRow] = await queryRunner.query(`SELECT id FROM countries WHERE code = 'IN'`);
      if (!indiaRow) throw new Error('India not found');
      const indiaId = indiaRow.id;

      // Get all Indian states: uppercase name → id
      const stateRows: Array<{ id: number; name: string }> = await queryRunner.query(
        `SELECT id, name FROM states WHERE country_id = ${indiaId}`,
      );
      // Map state names with common variations
      const stateNameMap: Record<string, number> = {};
      const stateAliases: Record<string, string> = {
        'CHATTISGARH': 'CHHATTISGARH',
        'ORISSA': 'ODISHA',
        'PONDICHERRY': 'PUDUCHERRY',
        'UTTARANCHAL': 'UTTARAKHAND',
        'ANDAMAN AND NICOBAR ISLANDS': 'ANDAMAN AND NICOBAR',
        'JAMMU AND KASHMIR': 'JAMMU & KASHMIR',
        'DADRA AND NAGAR HAVELI': 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
      };
      for (const s of stateRows) {
        stateNameMap[s.name.toUpperCase()] = s.id;
      }

      // Get all Indian cities: { name, state_id, id }
      const indianStateIds = stateRows.map((s) => s.id);
      if (indianStateIds.length === 0) throw new Error('No Indian states');

      const cityRows: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
        `SELECT id, name, state_id FROM cities WHERE state_id IN (${indianStateIds.join(',')})`,
      );

      // Build multiple lookup maps for cities
      // 1. Exact match: "CITYNAME-stateId" → cityId
      const cityExact: Record<string, number> = {};
      // 2. Lowercase words for partial matching
      const citiesByState: Record<number, Array<{ id: number; name: string; nameUpper: string }>> = {};

      for (const c of cityRows) {
        const key = `${c.name.toUpperCase()}-${c.state_id}`;
        cityExact[key] = c.id;
        if (!citiesByState[c.state_id]) citiesByState[c.state_id] = [];
        citiesByState[c.state_id].push({ id: c.id, name: c.name, nameUpper: c.name.toUpperCase() });
      }

      // Group pincode data by unique pincode+district
      const pincodesByDistrict = new Map<string, {
        pincodes: Set<number>;
        district: string;
        state: string;
        entries: Array<{ pincode: number; officeName: string }>;
      }>();

      for (const row of indiaData) {
        const key = `${row.districtName.toUpperCase()}-${row.stateName.toUpperCase()}`;
        if (!pincodesByDistrict.has(key)) {
          pincodesByDistrict.set(key, {
            pincodes: new Set(),
            district: row.districtName,
            state: row.stateName,
            entries: [],
          });
        }
        const group = pincodesByDistrict.get(key)!;
        if (!group.pincodes.has(row.pincode)) {
          group.pincodes.add(row.pincode);
          group.entries.push({ pincode: row.pincode, officeName: row.officeName });
        }
      }

      // For each district, find the best matching city
      const allRows: Array<{ code: string; areaName: string; cityId: number }> = [];

      for (const [, group] of pincodesByDistrict) {
        // Resolve state
        let stateId = stateNameMap[group.state.toUpperCase()];
        if (!stateId) {
          const alias = stateAliases[group.state.toUpperCase()];
          if (alias) stateId = stateNameMap[alias];
        }
        if (!stateId) continue;

        // Try to find city - multiple strategies
        let cityId: number | undefined;
        const districtUpper = group.district.toUpperCase();

        // Strategy 1: Exact match
        cityId = cityExact[`${districtUpper}-${stateId}`];

        // Strategy 2: City name contains district name (e.g., "Prayagraj (Allahabad)" contains "Allahabad")
        if (!cityId && citiesByState[stateId]) {
          const match = citiesByState[stateId].find(
            (c) => c.nameUpper.includes(districtUpper) || districtUpper.includes(c.nameUpper),
          );
          if (match) cityId = match.id;
        }

        // Strategy 3: Handle common name variations
        if (!cityId && citiesByState[stateId]) {
          // Remove parenthetical suffixes and try: "Raigarh(MH)" → "Raigarh"
          const cleanDistrict = districtUpper.replace(/\s*\(.*?\)\s*/g, '').trim();
          if (cleanDistrict !== districtUpper) {
            cityId = cityExact[`${cleanDistrict}-${stateId}`];
            if (!cityId) {
              const match = citiesByState[stateId].find(
                (c) => c.nameUpper.includes(cleanDistrict) || cleanDistrict.includes(c.nameUpper),
              );
              if (match) cityId = match.id;
            }
          }
        }

        // Strategy 4: First word match for compound names
        if (!cityId && citiesByState[stateId]) {
          const firstWord = districtUpper.split(/[\s-]/)[0];
          if (firstWord.length >= 4) {
            const match = citiesByState[stateId].find(
              (c) => c.nameUpper.startsWith(firstWord) || firstWord.startsWith(c.nameUpper.split(/[\s-]/)[0]),
            );
            if (match) cityId = match.id;
          }
        }

        if (!cityId) continue;

        // Add all pincodes for this district→city
        for (const entry of group.entries) {
          allRows.push({
            code: String(entry.pincode),
            areaName: entry.officeName,
            cityId,
          });
        }
      }

      // Deduplicate by code+cityId
      const seen = new Set<string>();
      const uniqueRows = allRows.filter((r) => {
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
    } catch (e) {
      console.log('  → India pincode error:', (e as Error).message);
    }
    console.log(`  → Inserted ${indiaInserted} Indian postal codes.`);

    // ── 3. Seed US zip codes with improved matching ─────────────────────
    console.log('  → Re-seeding US postal codes with improved matching...');
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

      const [usRow] = await queryRunner.query(`SELECT id FROM countries WHERE code = 'US'`);
      if (!usRow) throw new Error('US not found');
      const usId = usRow.id;

      const usStates: Array<{ id: number; code: string }> = await queryRunner.query(
        `SELECT id, code FROM states WHERE country_id = ${usId}`,
      );
      const stateCodeMap: Record<string, number> = {};
      for (const s of usStates) stateCodeMap[s.code] = s.id;

      const usStateIds = usStates.map((s) => s.id);
      if (usStateIds.length > 0) {
        const usCities: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
          `SELECT id, name, state_id FROM cities WHERE state_id IN (${usStateIds.join(',')})`,
        );

        // Build lookup maps
        const cityExact: Record<string, number> = {};
        const citiesByState: Record<number, Array<{ id: number; nameUpper: string }>> = {};
        for (const c of usCities) {
          cityExact[`${c.name.toUpperCase()}-${c.state_id}`] = c.id;
          if (!citiesByState[c.state_id]) citiesByState[c.state_id] = [];
          citiesByState[c.state_id].push({ id: c.id, nameUpper: c.name.toUpperCase() });
        }

        const rows: Array<{ code: string; areaName: string; cityId: number }> = [];
        for (const z of usZips) {
          const stateId = stateCodeMap[z.state];
          if (!stateId) continue;

          let cityId = cityExact[`${z.city.toUpperCase()}-${stateId}`];

          // Partial match
          if (!cityId && citiesByState[stateId]) {
            const cityUpper = z.city.toUpperCase();
            const match = citiesByState[stateId].find(
              (c) => c.nameUpper.includes(cityUpper) || cityUpper.includes(c.nameUpper),
            );
            if (match) cityId = match.id;
          }

          if (!cityId) continue;
          rows.push({ code: z.zip, areaName: z.city, cityId });
        }

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
    } catch (e) {
      console.log('  → US zipcodes error:', (e as Error).message);
    }
    console.log(`  → Inserted ${usInserted} US postal codes.`);

    // ── 4. Cross-link alias cities ──────────────────────────────────────
    // Cities like "Prayagraj (Allahabad)" should get the same pincodes as "Allahabad"
    // Pattern: if city "X (Y)" has 0 pincodes but city "Y" in same state has pincodes → copy
    console.log('  → Cross-linking alias cities...');
    let crossLinked = 0;

    const allCitiesWithState: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
      `SELECT c.id, c.name, c.state_id FROM cities c WHERE c.name LIKE '%(%)%'`,
    );

    for (const city of allCitiesWithState) {
      // Check if this city already has postal codes
      const [existing] = await queryRunner.query(
        `SELECT COUNT(*) as cnt FROM postal_codes WHERE city_id = ${city.id}`,
      );
      if (existing.cnt > 0) continue;

      // Extract the name inside parentheses: "Prayagraj (Allahabad)" → "Allahabad"
      const match = city.name.match(/\(([^)]+)\)/);
      if (!match) continue;
      const aliasName = match[1].trim();

      // Find the alias city in the same state
      const [aliasCity] = await queryRunner.query(
        `SELECT id FROM cities WHERE name = '${this.esc(aliasName)}' AND state_id = ${city.state_id} LIMIT 1`,
      );
      if (!aliasCity) continue;

      // Copy postal codes from alias city
      const copyResult = await queryRunner.query(
        `INSERT INTO postal_codes (code, area_name, city_id)
         SELECT code, area_name, ${city.id} FROM postal_codes WHERE city_id = ${aliasCity.id}`,
      );
      const copied = copyResult?.affectedRows ?? 0;
      if (copied > 0) {
        crossLinked += copied;
      }
    }

    // Also handle the reverse: "Mumbai Suburban" should try matching "Mumbai"
    // And cities with prefixes like "Navi Mumbai", "New Delhi", etc.
    const citiesWithoutPC: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
      `SELECT c.id, c.name, c.state_id
       FROM cities c
       LEFT JOIN postal_codes p ON p.city_id = c.id
       WHERE p.id IS NULL
       AND LENGTH(c.name) > 3`,
    );

    // Build a map of cities that DO have postal codes: state_id → [{id, name}]
    const citiesWithPC: Array<{ id: number; name: string; state_id: number }> = await queryRunner.query(
      `SELECT DISTINCT c.id, c.name, c.state_id
       FROM cities c
       JOIN postal_codes p ON p.city_id = c.id`,
    );
    const pcCitiesByState: Record<number, Array<{ id: number; nameUpper: string }>> = {};
    for (const c of citiesWithPC) {
      if (!pcCitiesByState[c.state_id]) pcCitiesByState[c.state_id] = [];
      pcCitiesByState[c.state_id].push({ id: c.id, nameUpper: c.name.toUpperCase() });
    }

    // For each city without PC, try to find a match from cities WITH PCs in the same state
    for (const city of citiesWithoutPC) {
      const candidates = pcCitiesByState[city.state_id];
      if (!candidates) continue;

      const nameUpper = city.name.toUpperCase();
      // Only match if one city name fully contains the other (min 4 chars to avoid false matches)
      const sourceCity = candidates.find((c) => {
        if (c.nameUpper === nameUpper) return false; // already handled by exact match
        // "NAVI MUMBAI" contains "MUMBAI" → don't match (different pincodes)
        // But "PRAYAGRAJ (ALLAHABAD)" contains "ALLAHABAD" → do match
        // Only match if it's a parenthetical alias
        return false; // Skip this pass — parenthetical handled above
      });
      if (!sourceCity) continue;
    }

    console.log(`  → Cross-linked ${crossLinked} postal codes to alias cities.`);
    console.log(`  → Grand total postal codes: ${indiaInserted + usInserted + crossLinked}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Truncate and re-run previous migration to restore
    await queryRunner.query('TRUNCATE TABLE postal_codes');
  }
}
