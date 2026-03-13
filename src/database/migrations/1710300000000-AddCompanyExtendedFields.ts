import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyExtendedFields1710300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create currencies table ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE currencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(3) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(5) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Create countries table ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(3) NOT NULL UNIQUE,
        phone_code VARCHAR(10) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Create states table ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NULL,
        country_id INT NOT NULL,
        CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Create cities table ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE cities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        state_id INT NOT NULL,
        CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Add new columns to companies ─────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE companies
        ADD COLUMN company_code VARCHAR(50) NULL AFTER slug,
        ADD COLUMN country_id INT NULL,
        ADD COLUMN state_id INT NULL,
        ADD COLUMN city_id INT NULL,
        ADD COLUMN postal_code VARCHAR(20) NULL,
        ADD COLUMN gst_number VARCHAR(50) NULL,
        ADD COLUMN pan_number VARCHAR(20) NULL,
        ADD COLUMN tax_id VARCHAR(50) NULL,
        ADD COLUMN gstin VARCHAR(50) NULL,
        ADD COLUMN tax_registration_number VARCHAR(50) NULL,
        ADD COLUMN gst_enabled TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN vat_enabled TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN base_currency_code VARCHAR(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        ADD COLUMN created_by INT NULL,
        ADD COLUMN updated_by INT NULL,
        ADD CONSTRAINT fk_companies_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_companies_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_companies_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL,
        ADD CONSTRAINT fk_companies_currency FOREIGN KEY (base_currency_code) REFERENCES currencies(code) ON DELETE SET NULL
    `);

    // ── Seed currencies ──────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO currencies (code, name, symbol) VALUES
        ('INR', 'Indian Rupee', '\u20B9'),
        ('USD', 'US Dollar', '$'),
        ('EUR', 'Euro', '\u20AC'),
        ('GBP', 'British Pound', '\u00A3'),
        ('AED', 'UAE Dirham', 'AED'),
        ('SAR', 'Saudi Riyal', 'SAR'),
        ('SGD', 'Singapore Dollar', 'S$'),
        ('AUD', 'Australian Dollar', 'A$'),
        ('CAD', 'Canadian Dollar', 'C$'),
        ('JPY', 'Japanese Yen', '\u00A5'),
        ('CHF', 'Swiss Franc', 'CHF'),
        ('CNY', 'Chinese Yuan', '\u00A5'),
        ('MYR', 'Malaysian Ringgit', 'RM'),
        ('ZAR', 'South African Rand', 'R'),
        ('BRL', 'Brazilian Real', 'R$')
    `);

    // ── Seed countries ───────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO countries (name, code, phone_code) VALUES
        ('India', 'IN', '+91'),
        ('United States', 'US', '+1'),
        ('United Kingdom', 'GB', '+44'),
        ('United Arab Emirates', 'AE', '+971'),
        ('Saudi Arabia', 'SA', '+966'),
        ('Singapore', 'SG', '+65'),
        ('Australia', 'AU', '+61'),
        ('Canada', 'CA', '+1'),
        ('Germany', 'DE', '+49'),
        ('France', 'FR', '+33'),
        ('Japan', 'JP', '+81'),
        ('China', 'CN', '+86'),
        ('Malaysia', 'MY', '+60'),
        ('South Africa', 'ZA', '+27'),
        ('Brazil', 'BR', '+55'),
        ('Netherlands', 'NL', '+31'),
        ('Switzerland', 'CH', '+41'),
        ('Italy', 'IT', '+39'),
        ('Spain', 'ES', '+34'),
        ('New Zealand', 'NZ', '+64')
    `);

    // ── Seed Indian states ───────────────────────────────────────────────
    // Get India's id
    const indiaRows = await queryRunner.query(`SELECT id FROM countries WHERE code = 'IN'`);
    const indiaId = indiaRows[0].id;

    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Andhra Pradesh', 'AP', ${indiaId}),
        ('Arunachal Pradesh', 'AR', ${indiaId}),
        ('Assam', 'AS', ${indiaId}),
        ('Bihar', 'BR', ${indiaId}),
        ('Chhattisgarh', 'CG', ${indiaId}),
        ('Goa', 'GA', ${indiaId}),
        ('Gujarat', 'GJ', ${indiaId}),
        ('Haryana', 'HR', ${indiaId}),
        ('Himachal Pradesh', 'HP', ${indiaId}),
        ('Jharkhand', 'JH', ${indiaId}),
        ('Karnataka', 'KA', ${indiaId}),
        ('Kerala', 'KL', ${indiaId}),
        ('Madhya Pradesh', 'MP', ${indiaId}),
        ('Maharashtra', 'MH', ${indiaId}),
        ('Manipur', 'MN', ${indiaId}),
        ('Meghalaya', 'ML', ${indiaId}),
        ('Mizoram', 'MZ', ${indiaId}),
        ('Nagaland', 'NL', ${indiaId}),
        ('Odisha', 'OD', ${indiaId}),
        ('Punjab', 'PB', ${indiaId}),
        ('Rajasthan', 'RJ', ${indiaId}),
        ('Sikkim', 'SK', ${indiaId}),
        ('Tamil Nadu', 'TN', ${indiaId}),
        ('Telangana', 'TS', ${indiaId}),
        ('Tripura', 'TR', ${indiaId}),
        ('Uttar Pradesh', 'UP', ${indiaId}),
        ('Uttarakhand', 'UK', ${indiaId}),
        ('West Bengal', 'WB', ${indiaId}),
        ('Delhi', 'DL', ${indiaId}),
        ('Chandigarh', 'CH', ${indiaId}),
        ('Jammu and Kashmir', 'JK', ${indiaId}),
        ('Ladakh', 'LA', ${indiaId}),
        ('Puducherry', 'PY', ${indiaId}),
        ('Andaman and Nicobar Islands', 'AN', ${indiaId}),
        ('Dadra and Nagar Haveli and Daman and Diu', 'DN', ${indiaId}),
        ('Lakshadweep', 'LD', ${indiaId})
    `);

    // ── Seed US states (top ones) ────────────────────────────────────────
    const usRows = await queryRunner.query(`SELECT id FROM countries WHERE code = 'US'`);
    const usId = usRows[0].id;

    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('California', 'CA', ${usId}),
        ('Texas', 'TX', ${usId}),
        ('New York', 'NY', ${usId}),
        ('Florida', 'FL', ${usId}),
        ('Illinois', 'IL', ${usId}),
        ('Pennsylvania', 'PA', ${usId}),
        ('Ohio', 'OH', ${usId}),
        ('Georgia', 'GA', ${usId}),
        ('North Carolina', 'NC', ${usId}),
        ('Michigan', 'MI', ${usId}),
        ('New Jersey', 'NJ', ${usId}),
        ('Virginia', 'VA', ${usId}),
        ('Washington', 'WA', ${usId}),
        ('Arizona', 'AZ', ${usId}),
        ('Massachusetts', 'MA', ${usId}),
        ('Tennessee', 'TN', ${usId}),
        ('Indiana', 'IN', ${usId}),
        ('Maryland', 'MD', ${usId}),
        ('Colorado', 'CO', ${usId}),
        ('Minnesota', 'MN', ${usId})
    `);

    // ── Seed UK states ───────────────────────────────────────────────────
    const ukRows = await queryRunner.query(`SELECT id FROM countries WHERE code = 'GB'`);
    const ukId = ukRows[0].id;

    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('England', 'ENG', ${ukId}),
        ('Scotland', 'SCT', ${ukId}),
        ('Wales', 'WLS', ${ukId}),
        ('Northern Ireland', 'NIR', ${ukId})
    `);

    // ── Seed UAE states ──────────────────────────────────────────────────
    const uaeRows = await queryRunner.query(`SELECT id FROM countries WHERE code = 'AE'`);
    const uaeId = uaeRows[0].id;

    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Abu Dhabi', 'AZ', ${uaeId}),
        ('Dubai', 'DU', ${uaeId}),
        ('Sharjah', 'SH', ${uaeId}),
        ('Ajman', 'AJ', ${uaeId}),
        ('Umm Al Quwain', 'UQ', ${uaeId}),
        ('Ras Al Khaimah', 'RK', ${uaeId}),
        ('Fujairah', 'FU', ${uaeId})
    `);

    // ── Seed major Indian cities ─────────────────────────────────────────
    // Maharashtra
    const mhRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'MH' AND country_id = ${indiaId}`);
    const mhId = mhRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Mumbai', ${mhId}), ('Pune', ${mhId}), ('Nagpur', ${mhId}),
        ('Nashik', ${mhId}), ('Aurangabad', ${mhId}), ('Thane', ${mhId}),
        ('Navi Mumbai', ${mhId})
    `);

    // Karnataka
    const kaRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'KA' AND country_id = ${indiaId}`);
    const kaId = kaRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Bengaluru', ${kaId}), ('Mysuru', ${kaId}), ('Hubli', ${kaId}),
        ('Mangaluru', ${kaId})
    `);

    // Tamil Nadu
    const tnRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'TN' AND country_id = ${indiaId}`);
    const tnId = tnRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Chennai', ${tnId}), ('Coimbatore', ${tnId}), ('Madurai', ${tnId}),
        ('Salem', ${tnId})
    `);

    // Delhi
    const dlRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'DL' AND country_id = ${indiaId}`);
    const dlId = dlRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('New Delhi', ${dlId}), ('Delhi', ${dlId})
    `);

    // Gujarat
    const gjRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'GJ' AND country_id = ${indiaId}`);
    const gjId = gjRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Ahmedabad', ${gjId}), ('Surat', ${gjId}), ('Vadodara', ${gjId}),
        ('Rajkot', ${gjId})
    `);

    // Telangana
    const tsRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'TS' AND country_id = ${indiaId}`);
    const tsId = tsRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Hyderabad', ${tsId}), ('Warangal', ${tsId}), ('Secunderabad', ${tsId})
    `);

    // Uttar Pradesh
    const upRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'UP' AND country_id = ${indiaId}`);
    const upId = upRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Lucknow', ${upId}), ('Noida', ${upId}), ('Agra', ${upId}),
        ('Varanasi', ${upId}), ('Kanpur', ${upId}), ('Ghaziabad', ${upId})
    `);

    // Rajasthan
    const rjRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'RJ' AND country_id = ${indiaId}`);
    const rjId = rjRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Jaipur', ${rjId}), ('Jodhpur', ${rjId}), ('Udaipur', ${rjId})
    `);

    // West Bengal
    const wbRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'WB' AND country_id = ${indiaId}`);
    const wbId = wbRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Kolkata', ${wbId}), ('Howrah', ${wbId}), ('Siliguri', ${wbId})
    `);

    // Punjab
    const pbRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'PB' AND country_id = ${indiaId}`);
    const pbId = pbRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Chandigarh', ${pbId}), ('Ludhiana', ${pbId}), ('Amritsar', ${pbId})
    `);

    // Kerala
    const klRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'KL' AND country_id = ${indiaId}`);
    const klId = klRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Kochi', ${klId}), ('Thiruvananthapuram', ${klId}), ('Kozhikode', ${klId})
    `);

    // Haryana
    const hrRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'HR' AND country_id = ${indiaId}`);
    const hrId = hrRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Gurugram', ${hrId}), ('Faridabad', ${hrId}), ('Karnal', ${hrId})
    `);

    // Andhra Pradesh
    const apRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'AP' AND country_id = ${indiaId}`);
    const apId = apRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Visakhapatnam', ${apId}), ('Vijayawada', ${apId}), ('Tirupati', ${apId})
    `);

    // Madhya Pradesh
    const mpRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'MP' AND country_id = ${indiaId}`);
    const mpId = mpRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Bhopal', ${mpId}), ('Indore', ${mpId}), ('Gwalior', ${mpId})
    `);

    // Bihar
    const brRows = await queryRunner.query(`SELECT id FROM states WHERE code = 'BR' AND country_id = ${indiaId}`);
    const brId = brRows[0].id;
    await queryRunner.query(`
      INSERT INTO cities (name, state_id) VALUES
        ('Patna', ${brId}), ('Gaya', ${brId})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FKs from companies
    await queryRunner.query(`ALTER TABLE companies DROP FOREIGN KEY fk_companies_currency`);
    await queryRunner.query(`ALTER TABLE companies DROP FOREIGN KEY fk_companies_city`);
    await queryRunner.query(`ALTER TABLE companies DROP FOREIGN KEY fk_companies_state`);
    await queryRunner.query(`ALTER TABLE companies DROP FOREIGN KEY fk_companies_country`);

    // Drop new company columns
    await queryRunner.query(`
      ALTER TABLE companies
        DROP COLUMN company_code,
        DROP COLUMN country_id,
        DROP COLUMN state_id,
        DROP COLUMN city_id,
        DROP COLUMN postal_code,
        DROP COLUMN gst_number,
        DROP COLUMN pan_number,
        DROP COLUMN tax_id,
        DROP COLUMN gstin,
        DROP COLUMN tax_registration_number,
        DROP COLUMN gst_enabled,
        DROP COLUMN vat_enabled,
        DROP COLUMN base_currency_code,
        DROP COLUMN created_by,
        DROP COLUMN updated_by
    `);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS cities`);
    await queryRunner.query(`DROP TABLE IF EXISTS states`);
    await queryRunner.query(`DROP TABLE IF EXISTS countries`);
    await queryRunner.query(`DROP TABLE IF EXISTS currencies`);
  }
}
