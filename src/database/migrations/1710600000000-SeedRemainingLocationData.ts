import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRemainingLocationData1710600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cid = async (code: string) => {
      const rows = await queryRunner.query(`SELECT id FROM countries WHERE code = '${code}'`);
      return rows[0]?.id;
    };
    const sid = async (code: string, countryId: number) => {
      const rows = await queryRunner.query(`SELECT id FROM states WHERE code = '${code}' AND country_id = ${countryId}`);
      return rows[0]?.id;
    };

    // ── More missing countries ────────────────────────────────────────────
    await queryRunner.query(`
      INSERT IGNORE INTO countries (name, code, phone_code) VALUES
        ('Andorra', 'AD', '+376'),
        ('Antigua and Barbuda', 'AG', '+1268'),
        ('Bahamas', 'BS', '+1242'),
        ('Belize', 'BZ', '+501'),
        ('Cape Verde', 'CV', '+238'),
        ('Comoros', 'KM', '+269'),
        ('Congo (DRC)', 'CD', '+243'),
        ('Congo (Republic)', 'CG', '+242'),
        ('Djibouti', 'DJ', '+253'),
        ('Dominica', 'DM', '+1767'),
        ('East Timor', 'TL', '+670'),
        ('Equatorial Guinea', 'GQ', '+240'),
        ('Eritrea', 'ER', '+291'),
        ('Eswatini', 'SZ', '+268'),
        ('Gabon', 'GA', '+241'),
        ('Gambia', 'GM', '+220'),
        ('Grenada', 'GD', '+1473'),
        ('Guinea', 'GN', '+224'),
        ('Guinea-Bissau', 'GW', '+245'),
        ('Guyana', 'GY', '+592'),
        ('Kiribati', 'KI', '+686'),
        ('Kosovo', 'XK', '+383'),
        ('Kyrgyzstan', 'KG', '+996'),
        ('Lesotho', 'LS', '+266'),
        ('Liberia', 'LR', '+231'),
        ('Liechtenstein', 'LI', '+423'),
        ('Marshall Islands', 'MH', '+692'),
        ('Mauritania', 'MR', '+222'),
        ('Micronesia', 'FM', '+691'),
        ('Monaco', 'MC', '+377'),
        ('Montenegro', 'ME', '+382'),
        ('Palau', 'PW', '+680'),
        ('Rwanda', 'RW', '+250'),
        ('Saint Lucia', 'LC', '+1758'),
        ('Samoa', 'WS', '+685'),
        ('San Marino', 'SM', '+378'),
        ('Sao Tome and Principe', 'ST', '+239'),
        ('Serbia', 'RS', '+381'),
        ('Seychelles', 'SC', '+248'),
        ('Solomon Islands', 'SB', '+677'),
        ('Suriname', 'SR', '+597'),
        ('Tanzania', 'TZ', '+255'),
        ('Togo', 'TG', '+228'),
        ('Tonga', 'TO', '+676'),
        ('Uganda', 'UG', '+256'),
        ('Uruguay', 'UY', '+598'),
        ('Uzbekistan', 'UZ', '+998'),
        ('Vanuatu', 'VU', '+678'),
        ('Zambia', 'ZM', '+260'),
        ('Zimbabwe', 'ZW', '+263')
    `);

    // ── Albania ──────────────────────────────────────────────────────────
    const alId = await cid('AL');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Tirana', 'TIR', ${alId}),
        ('Durres', 'DUR', ${alId}),
        ('Vlore', 'VLO', ${alId}),
        ('Shkoder', 'SHK', ${alId})
    `);
    let stId = await sid('TIR', alId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tirana', ${stId})`);
    stId = await sid('DUR', alId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Durres', ${stId})`);
    stId = await sid('VLO', alId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Vlore', ${stId})`);

    // ── Algeria ──────────────────────────────────────────────────────────
    const dzId = await cid('DZ');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Algiers', 'ALG', ${dzId}),
        ('Oran', 'ORA', ${dzId}),
        ('Constantine', 'CON', ${dzId}),
        ('Annaba', 'ANN', ${dzId}),
        ('Blida', 'BLI', ${dzId})
    `);
    stId = await sid('ALG', dzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Algiers', ${stId})`);
    stId = await sid('ORA', dzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Oran', ${stId})`);
    stId = await sid('CON', dzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Constantine', ${stId})`);

    // ── Angola ───────────────────────────────────────────────────────────
    const aoId = await cid('AO');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Luanda', 'LUA', ${aoId}),
        ('Benguela', 'BGU', ${aoId}),
        ('Huambo', 'HUA', ${aoId}),
        ('Cabinda', 'CAB', ${aoId})
    `);
    stId = await sid('LUA', aoId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Luanda', ${stId})`);
    stId = await sid('BGU', aoId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Benguela', ${stId})`);
    stId = await sid('HUA', aoId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Huambo', ${stId})`);

    // ── Armenia ──────────────────────────────────────────────────────────
    const amId = await cid('AM');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Yerevan', 'YER', ${amId}),
        ('Ararat', 'ARA', ${amId}),
        ('Kotayk', 'KOT', ${amId})
    `);
    stId = await sid('YER', amId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Yerevan', ${stId})`);

    // ── Azerbaijan ───────────────────────────────────────────────────────
    const azId = await cid('AZ');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Baku', 'BAK', ${azId}),
        ('Ganja', 'GAN', ${azId}),
        ('Sumgait', 'SUM', ${azId})
    `);
    stId = await sid('BAK', azId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Baku', ${stId})`);
    stId = await sid('GAN', azId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ganja', ${stId})`);

    // ── Belarus ──────────────────────────────────────────────────────────
    const byId = await cid('BY');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Minsk', 'MIN', ${byId}),
        ('Gomel', 'GOM', ${byId}),
        ('Mogilev', 'MOG', ${byId}),
        ('Vitebsk', 'VIT', ${byId}),
        ('Grodno', 'GRO', ${byId}),
        ('Brest', 'BRE', ${byId})
    `);
    stId = await sid('MIN', byId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Minsk', ${stId})`);
    stId = await sid('GOM', byId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Gomel', ${stId})`);
    stId = await sid('BRE', byId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Brest', ${stId})`);

    // ── Bolivia ──────────────────────────────────────────────────────────
    const boId = await cid('BO');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('La Paz', 'LPZ', ${boId}),
        ('Santa Cruz', 'SCZ', ${boId}),
        ('Cochabamba', 'CBB', ${boId}),
        ('Sucre', 'SUC', ${boId})
    `);
    stId = await sid('LPZ', boId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('La Paz', ${stId}), ('El Alto', ${stId})`);
    stId = await sid('SCZ', boId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Santa Cruz', ${stId})`);
    stId = await sid('CBB', boId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cochabamba', ${stId})`);

    // ── Bosnia and Herzegovina ───────────────────────────────────────────
    const baId = await cid('BA');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Sarajevo Canton', 'SAR', ${baId}),
        ('Tuzla Canton', 'TUZ', ${baId}),
        ('Republika Srpska', 'SRP', ${baId})
    `);
    stId = await sid('SAR', baId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sarajevo', ${stId})`);
    stId = await sid('SRP', baId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Banja Luka', ${stId})`);

    // ── Botswana ─────────────────────────────────────────────────────────
    const bwId = await cid('BW');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('South-East', 'SE', ${bwId}),
        ('North-West', 'NW', ${bwId}),
        ('Central', 'CE', ${bwId})
    `);
    stId = await sid('SE', bwId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Gaborone', ${stId})`);
    stId = await sid('NW', bwId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Maun', ${stId})`);
    stId = await sid('CE', bwId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Francistown', ${stId})`);

    // ── Bulgaria ─────────────────────────────────────────────────────────
    const bgId = await cid('BG');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Sofia City', 'SOF', ${bgId}),
        ('Plovdiv', 'PLO', ${bgId}),
        ('Varna', 'VAR', ${bgId}),
        ('Burgas', 'BUR', ${bgId})
    `);
    stId = await sid('SOF', bgId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sofia', ${stId})`);
    stId = await sid('PLO', bgId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Plovdiv', ${stId})`);
    stId = await sid('VAR', bgId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Varna', ${stId})`);

    // ── Cameroon ─────────────────────────────────────────────────────────
    const cmId = await cid('CM');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Centre', 'CEN', ${cmId}),
        ('Littoral', 'LIT', ${cmId}),
        ('West', 'WST', ${cmId}),
        ('Southwest', 'SWE', ${cmId})
    `);
    stId = await sid('CEN', cmId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Yaounde', ${stId})`);
    stId = await sid('LIT', cmId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Douala', ${stId})`);

    // ── Costa Rica ───────────────────────────────────────────────────────
    const crId = await cid('CR');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('San Jose', 'SJO', ${crId}),
        ('Alajuela', 'ALA', ${crId}),
        ('Guanacaste', 'GUA', ${crId}),
        ('Puntarenas', 'PUN', ${crId})
    `);
    stId = await sid('SJO', crId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('San Jose', ${stId})`);

    // ── Croatia ──────────────────────────────────────────────────────────
    const hrId = await cid('HR');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Zagreb', 'ZAG', ${hrId}),
        ('Split-Dalmatia', 'SPL', ${hrId}),
        ('Istria', 'IST', ${hrId}),
        ('Dubrovnik-Neretva', 'DUB', ${hrId})
    `);
    stId = await sid('ZAG', hrId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Zagreb', ${stId})`);
    stId = await sid('SPL', hrId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Split', ${stId})`);
    stId = await sid('DUB', hrId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dubrovnik', ${stId})`);

    // ── Cuba ─────────────────────────────────────────────────────────────
    const cuId = await cid('CU');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Havana', 'HAV', ${cuId}),
        ('Santiago de Cuba', 'SCU', ${cuId}),
        ('Matanzas', 'MAT', ${cuId})
    `);
    stId = await sid('HAV', cuId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Havana', ${stId})`);
    stId = await sid('SCU', cuId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Santiago de Cuba', ${stId})`);

    // ── Cyprus ───────────────────────────────────────────────────────────
    const cyId = await cid('CY');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Nicosia', 'NIC', ${cyId}),
        ('Limassol', 'LIM', ${cyId}),
        ('Larnaca', 'LAR', ${cyId}),
        ('Paphos', 'PAP', ${cyId})
    `);
    stId = await sid('NIC', cyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Nicosia', ${stId})`);
    stId = await sid('LIM', cyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Limassol', ${stId})`);
    stId = await sid('LAR', cyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Larnaca', ${stId})`);

    // ── Dominican Republic ───────────────────────────────────────────────
    const doId = await cid('DO');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Distrito Nacional', 'DN', ${doId}),
        ('Santiago', 'STG', ${doId}),
        ('La Altagracia', 'ALT', ${doId})
    `);
    stId = await sid('DN', doId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Santo Domingo', ${stId})`);
    stId = await sid('STG', doId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Santiago', ${stId})`);
    stId = await sid('ALT', doId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Punta Cana', ${stId})`);

    // ── Ecuador ──────────────────────────────────────────────────────────
    const ecId = await cid('EC');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Pichincha', 'PIC', ${ecId}),
        ('Guayas', 'GUA', ${ecId}),
        ('Azuay', 'AZU', ${ecId}),
        ('Galapagos', 'GAL', ${ecId})
    `);
    stId = await sid('PIC', ecId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Quito', ${stId})`);
    stId = await sid('GUA', ecId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Guayaquil', ${stId})`);
    stId = await sid('AZU', ecId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cuenca', ${stId})`);

    // ── Estonia ──────────────────────────────────────────────────────────
    const eeId = await cid('EE');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Harju', 'HAR', ${eeId}),
        ('Tartu', 'TAR', ${eeId}),
        ('Parnu', 'PAR', ${eeId})
    `);
    stId = await sid('HAR', eeId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tallinn', ${stId})`);
    stId = await sid('TAR', eeId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tartu', ${stId})`);

    // ── Georgia ──────────────────────────────────────────────────────────
    const geId = await cid('GE');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Tbilisi', 'TBI', ${geId}),
        ('Adjara', 'ADJ', ${geId}),
        ('Imereti', 'IME', ${geId})
    `);
    stId = await sid('TBI', geId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tbilisi', ${stId})`);
    stId = await sid('ADJ', geId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Batumi', ${stId})`);
    stId = await sid('IME', geId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kutaisi', ${stId})`);

    // ── Guatemala ────────────────────────────────────────────────────────
    const gtId = await cid('GT');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Guatemala', 'GUA', ${gtId}),
        ('Quetzaltenango', 'QUE', ${gtId}),
        ('Sacatepequez', 'SAC', ${gtId})
    `);
    stId = await sid('GUA', gtId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Guatemala City', ${stId})`);
    stId = await sid('SAC', gtId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Antigua Guatemala', ${stId})`);

    // ── Honduras ─────────────────────────────────────────────────────────
    const hnId = await cid('HN');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Francisco Morazan', 'FRA', ${hnId}),
        ('Cortes', 'COR', ${hnId}),
        ('Atlantida', 'ATL', ${hnId})
    `);
    stId = await sid('FRA', hnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tegucigalpa', ${stId})`);
    stId = await sid('COR', hnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('San Pedro Sula', ${stId})`);

    // ── Latvia ───────────────────────────────────────────────────────────
    const lvId = await cid('LV');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Riga', 'RIG', ${lvId}),
        ('Vidzeme', 'VID', ${lvId}),
        ('Kurzeme', 'KUR', ${lvId})
    `);
    stId = await sid('RIG', lvId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Riga', ${stId})`);

    // ── Lithuania ────────────────────────────────────────────────────────
    const ltId = await cid('LT');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Vilnius', 'VIL', ${ltId}),
        ('Kaunas', 'KAU', ${ltId}),
        ('Klaipeda', 'KLA', ${ltId})
    `);
    stId = await sid('VIL', ltId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Vilnius', ${stId})`);
    stId = await sid('KAU', ltId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kaunas', ${stId})`);

    // ── Libya ────────────────────────────────────────────────────────────
    const lyId = await cid('LY');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Tripoli', 'TRI', ${lyId}),
        ('Benghazi', 'BEN', ${lyId}),
        ('Misrata', 'MIS', ${lyId})
    `);
    stId = await sid('TRI', lyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tripoli', ${stId})`);
    stId = await sid('BEN', lyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Benghazi', ${stId})`);

    // ── Malta ────────────────────────────────────────────────────────────
    const mtId = await cid('MT');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Malta', 'MLT', ${mtId}),
        ('Gozo', 'GOZ', ${mtId})
    `);
    stId = await sid('MLT', mtId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Valletta', ${stId}), ('Sliema', ${stId}), ('St Julians', ${stId})`);

    // ── Mauritius ────────────────────────────────────────────────────────
    const muId = await cid('MU');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Port Louis', 'PL', ${muId}),
        ('Plaines Wilhems', 'PW', ${muId}),
        ('Riviere du Rempart', 'RR', ${muId})
    `);
    stId = await sid('PL', muId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Port Louis', ${stId})`);
    stId = await sid('PW', muId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Quatre Bornes', ${stId}), ('Rose Hill', ${stId})`);

    // ── Moldova ──────────────────────────────────────────────────────────
    const mdId = await cid('MD');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Chisinau', 'CHS', ${mdId}),
        ('Balti', 'BAL', ${mdId})
    `);
    stId = await sid('CHS', mdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Chisinau', ${stId})`);

    // ── Mozambique ───────────────────────────────────────────────────────
    const mzId = await cid('MZ');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Maputo', 'MAP', ${mzId}),
        ('Sofala', 'SOF', ${mzId}),
        ('Inhambane', 'INH', ${mzId})
    `);
    stId = await sid('MAP', mzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Maputo', ${stId})`);
    stId = await sid('SOF', mzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Beira', ${stId})`);

    // ── Namibia ──────────────────────────────────────────────────────────
    const naId = await cid('NA');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Khomas', 'KHO', ${naId}),
        ('Erongo', 'ERO', ${naId}),
        ('Oshana', 'OSH', ${naId})
    `);
    stId = await sid('KHO', naId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Windhoek', ${stId})`);
    stId = await sid('ERO', naId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Walvis Bay', ${stId}), ('Swakopmund', ${stId})`);

    // ── Nicaragua ────────────────────────────────────────────────────────
    const niId = await cid('NI');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Managua', 'MAN', ${niId}),
        ('Leon', 'LEO', ${niId}),
        ('Granada', 'GRA', ${niId})
    `);
    stId = await sid('MAN', niId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Managua', ${stId})`);

    // ── North Macedonia ──────────────────────────────────────────────────
    const mkId = await cid('MK');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Skopje', 'SKP', ${mkId}),
        ('Bitola', 'BIT', ${mkId}),
        ('Ohrid', 'OHR', ${mkId})
    `);
    stId = await sid('SKP', mkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Skopje', ${stId})`);
    stId = await sid('OHR', mkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ohrid', ${stId})`);

    // ── Panama ───────────────────────────────────────────────────────────
    const paId = await cid('PA');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Panama', 'PAN', ${paId}),
        ('Colon', 'COL', ${paId}),
        ('Chiriqui', 'CHI', ${paId})
    `);
    stId = await sid('PAN', paId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Panama City', ${stId})`);

    // ── Paraguay ─────────────────────────────────────────────────────────
    const pyId = await cid('PY');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Asuncion', 'ASU', ${pyId}),
        ('Central', 'CEN', ${pyId}),
        ('Alto Parana', 'APR', ${pyId})
    `);
    stId = await sid('ASU', pyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Asuncion', ${stId})`);
    stId = await sid('APR', pyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ciudad del Este', ${stId})`);

    // ── Senegal ──────────────────────────────────────────────────────────
    const snId = await cid('SN');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Dakar', 'DAK', ${snId}),
        ('Thies', 'THI', ${snId}),
        ('Saint-Louis', 'STL', ${snId})
    `);
    stId = await sid('DAK', snId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dakar', ${stId})`);

    // ── Slovakia ─────────────────────────────────────────────────────────
    const skId = await cid('SK');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Bratislava', 'BRA', ${skId}),
        ('Kosice', 'KOS', ${skId}),
        ('Zilina', 'ZIL', ${skId})
    `);
    stId = await sid('BRA', skId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bratislava', ${stId})`);
    stId = await sid('KOS', skId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kosice', ${stId})`);

    // ── Slovenia ─────────────────────────────────────────────────────────
    const siId = await cid('SI');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Ljubljana', 'LJU', ${siId}),
        ('Maribor', 'MAR', ${siId}),
        ('Coastal-Karst', 'COK', ${siId})
    `);
    stId = await sid('LJU', siId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ljubljana', ${stId})`);
    stId = await sid('MAR', siId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Maribor', ${stId})`);

    // ── Somalia ──────────────────────────────────────────────────────────
    const soId = await cid('SO');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Banaadir', 'BAN', ${soId}),
        ('Puntland', 'PUN', ${soId})
    `);
    stId = await sid('BAN', soId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Mogadishu', ${stId})`);

    // ── Tunisia ──────────────────────────────────────────────────────────
    const tnId = await cid('TN');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Tunis', 'TUN', ${tnId}),
        ('Sfax', 'SFX', ${tnId}),
        ('Sousse', 'SOU', ${tnId})
    `);
    stId = await sid('TUN', tnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tunis', ${stId})`);
    stId = await sid('SFX', tnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sfax', ${stId})`);

    // ── New countries: Tanzania ──────────────────────────────────────────
    const tzId = await cid('TZ');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Dar es Salaam', 'DAR', ${tzId}),
        ('Dodoma', 'DOD', ${tzId}),
        ('Zanzibar', 'ZAN', ${tzId}),
        ('Arusha', 'ARU', ${tzId})
    `);
    stId = await sid('DAR', tzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dar es Salaam', ${stId})`);
    stId = await sid('DOD', tzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dodoma', ${stId})`);
    stId = await sid('ZAN', tzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Zanzibar City', ${stId})`);
    stId = await sid('ARU', tzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Arusha', ${stId})`);

    // ── Uganda ───────────────────────────────────────────────────────────
    const ugId = await cid('UG');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Central', 'CEN', ${ugId}),
        ('Western', 'WST', ${ugId}),
        ('Eastern', 'EST', ${ugId}),
        ('Northern', 'NOR', ${ugId})
    `);
    stId = await sid('CEN', ugId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kampala', ${stId}), ('Entebbe', ${stId})`);

    // ── Uruguay ──────────────────────────────────────────────────────────
    const uyId = await cid('UY');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Montevideo', 'MON', ${uyId}),
        ('Canelones', 'CAN', ${uyId}),
        ('Maldonado', 'MAL', ${uyId})
    `);
    stId = await sid('MON', uyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Montevideo', ${stId})`);
    stId = await sid('MAL', uyId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Punta del Este', ${stId})`);

    // ── Uzbekistan ───────────────────────────────────────────────────────
    const uzId = await cid('UZ');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Tashkent', 'TAS', ${uzId}),
        ('Samarkand', 'SAM', ${uzId}),
        ('Bukhara', 'BUK', ${uzId})
    `);
    stId = await sid('TAS', uzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tashkent', ${stId})`);
    stId = await sid('SAM', uzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Samarkand', ${stId})`);
    stId = await sid('BUK', uzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bukhara', ${stId})`);

    // ── Zambia ───────────────────────────────────────────────────────────
    const zmId = await cid('ZM');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Lusaka', 'LUS', ${zmId}),
        ('Copperbelt', 'COP', ${zmId}),
        ('Southern', 'SOU', ${zmId})
    `);
    stId = await sid('LUS', zmId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Lusaka', ${stId})`);
    stId = await sid('COP', zmId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ndola', ${stId}), ('Kitwe', ${stId})`);

    // ── Zimbabwe ─────────────────────────────────────────────────────────
    const zwId = await cid('ZW');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Harare', 'HAR', ${zwId}),
        ('Bulawayo', 'BUL', ${zwId}),
        ('Manicaland', 'MAN', ${zwId})
    `);
    stId = await sid('HAR', zwId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Harare', ${stId})`);
    stId = await sid('BUL', zwId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bulawayo', ${stId})`);

    // ── Rwanda ───────────────────────────────────────────────────────────
    const rwId = await cid('RW');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Kigali', 'KIG', ${rwId}),
        ('Eastern', 'EST', ${rwId}),
        ('Western', 'WST', ${rwId})
    `);
    stId = await sid('KIG', rwId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kigali', ${stId})`);

    // ── Serbia ───────────────────────────────────────────────────────────
    const rsId = await cid('RS');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Belgrade', 'BEG', ${rsId}),
        ('Vojvodina', 'VOJ', ${rsId}),
        ('Nis', 'NIS', ${rsId})
    `);
    stId = await sid('BEG', rsId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Belgrade', ${stId})`);
    stId = await sid('VOJ', rsId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Novi Sad', ${stId})`);
    stId = await sid('NIS', rsId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Nis', ${stId})`);

    // ── Montenegro ───────────────────────────────────────────────────────
    const meId = await cid('ME');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Podgorica', 'POD', ${meId}),
        ('Coastal', 'CST', ${meId})
    `);
    stId = await sid('POD', meId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Podgorica', ${stId})`);
    stId = await sid('CST', meId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Budva', ${stId}), ('Kotor', ${stId})`);

    // ── Kosovo ───────────────────────────────────────────────────────────
    const xkId = await cid('XK');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Pristina', 'PRI', ${xkId}),
        ('Prizren', 'PRZ', ${xkId})
    `);
    stId = await sid('PRI', xkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Pristina', ${stId})`);
    stId = await sid('PRZ', xkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Prizren', ${stId})`);

    // ── Congo (DRC) ─────────────────────────────────────────────────────
    const cdId = await cid('CD');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Kinshasa', 'KIN', ${cdId}),
        ('Haut-Katanga', 'HKA', ${cdId}),
        ('North Kivu', 'NKV', ${cdId})
    `);
    stId = await sid('KIN', cdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kinshasa', ${stId})`);
    stId = await sid('HKA', cdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Lubumbashi', ${stId})`);

    // ── Kyrgyzstan ───────────────────────────────────────────────────────
    const kgId = await cid('KG');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Bishkek', 'BIS', ${kgId}),
        ('Osh', 'OSH', ${kgId}),
        ('Issyk-Kul', 'ISK', ${kgId})
    `);
    stId = await sid('BIS', kgId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bishkek', ${stId})`);
    stId = await sid('OSH', kgId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Osh', ${stId})`);

    // ── More currencies ──────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO currencies (code, name, symbol) VALUES
        ('BOB', 'Bolivian Boliviano', 'Bs'),
        ('PYG', 'Paraguayan Guarani', 'Gs'),
        ('UYU', 'Uruguayan Peso', '$U'),
        ('PEN', 'Peruvian Sol', 'S/'),
        ('GEL', 'Georgian Lari', 'GEL'),
        ('AMD', 'Armenian Dram', 'AMD'),
        ('AZN', 'Azerbaijani Manat', 'AZN'),
        ('BYN', 'Belarusian Ruble', 'Br'),
        ('BGN', 'Bulgarian Lev', 'лв'),
        ('HRK', 'Croatian Kuna', 'kn'),
        ('RSD', 'Serbian Dinar', 'din'),
        ('BAM', 'Bosnia Mark', 'KM'),
        ('MKD', 'Macedonian Denar', 'ден'),
        ('ALL', 'Albanian Lek', 'L'),
        ('DZD', 'Algerian Dinar', 'DA'),
        ('TND', 'Tunisian Dinar', 'DT'),
        ('UZS', 'Uzbekistani Som', 'som'),
        ('KGS', 'Kyrgyzstani Som', 'som'),
        ('TZS', 'Tanzanian Shilling', 'TSh'),
        ('UGX', 'Ugandan Shilling', 'USh'),
        ('RWF', 'Rwandan Franc', 'FRw'),
        ('ZMW', 'Zambian Kwacha', 'ZK'),
        ('BWP', 'Botswana Pula', 'P'),
        ('NAD', 'Namibian Dollar', 'N$'),
        ('MUR', 'Mauritian Rupee', 'Rs')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Seed-only migration — parent migration handles full cleanup
  }
}
