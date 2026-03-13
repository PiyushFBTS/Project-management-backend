import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedEvenMoreLocationData1710500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cid = async (code: string) => {
      const rows = await queryRunner.query(`SELECT id FROM countries WHERE code = '${code}'`);
      return rows[0]?.id;
    };
    const sid = async (code: string, countryId: number) => {
      const rows = await queryRunner.query(`SELECT id FROM states WHERE code = '${code}' AND country_id = ${countryId}`);
      return rows[0]?.id;
    };

    // ── Even more countries ──────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO countries (name, code, phone_code) VALUES
        ('Albania', 'AL', '+355'),
        ('Algeria', 'DZ', '+213'),
        ('Angola', 'AO', '+244'),
        ('Armenia', 'AM', '+374'),
        ('Azerbaijan', 'AZ', '+994'),
        ('Barbados', 'BB', '+1246'),
        ('Belarus', 'BY', '+375'),
        ('Benin', 'BJ', '+229'),
        ('Bolivia', 'BO', '+591'),
        ('Bosnia and Herzegovina', 'BA', '+387'),
        ('Botswana', 'BW', '+267'),
        ('Brunei', 'BN', '+673'),
        ('Bulgaria', 'BG', '+359'),
        ('Burkina Faso', 'BF', '+226'),
        ('Cameroon', 'CM', '+237'),
        ('Costa Rica', 'CR', '+506'),
        ('Croatia', 'HR', '+385'),
        ('Cuba', 'CU', '+53'),
        ('Cyprus', 'CY', '+357'),
        ('Dominican Republic', 'DO', '+1809'),
        ('Ecuador', 'EC', '+593'),
        ('El Salvador', 'SV', '+503'),
        ('Estonia', 'EE', '+372'),
        ('Fiji', 'FJ', '+679'),
        ('Georgia', 'GE', '+995'),
        ('Guatemala', 'GT', '+502'),
        ('Haiti', 'HT', '+509'),
        ('Honduras', 'HN', '+504'),
        ('Ivory Coast', 'CI', '+225'),
        ('Latvia', 'LV', '+371'),
        ('Libya', 'LY', '+218'),
        ('Lithuania', 'LT', '+370'),
        ('Madagascar', 'MG', '+261'),
        ('Malawi', 'MW', '+265'),
        ('Mali', 'ML', '+223'),
        ('Malta', 'MT', '+356'),
        ('Mauritius', 'MU', '+230'),
        ('Moldova', 'MD', '+373'),
        ('Mozambique', 'MZ', '+258'),
        ('Namibia', 'NA', '+264'),
        ('Nicaragua', 'NI', '+505'),
        ('North Macedonia', 'MK', '+389'),
        ('Panama', 'PA', '+507'),
        ('Papua New Guinea', 'PG', '+675'),
        ('Paraguay', 'PY', '+595'),
        ('Senegal', 'SN', '+221'),
        ('Sierra Leone', 'SL', '+232'),
        ('Slovakia', 'SK', '+421'),
        ('Slovenia', 'SI', '+386'),
        ('Somalia', 'SO', '+252'),
        ('Sudan', 'SD', '+249'),
        ('Syria', 'SY', '+963'),
        ('Tajikistan', 'TJ', '+992'),
        ('Trinidad and Tobago', 'TT', '+1868'),
        ('Tunisia', 'TN', '+216'),
        ('Turkmenistan', 'TM', '+993'),
        ('Yemen', 'YE', '+967')
    `);

    // ── Italy regions & cities ────────────────────────────────────────────
    const itId = await cid('IT');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Lombardy', 'LOM', ${itId}),
        ('Lazio', 'LAZ', ${itId}),
        ('Campania', 'CAM', ${itId}),
        ('Veneto', 'VEN', ${itId}),
        ('Piedmont', 'PIE', ${itId}),
        ('Emilia-Romagna', 'EMR', ${itId}),
        ('Tuscany', 'TOS', ${itId}),
        ('Sicily', 'SIC', ${itId}),
        ('Sardinia', 'SAR', ${itId})
    `);
    let stId = await sid('LOM', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Milan', ${stId}), ('Bergamo', ${stId}), ('Brescia', ${stId}), ('Como', ${stId})`);
    stId = await sid('LAZ', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Rome', ${stId}), ('Latina', ${stId})`);
    stId = await sid('CAM', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Naples', ${stId}), ('Salerno', ${stId})`);
    stId = await sid('VEN', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Venice', ${stId}), ('Verona', ${stId}), ('Padua', ${stId})`);
    stId = await sid('PIE', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Turin', ${stId})`);
    stId = await sid('EMR', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bologna', ${stId}), ('Parma', ${stId}), ('Modena', ${stId})`);
    stId = await sid('TOS', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Florence', ${stId}), ('Pisa', ${stId}), ('Siena', ${stId})`);
    stId = await sid('SIC', itId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Palermo', ${stId}), ('Catania', ${stId})`);

    // ── Spain communities & cities ────────────────────────────────────────
    const esId = await cid('ES');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Madrid', 'MAD', ${esId}),
        ('Catalonia', 'CAT', ${esId}),
        ('Andalusia', 'AND', ${esId}),
        ('Valencia', 'VAL', ${esId}),
        ('Basque Country', 'PVS', ${esId}),
        ('Galicia', 'GAL', ${esId}),
        ('Canary Islands', 'CAN', ${esId}),
        ('Castile and Leon', 'CYL', ${esId})
    `);
    stId = await sid('MAD', esId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Madrid', ${stId}), ('Alcala de Henares', ${stId})`);
    stId = await sid('CAT', esId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Barcelona', ${stId}), ('Girona', ${stId}), ('Tarragona', ${stId})`);
    stId = await sid('AND', esId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Seville', ${stId}), ('Malaga', ${stId}), ('Granada', ${stId}), ('Cordoba', ${stId})`);
    stId = await sid('VAL', esId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Valencia', ${stId}), ('Alicante', ${stId})`);
    stId = await sid('PVS', esId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bilbao', ${stId}), ('San Sebastian', ${stId})`);

    // ── Netherlands provinces & cities ─────────────────────────────────────
    const nlCountryId = await cid('NL');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('North Holland', 'NH', ${nlCountryId}),
        ('South Holland', 'ZH', ${nlCountryId}),
        ('Utrecht', 'UT', ${nlCountryId}),
        ('North Brabant', 'NB', ${nlCountryId}),
        ('Gelderland', 'GE', ${nlCountryId}),
        ('Limburg', 'LI', ${nlCountryId})
    `);
    stId = await sid('NH', nlCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Amsterdam', ${stId}), ('Haarlem', ${stId})`);
    stId = await sid('ZH', nlCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Rotterdam', ${stId}), ('The Hague', ${stId}), ('Leiden', ${stId})`);
    stId = await sid('UT', nlCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Utrecht', ${stId})`);
    stId = await sid('NB', nlCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Eindhoven', ${stId}), ('Tilburg', ${stId}), ('Breda', ${stId})`);

    // ── Switzerland cantons & cities ───────────────────────────────────────
    const chId = await cid('CH');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Zurich', 'ZH', ${chId}),
        ('Bern', 'BE', ${chId}),
        ('Geneva', 'GE', ${chId}),
        ('Basel-Stadt', 'BS', ${chId}),
        ('Vaud', 'VD', ${chId}),
        ('Ticino', 'TI', ${chId})
    `);
    stId = await sid('ZH', chId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Zurich', ${stId}), ('Winterthur', ${stId})`);
    stId = await sid('BE', chId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bern', ${stId})`);
    stId = await sid('GE', chId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Geneva', ${stId})`);
    stId = await sid('BS', chId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Basel', ${stId})`);
    stId = await sid('VD', chId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Lausanne', ${stId})`);

    // ── New Zealand regions & cities ──────────────────────────────────────
    const nzId = await cid('NZ');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Auckland', 'AUK', ${nzId}),
        ('Wellington', 'WGN', ${nzId}),
        ('Canterbury', 'CAN', ${nzId}),
        ('Otago', 'OTA', ${nzId}),
        ('Waikato', 'WKO', ${nzId}),
        ('Bay of Plenty', 'BOP', ${nzId})
    `);
    stId = await sid('AUK', nzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Auckland', ${stId}), ('Manukau', ${stId})`);
    stId = await sid('WGN', nzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Wellington', ${stId}), ('Lower Hutt', ${stId})`);
    stId = await sid('CAN', nzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Christchurch', ${stId})`);
    stId = await sid('OTA', nzId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dunedin', ${stId}), ('Queenstown', ${stId})`);

    // ── South Korea provinces & cities ─────────────────────────────────────
    const krId = await cid('KR');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Seoul', 'SEO', ${krId}),
        ('Busan', 'BUS', ${krId}),
        ('Incheon', 'INC', ${krId}),
        ('Daegu', 'DAG', ${krId}),
        ('Gyeonggi', 'GYG', ${krId}),
        ('Jeju', 'JEJ', ${krId})
    `);
    stId = await sid('SEO', krId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Seoul', ${stId}), ('Gangnam', ${stId})`);
    stId = await sid('BUS', krId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Busan', ${stId})`);
    stId = await sid('INC', krId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Incheon', ${stId})`);
    stId = await sid('GYG', krId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Suwon', ${stId}), ('Seongnam', ${stId})`);
    stId = await sid('JEJ', krId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Jeju City', ${stId})`);

    // ── Thailand provinces & cities ────────────────────────────────────────
    const thId = await cid('TH');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Bangkok', 'BKK', ${thId}),
        ('Chiang Mai', 'CMI', ${thId}),
        ('Phuket', 'PKT', ${thId}),
        ('Chonburi', 'CBI', ${thId}),
        ('Krabi', 'KBI', ${thId}),
        ('Surat Thani', 'SNI', ${thId})
    `);
    stId = await sid('BKK', thId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bangkok', ${stId})`);
    stId = await sid('CMI', thId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Chiang Mai', ${stId})`);
    stId = await sid('PKT', thId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Phuket', ${stId}), ('Patong', ${stId})`);
    stId = await sid('CBI', thId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Pattaya', ${stId})`);

    // ── Vietnam provinces & cities ─────────────────────────────────────────
    const vnId = await cid('VN');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Ho Chi Minh City', 'HCM', ${vnId}),
        ('Hanoi', 'HAN', ${vnId}),
        ('Da Nang', 'DAD', ${vnId}),
        ('Hai Phong', 'HPG', ${vnId}),
        ('Can Tho', 'CTO', ${vnId})
    `);
    stId = await sid('HCM', vnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ho Chi Minh City', ${stId}), ('Thu Duc', ${stId})`);
    stId = await sid('HAN', vnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Hanoi', ${stId})`);
    stId = await sid('DAD', vnId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Da Nang', ${stId})`);

    // ── Indonesia provinces & cities ───────────────────────────────────────
    const idId = await cid('ID');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Jakarta', 'JKT', ${idId}),
        ('West Java', 'JBR', ${idId}),
        ('East Java', 'JTM', ${idId}),
        ('Central Java', 'JTG', ${idId}),
        ('Bali', 'BAL', ${idId}),
        ('North Sumatra', 'SMU', ${idId})
    `);
    stId = await sid('JKT', idId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Jakarta', ${stId})`);
    stId = await sid('JBR', idId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bandung', ${stId}), ('Bogor', ${stId}), ('Bekasi', ${stId})`);
    stId = await sid('JTM', idId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Surabaya', ${stId}), ('Malang', ${stId})`);
    stId = await sid('BAL', idId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Denpasar', ${stId}), ('Ubud', ${stId})`);
    stId = await sid('SMU', idId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Medan', ${stId})`);

    // ── Philippines regions & cities ───────────────────────────────────────
    const phId = await cid('PH');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Metro Manila', 'NCR', ${phId}),
        ('Cebu', 'CEB', ${phId}),
        ('Davao', 'DAV', ${phId}),
        ('Calabarzon', 'CLB', ${phId}),
        ('Central Luzon', 'CLN', ${phId})
    `);
    stId = await sid('NCR', phId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Manila', ${stId}), ('Quezon City', ${stId}), ('Makati', ${stId}), ('Taguig', ${stId})`);
    stId = await sid('CEB', phId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cebu City', ${stId}), ('Lapu-Lapu', ${stId})`);
    stId = await sid('DAV', phId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Davao City', ${stId})`);

    // ── Malaysia states & cities ───────────────────────────────────────────
    const myId = await cid('MY');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Kuala Lumpur', 'KUL', ${myId}),
        ('Selangor', 'SGR', ${myId}),
        ('Penang', 'PNG', ${myId}),
        ('Johor', 'JHR', ${myId}),
        ('Sabah', 'SBH', ${myId}),
        ('Sarawak', 'SRW', ${myId})
    `);
    stId = await sid('KUL', myId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kuala Lumpur', ${stId})`);
    stId = await sid('SGR', myId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Shah Alam', ${stId}), ('Petaling Jaya', ${stId}), ('Subang Jaya', ${stId})`);
    stId = await sid('PNG', myId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('George Town', ${stId}), ('Butterworth', ${stId})`);
    stId = await sid('JHR', myId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Johor Bahru', ${stId})`);

    // ── Bangladesh divisions & cities ──────────────────────────────────────
    const bdId = await cid('BD');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Dhaka', 'DHK', ${bdId}),
        ('Chittagong', 'CTG', ${bdId}),
        ('Rajshahi', 'RAJ', ${bdId}),
        ('Khulna', 'KHL', ${bdId}),
        ('Sylhet', 'SYL', ${bdId}),
        ('Rangpur', 'RNG', ${bdId}),
        ('Barisal', 'BAR', ${bdId}),
        ('Mymensingh', 'MYM', ${bdId})
    `);
    stId = await sid('DHK', bdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dhaka', ${stId}), ('Gazipur', ${stId}), ('Narayanganj', ${stId})`);
    stId = await sid('CTG', bdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Chittagong', ${stId}), ('Comilla', ${stId})`);
    stId = await sid('RAJ', bdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Rajshahi', ${stId})`);
    stId = await sid('KHL', bdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Khulna', ${stId})`);
    stId = await sid('SYL', bdId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sylhet', ${stId})`);

    // ── Pakistan provinces & cities ────────────────────────────────────────
    const pkId = await cid('PK');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Punjab', 'PJB', ${pkId}),
        ('Sindh', 'SND', ${pkId}),
        ('Khyber Pakhtunkhwa', 'KPK', ${pkId}),
        ('Balochistan', 'BLN', ${pkId}),
        ('Islamabad Capital Territory', 'ICT', ${pkId})
    `);
    stId = await sid('PJB', pkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Lahore', ${stId}), ('Faisalabad', ${stId}), ('Rawalpindi', ${stId}), ('Multan', ${stId})`);
    stId = await sid('SND', pkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Karachi', ${stId}), ('Hyderabad', ${stId}), ('Sukkur', ${stId})`);
    stId = await sid('KPK', pkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Peshawar', ${stId}), ('Abbottabad', ${stId})`);
    stId = await sid('ICT', pkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Islamabad', ${stId})`);

    // ── Sri Lanka provinces & cities ───────────────────────────────────────
    const lkId = await cid('LK');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Western', 'WP', ${lkId}),
        ('Central', 'CP', ${lkId}),
        ('Southern', 'SP', ${lkId}),
        ('Northern', 'NP', ${lkId}),
        ('Eastern', 'EP', ${lkId})
    `);
    stId = await sid('WP', lkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Colombo', ${stId}), ('Sri Jayawardenepura Kotte', ${stId}), ('Negombo', ${stId})`);
    stId = await sid('CP', lkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kandy', ${stId}), ('Nuwara Eliya', ${stId})`);
    stId = await sid('SP', lkId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Galle', ${stId}), ('Matara', ${stId})`);

    // ── Nepal provinces & cities ───────────────────────────────────────────
    const npId = await cid('NP');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Bagmati', 'BAG', ${npId}),
        ('Gandaki', 'GAN', ${npId}),
        ('Lumbini', 'LUM', ${npId}),
        ('Koshi', 'KOS', ${npId}),
        ('Madhesh', 'MAD', ${npId})
    `);
    stId = await sid('BAG', npId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kathmandu', ${stId}), ('Lalitpur', ${stId}), ('Bhaktapur', ${stId})`);
    stId = await sid('GAN', npId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Pokhara', ${stId})`);
    stId = await sid('LUM', npId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Butwal', ${stId}), ('Lumbini', ${stId})`);

    // ── Mexico states & cities ─────────────────────────────────────────────
    const mxId = await cid('MX');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Mexico City', 'CMX', ${mxId}),
        ('Jalisco', 'JAL', ${mxId}),
        ('Nuevo Leon', 'NLE', ${mxId}),
        ('Quintana Roo', 'ROO', ${mxId}),
        ('Yucatan', 'YUC', ${mxId}),
        ('Puebla', 'PUE', ${mxId}),
        ('Guanajuato', 'GUA', ${mxId}),
        ('Baja California', 'BCN', ${mxId})
    `);
    stId = await sid('CMX', mxId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Mexico City', ${stId})`);
    stId = await sid('JAL', mxId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Guadalajara', ${stId}), ('Puerto Vallarta', ${stId})`);
    stId = await sid('NLE', mxId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Monterrey', ${stId})`);
    stId = await sid('ROO', mxId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cancun', ${stId}), ('Playa del Carmen', ${stId})`);
    stId = await sid('YUC', mxId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Merida', ${stId})`);

    // ── Brazil states & cities ─────────────────────────────────────────────
    const brId = await cid('BR');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Sao Paulo', 'SP', ${brId}),
        ('Rio de Janeiro', 'RJ', ${brId}),
        ('Minas Gerais', 'MG', ${brId}),
        ('Bahia', 'BA', ${brId}),
        ('Parana', 'PR', ${brId}),
        ('Rio Grande do Sul', 'RS', ${brId}),
        ('Federal District', 'DF', ${brId}),
        ('Ceara', 'CE', ${brId})
    `);
    stId = await sid('SP', brId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sao Paulo', ${stId}), ('Campinas', ${stId}), ('Santos', ${stId})`);
    stId = await sid('RJ', brId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Rio de Janeiro', ${stId}), ('Niteroi', ${stId})`);
    stId = await sid('MG', brId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Belo Horizonte', ${stId}), ('Uberlandia', ${stId})`);
    stId = await sid('BA', brId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Salvador', ${stId})`);
    stId = await sid('DF', brId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Brasilia', ${stId})`);
    stId = await sid('RS', brId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Porto Alegre', ${stId})`);

    // ── South Africa provinces & cities ────────────────────────────────────
    const zaId = await cid('ZA');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Gauteng', 'GP', ${zaId}),
        ('Western Cape', 'WC', ${zaId}),
        ('KwaZulu-Natal', 'KZN', ${zaId}),
        ('Eastern Cape', 'EC', ${zaId}),
        ('Free State', 'FS', ${zaId})
    `);
    stId = await sid('GP', zaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Johannesburg', ${stId}), ('Pretoria', ${stId}), ('Sandton', ${stId}), ('Soweto', ${stId})`);
    stId = await sid('WC', zaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cape Town', ${stId}), ('Stellenbosch', ${stId})`);
    stId = await sid('KZN', zaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Durban', ${stId}), ('Pietermaritzburg', ${stId})`);

    // ── Nigeria states & cities ────────────────────────────────────────────
    const ngId = await cid('NG');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Lagos', 'LA', ${ngId}),
        ('Abuja FCT', 'FC', ${ngId}),
        ('Rivers', 'RI', ${ngId}),
        ('Kano', 'KN', ${ngId}),
        ('Oyo', 'OY', ${ngId}),
        ('Enugu', 'EN', ${ngId})
    `);
    stId = await sid('LA', ngId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Lagos', ${stId}), ('Ikeja', ${stId}), ('Victoria Island', ${stId})`);
    stId = await sid('FC', ngId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Abuja', ${stId})`);
    stId = await sid('RI', ngId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Port Harcourt', ${stId})`);
    stId = await sid('KN', ngId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kano', ${stId})`);

    // ── Kenya counties & cities ────────────────────────────────────────────
    const keId = await cid('KE');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Nairobi', 'NBO', ${keId}),
        ('Mombasa', 'MBA', ${keId}),
        ('Kisumu', 'KSM', ${keId}),
        ('Nakuru', 'NKR', ${keId})
    `);
    stId = await sid('NBO', keId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Nairobi', ${stId})`);
    stId = await sid('MBA', keId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Mombasa', ${stId})`);

    // ── Egypt governorates & cities ────────────────────────────────────────
    const egId = await cid('EG');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Cairo', 'CAI', ${egId}),
        ('Giza', 'GIZ', ${egId}),
        ('Alexandria', 'ALX', ${egId}),
        ('Luxor', 'LXR', ${egId}),
        ('Red Sea', 'RED', ${egId})
    `);
    stId = await sid('CAI', egId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cairo', ${stId})`);
    stId = await sid('GIZ', egId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Giza', ${stId})`);
    stId = await sid('ALX', egId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Alexandria', ${stId})`);
    stId = await sid('LXR', egId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Luxor', ${stId})`);
    stId = await sid('RED', egId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Hurghada', ${stId}), ('Sharm El Sheikh', ${stId})`);

    // ── Turkey provinces & cities ──────────────────────────────────────────
    const trId = await cid('TR');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Istanbul', 'IST', ${trId}),
        ('Ankara', 'ANK', ${trId}),
        ('Izmir', 'IZM', ${trId}),
        ('Antalya', 'ANT', ${trId}),
        ('Bursa', 'BUR', ${trId})
    `);
    stId = await sid('IST', trId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Istanbul', ${stId})`);
    stId = await sid('ANK', trId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ankara', ${stId})`);
    stId = await sid('IZM', trId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Izmir', ${stId})`);
    stId = await sid('ANT', trId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Antalya', ${stId})`);

    // ── Ireland provinces & cities ─────────────────────────────────────────
    const ieId = await cid('IE');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Leinster', 'LEN', ${ieId}),
        ('Munster', 'MUN', ${ieId}),
        ('Connacht', 'CON', ${ieId}),
        ('Ulster', 'ULS', ${ieId})
    `);
    stId = await sid('LEN', ieId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dublin', ${stId}), ('Kilkenny', ${stId})`);
    stId = await sid('MUN', ieId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cork', ${stId}), ('Limerick', ${stId}), ('Waterford', ${stId})`);
    stId = await sid('CON', ieId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Galway', ${stId})`);

    // ── Poland provinces & cities ──────────────────────────────────────────
    const plId = await cid('PL');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Masovia', 'MAS', ${plId}),
        ('Lesser Poland', 'MLP', ${plId}),
        ('Silesia', 'SIL', ${plId}),
        ('Greater Poland', 'WLK', ${plId}),
        ('Pomerania', 'POM', ${plId}),
        ('Lower Silesia', 'DLS', ${plId})
    `);
    stId = await sid('MAS', plId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Warsaw', ${stId})`);
    stId = await sid('MLP', plId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Krakow', ${stId})`);
    stId = await sid('SIL', plId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Katowice', ${stId})`);
    stId = await sid('WLK', plId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Poznan', ${stId})`);
    stId = await sid('POM', plId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Gdansk', ${stId})`);
    stId = await sid('DLS', plId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Wroclaw', ${stId})`);

    // ── More currencies ──────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO currencies (code, name, symbol) VALUES
        ('KRW', 'South Korean Won', '\u20A9'),
        ('THB', 'Thai Baht', '\u0E3F'),
        ('VND', 'Vietnamese Dong', '\u20AB'),
        ('IDR', 'Indonesian Rupiah', 'Rp'),
        ('PHP', 'Philippine Peso', '\u20B1'),
        ('PKR', 'Pakistani Rupee', 'Rs'),
        ('BDT', 'Bangladeshi Taka', '\u09F3'),
        ('LKR', 'Sri Lankan Rupee', 'Rs'),
        ('NPR', 'Nepalese Rupee', 'Rs'),
        ('MXN', 'Mexican Peso', '$'),
        ('ARS', 'Argentine Peso', '$'),
        ('CLP', 'Chilean Peso', '$'),
        ('COP', 'Colombian Peso', '$'),
        ('TRY', 'Turkish Lira', '\u20BA'),
        ('PLN', 'Polish Zloty', 'z\u0142'),
        ('SEK', 'Swedish Krona', 'kr'),
        ('NOK', 'Norwegian Krone', 'kr'),
        ('DKK', 'Danish Krone', 'kr'),
        ('HUF', 'Hungarian Forint', 'Ft'),
        ('CZK', 'Czech Koruna', 'K\u010D'),
        ('RON', 'Romanian Leu', 'lei'),
        ('ILS', 'Israeli Shekel', '\u20AA'),
        ('EGP', 'Egyptian Pound', 'E\u00A3'),
        ('KES', 'Kenyan Shilling', 'KSh'),
        ('NGN', 'Nigerian Naira', '\u20A6'),
        ('KWD', 'Kuwaiti Dinar', 'KD'),
        ('BHD', 'Bahraini Dinar', 'BD'),
        ('OMR', 'Omani Rial', 'OMR'),
        ('QAR', 'Qatari Riyal', 'QR'),
        ('RUB', 'Russian Ruble', '\u20BD'),
        ('NZD', 'New Zealand Dollar', 'NZ$'),
        ('HKD', 'Hong Kong Dollar', 'HK$'),
        ('TWD', 'Taiwan Dollar', 'NT$')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Seed-only migration — parent migration handles full cleanup
  }
}
