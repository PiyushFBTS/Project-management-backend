import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMoreLocationData1710400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── More countries ───────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO countries (name, code, phone_code) VALUES
        ('Afghanistan', 'AF', '+93'),
        ('Argentina', 'AR', '+54'),
        ('Austria', 'AT', '+43'),
        ('Bangladesh', 'BD', '+880'),
        ('Belgium', 'BE', '+32'),
        ('Bhutan', 'BT', '+975'),
        ('Cambodia', 'KH', '+855'),
        ('Chile', 'CL', '+56'),
        ('Colombia', 'CO', '+57'),
        ('Czech Republic', 'CZ', '+420'),
        ('Denmark', 'DK', '+45'),
        ('Egypt', 'EG', '+20'),
        ('Ethiopia', 'ET', '+251'),
        ('Finland', 'FI', '+358'),
        ('Ghana', 'GH', '+233'),
        ('Greece', 'GR', '+30'),
        ('Hong Kong', 'HK', '+852'),
        ('Hungary', 'HU', '+36'),
        ('Iceland', 'IS', '+354'),
        ('Indonesia', 'ID', '+62'),
        ('Iran', 'IR', '+98'),
        ('Iraq', 'IQ', '+964'),
        ('Ireland', 'IE', '+353'),
        ('Israel', 'IL', '+972'),
        ('Jamaica', 'JM', '+1876'),
        ('Jordan', 'JO', '+962'),
        ('Kazakhstan', 'KZ', '+7'),
        ('Kenya', 'KE', '+254'),
        ('Kuwait', 'KW', '+965'),
        ('Laos', 'LA', '+856'),
        ('Lebanon', 'LB', '+961'),
        ('Luxembourg', 'LU', '+352'),
        ('Maldives', 'MV', '+960'),
        ('Mexico', 'MX', '+52'),
        ('Mongolia', 'MN', '+976'),
        ('Morocco', 'MA', '+212'),
        ('Myanmar', 'MM', '+95'),
        ('Nepal', 'NP', '+977'),
        ('Nigeria', 'NG', '+234'),
        ('Norway', 'NO', '+47'),
        ('Oman', 'OM', '+968'),
        ('Pakistan', 'PK', '+92'),
        ('Peru', 'PE', '+51'),
        ('Philippines', 'PH', '+63'),
        ('Poland', 'PL', '+48'),
        ('Portugal', 'PT', '+351'),
        ('Qatar', 'QA', '+974'),
        ('Romania', 'RO', '+40'),
        ('Russia', 'RU', '+7'),
        ('Rwanda', 'RW', '+250'),
        ('Bahrain', 'BH', '+973'),
        ('Serbia', 'RS', '+381'),
        ('South Korea', 'KR', '+82'),
        ('Sri Lanka', 'LK', '+94'),
        ('Sweden', 'SE', '+46'),
        ('Taiwan', 'TW', '+886'),
        ('Tanzania', 'TZ', '+255'),
        ('Thailand', 'TH', '+66'),
        ('Turkey', 'TR', '+90'),
        ('Uganda', 'UG', '+256'),
        ('Ukraine', 'UA', '+380'),
        ('Uruguay', 'UY', '+598'),
        ('Uzbekistan', 'UZ', '+998'),
        ('Venezuela', 'VE', '+58'),
        ('Vietnam', 'VN', '+84'),
        ('Zambia', 'ZM', '+260'),
        ('Zimbabwe', 'ZW', '+263')
    `);

    // ── Helper to get country id ─────────────────────────────────────────
    const cid = async (code: string) => {
      const rows = await queryRunner.query(`SELECT id FROM countries WHERE code = '${code}'`);
      return rows[0]?.id;
    };

    // ── Helper to get state id ───────────────────────────────────────────
    const sid = async (code: string, countryId: number) => {
      const rows = await queryRunner.query(`SELECT id FROM states WHERE code = '${code}' AND country_id = ${countryId}`);
      return rows[0]?.id;
    };

    // ── More US states (remaining 30) ────────────────────────────────────
    const usId = await cid('US');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Alabama', 'AL', ${usId}),
        ('Alaska', 'AK', ${usId}),
        ('Arkansas', 'AR', ${usId}),
        ('Connecticut', 'CT', ${usId}),
        ('Delaware', 'DE', ${usId}),
        ('Hawaii', 'HI', ${usId}),
        ('Idaho', 'ID', ${usId}),
        ('Iowa', 'IA', ${usId}),
        ('Kansas', 'KS', ${usId}),
        ('Kentucky', 'KY', ${usId}),
        ('Louisiana', 'LA', ${usId}),
        ('Maine', 'ME', ${usId}),
        ('Mississippi', 'MS', ${usId}),
        ('Missouri', 'MO', ${usId}),
        ('Montana', 'MT', ${usId}),
        ('Nebraska', 'NE', ${usId}),
        ('Nevada', 'NV', ${usId}),
        ('New Hampshire', 'NH', ${usId}),
        ('New Mexico', 'NM', ${usId}),
        ('North Dakota', 'ND', ${usId}),
        ('Oklahoma', 'OK', ${usId}),
        ('Oregon', 'OR', ${usId}),
        ('Rhode Island', 'RI', ${usId}),
        ('South Carolina', 'SC', ${usId}),
        ('South Dakota', 'SD', ${usId}),
        ('Utah', 'UT', ${usId}),
        ('Vermont', 'VT', ${usId}),
        ('West Virginia', 'WV', ${usId}),
        ('Wisconsin', 'WI', ${usId}),
        ('Wyoming', 'WY', ${usId})
    `);

    // ── US cities ────────────────────────────────────────────────────────
    const caId = await sid('CA', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Los Angeles', ${caId}), ('San Francisco', ${caId}), ('San Diego', ${caId}), ('San Jose', ${caId}), ('Sacramento', ${caId}), ('Fresno', ${caId}), ('Oakland', ${caId})`);

    const txId = await sid('TX', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Houston', ${txId}), ('Dallas', ${txId}), ('Austin', ${txId}), ('San Antonio', ${txId}), ('Fort Worth', ${txId}), ('El Paso', ${txId})`);

    const nyId = await sid('NY', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('New York City', ${nyId}), ('Buffalo', ${nyId}), ('Rochester', ${nyId}), ('Albany', ${nyId}), ('Syracuse', ${nyId})`);

    const flId = await sid('FL', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Miami', ${flId}), ('Orlando', ${flId}), ('Tampa', ${flId}), ('Jacksonville', ${flId}), ('Fort Lauderdale', ${flId})`);

    const ilId = await sid('IL', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Chicago', ${ilId}), ('Springfield', ${ilId}), ('Naperville', ${ilId})`);

    const paId = await sid('PA', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Philadelphia', ${paId}), ('Pittsburgh', ${paId}), ('Allentown', ${paId})`);

    const gaId = await sid('GA', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Atlanta', ${gaId}), ('Savannah', ${gaId}), ('Augusta', ${gaId})`);

    const waId = await sid('WA', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Seattle', ${waId}), ('Spokane', ${waId}), ('Tacoma', ${waId})`);

    const maId = await sid('MA', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Boston', ${maId}), ('Cambridge', ${maId}), ('Worcester', ${maId})`);

    const coId = await sid('CO', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Denver', ${coId}), ('Colorado Springs', ${coId}), ('Boulder', ${coId})`);

    const ohId = await sid('OH', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Columbus', ${ohId}), ('Cleveland', ${ohId}), ('Cincinnati', ${ohId})`);

    const njId = await sid('NJ', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Newark', ${njId}), ('Jersey City', ${njId}), ('Trenton', ${njId})`);

    const vaId = await sid('VA', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Virginia Beach', ${vaId}), ('Richmond', ${vaId}), ('Arlington', ${vaId})`);

    const ncId = await sid('NC', usId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Charlotte', ${ncId}), ('Raleigh', ${ncId}), ('Durham', ${ncId})`);

    // ── UK cities ────────────────────────────────────────────────────────
    const ukId = await cid('GB');
    const engId = await sid('ENG', ukId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('London', ${engId}), ('Manchester', ${engId}), ('Birmingham', ${engId}), ('Liverpool', ${engId}), ('Leeds', ${engId}), ('Bristol', ${engId}), ('Sheffield', ${engId}), ('Newcastle', ${engId}), ('Cambridge', ${engId}), ('Oxford', ${engId}), ('Nottingham', ${engId}), ('Leicester', ${engId})`);

    const sctId = await sid('SCT', ukId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Edinburgh', ${sctId}), ('Glasgow', ${sctId}), ('Aberdeen', ${sctId}), ('Dundee', ${sctId})`);

    const wlsId = await sid('WLS', ukId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cardiff', ${wlsId}), ('Swansea', ${wlsId}), ('Newport', ${wlsId})`);

    const nirId = await sid('NIR', ukId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Belfast', ${nirId}), ('Derry', ${nirId})`);

    // ── UAE cities ───────────────────────────────────────────────────────
    const uaeId = await cid('AE');
    const duId = await sid('DU', uaeId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dubai City', ${duId}), ('Jebel Ali', ${duId}), ('Deira', ${duId})`);

    const azId = await sid('AZ', uaeId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Abu Dhabi City', ${azId}), ('Al Ain', ${azId})`);

    const shId = await sid('SH', uaeId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sharjah City', ${shId})`);

    // ── Australia states & cities ─────────────────────────────────────────
    const auId = await cid('AU');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('New South Wales', 'NSW', ${auId}),
        ('Victoria', 'VIC', ${auId}),
        ('Queensland', 'QLD', ${auId}),
        ('Western Australia', 'WA', ${auId}),
        ('South Australia', 'SA', ${auId}),
        ('Tasmania', 'TAS', ${auId}),
        ('Australian Capital Territory', 'ACT', ${auId}),
        ('Northern Territory', 'NT', ${auId})
    `);

    const nswId = await sid('NSW', auId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sydney', ${nswId}), ('Newcastle', ${nswId}), ('Wollongong', ${nswId})`);

    const vicId = await sid('VIC', auId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Melbourne', ${vicId}), ('Geelong', ${vicId}), ('Ballarat', ${vicId})`);

    const qldId = await sid('QLD', auId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Brisbane', ${qldId}), ('Gold Coast', ${qldId}), ('Cairns', ${qldId})`);

    const waAuId = await sid('WA', auId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Perth', ${waAuId}), ('Fremantle', ${waAuId})`);

    const actId = await sid('ACT', auId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Canberra', ${actId})`);

    // ── Canada provinces & cities ─────────────────────────────────────────
    const caCountryId = await cid('CA');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Ontario', 'ON', ${caCountryId}),
        ('Quebec', 'QC', ${caCountryId}),
        ('British Columbia', 'BC', ${caCountryId}),
        ('Alberta', 'AB', ${caCountryId}),
        ('Manitoba', 'MB', ${caCountryId}),
        ('Saskatchewan', 'SK', ${caCountryId}),
        ('Nova Scotia', 'NS', ${caCountryId}),
        ('New Brunswick', 'NB', ${caCountryId}),
        ('Newfoundland and Labrador', 'NL', ${caCountryId}),
        ('Prince Edward Island', 'PE', ${caCountryId})
    `);

    const onId = await sid('ON', caCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Toronto', ${onId}), ('Ottawa', ${onId}), ('Mississauga', ${onId}), ('Hamilton', ${onId}), ('Brampton', ${onId})`);

    const qcId = await sid('QC', caCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Montreal', ${qcId}), ('Quebec City', ${qcId}), ('Laval', ${qcId})`);

    const bcId = await sid('BC', caCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Vancouver', ${bcId}), ('Victoria', ${bcId}), ('Surrey', ${bcId})`);

    const abId = await sid('AB', caCountryId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Calgary', ${abId}), ('Edmonton', ${abId}), ('Red Deer', ${abId})`);

    // ── Germany states & cities ───────────────────────────────────────────
    const deId = await cid('DE');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Bavaria', 'BY', ${deId}),
        ('Berlin', 'BE', ${deId}),
        ('Hamburg', 'HH', ${deId}),
        ('Hesse', 'HE', ${deId}),
        ('Lower Saxony', 'NI', ${deId}),
        ('North Rhine-Westphalia', 'NW', ${deId}),
        ('Baden-Württemberg', 'BW', ${deId}),
        ('Saxony', 'SN', ${deId})
    `);

    const byId = await sid('BY', deId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Munich', ${byId}), ('Nuremberg', ${byId}), ('Augsburg', ${byId})`);

    const beId = await sid('BE', deId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Berlin', ${beId})`);

    const hhId = await sid('HH', deId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Hamburg', ${hhId})`);

    const heId = await sid('HE', deId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Frankfurt', ${heId}), ('Wiesbaden', ${heId})`);

    const nwId = await sid('NW', deId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Cologne', ${nwId}), ('Dusseldorf', ${nwId}), ('Dortmund', ${nwId}), ('Essen', ${nwId})`);

    const bwId = await sid('BW', deId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Stuttgart', ${bwId}), ('Karlsruhe', ${bwId}), ('Mannheim', ${bwId})`);

    // ── France regions & cities ───────────────────────────────────────────
    const frId = await cid('FR');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Île-de-France', 'IDF', ${frId}),
        ('Provence-Alpes-Côte d''Azur', 'PAC', ${frId}),
        ('Auvergne-Rhône-Alpes', 'ARA', ${frId}),
        ('Occitanie', 'OCC', ${frId}),
        ('Nouvelle-Aquitaine', 'NAQ', ${frId}),
        ('Brittany', 'BRE', ${frId})
    `);

    const idfId = await sid('IDF', frId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Paris', ${idfId}), ('Versailles', ${idfId}), ('Boulogne-Billancourt', ${idfId})`);

    const pacId = await sid('PAC', frId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Marseille', ${pacId}), ('Nice', ${pacId}), ('Toulon', ${pacId})`);

    const araId = await sid('ARA', frId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Lyon', ${araId}), ('Grenoble', ${araId}), ('Saint-Étienne', ${araId})`);

    // ── Singapore ─────────────────────────────────────────────────────────
    const sgId = await cid('SG');
    await queryRunner.query(`INSERT INTO states (name, code, country_id) VALUES ('Singapore', 'SG', ${sgId})`);
    const sgStateId = await sid('SG', sgId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Singapore', ${sgStateId})`);

    // ── Saudi Arabia regions & cities ─────────────────────────────────────
    const saId = await cid('SA');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Riyadh', 'RIY', ${saId}),
        ('Makkah', 'MKH', ${saId}),
        ('Eastern Province', 'EST', ${saId}),
        ('Madinah', 'MDN', ${saId}),
        ('Asir', 'ASR', ${saId})
    `);

    const riyId = await sid('RIY', saId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Riyadh', ${riyId})`);

    const mkhId = await sid('MKH', saId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Mecca', ${mkhId}), ('Jeddah', ${mkhId}), ('Taif', ${mkhId})`);

    const estId = await sid('EST', saId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dammam', ${estId}), ('Dhahran', ${estId}), ('Khobar', ${estId})`);

    const mdnId = await sid('MDN', saId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Medina', ${mdnId})`);

    // ── Japan prefectures & cities ────────────────────────────────────────
    const jpId = await cid('JP');
    await queryRunner.query(`
      INSERT INTO states (name, code, country_id) VALUES
        ('Tokyo', 'TK', ${jpId}),
        ('Osaka', 'OS', ${jpId}),
        ('Kyoto', 'KY', ${jpId}),
        ('Hokkaido', 'HK', ${jpId}),
        ('Aichi', 'AI', ${jpId}),
        ('Fukuoka', 'FK', ${jpId})
    `);

    const tkId = await sid('TK', jpId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Tokyo', ${tkId}), ('Shibuya', ${tkId}), ('Shinjuku', ${tkId})`);

    const osId = await sid('OS', jpId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Osaka', ${osId}), ('Sakai', ${osId})`);

    const kyId = await sid('KY', jpId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kyoto', ${kyId})`);

    const hkId = await sid('HK', jpId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Sapporo', ${hkId})`);

    const aiId = await sid('AI', jpId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Nagoya', ${aiId})`);

    // ── More Indian cities (missing states) ──────────────────────────────
    const indiaId = await cid('IN');

    // Goa
    const goaId = await sid('GA', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Panaji', ${goaId}), ('Margao', ${goaId}), ('Vasco da Gama', ${goaId})`);

    // Chhattisgarh
    const cgId = await sid('CG', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Raipur', ${cgId}), ('Bhilai', ${cgId}), ('Bilaspur', ${cgId})`);

    // Jharkhand
    const jhId = await sid('JH', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Ranchi', ${jhId}), ('Jamshedpur', ${jhId}), ('Dhanbad', ${jhId})`);

    // Odisha
    const odId = await sid('OD', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Bhubaneswar', ${odId}), ('Cuttack', ${odId}), ('Puri', ${odId})`);

    // Assam
    const asId = await sid('AS', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Guwahati', ${asId}), ('Dibrugarh', ${asId}), ('Silchar', ${asId})`);

    // Uttarakhand
    const ukStateId = await sid('UK', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Dehradun', ${ukStateId}), ('Haridwar', ${ukStateId}), ('Rishikesh', ${ukStateId}), ('Nainital', ${ukStateId})`);

    // Himachal Pradesh
    const hpId = await sid('HP', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Shimla', ${hpId}), ('Manali', ${hpId}), ('Dharamshala', ${hpId})`);

    // Jammu & Kashmir
    const jkId = await sid('JK', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Srinagar', ${jkId}), ('Jammu', ${jkId})`);

    // Sikkim
    const skId = await sid('SK', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Gangtok', ${skId})`);

    // Manipur
    const mnId = await sid('MN', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Imphal', ${mnId})`);

    // Meghalaya
    const mlId = await sid('ML', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Shillong', ${mlId})`);

    // Nagaland
    const nlId = await sid('NL', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Kohima', ${nlId}), ('Dimapur', ${nlId})`);

    // Tripura
    const trId = await sid('TR', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Agartala', ${trId})`);

    // Mizoram
    const mzId = await sid('MZ', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Aizawl', ${mzId})`);

    // Arunachal Pradesh
    const arId = await sid('AR', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Itanagar', ${arId})`);

    // Puducherry
    const pyId = await sid('PY', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Puducherry', ${pyId})`);

    // Chandigarh
    const chId = await sid('CH', indiaId);
    await queryRunner.query(`INSERT INTO cities (name, state_id) VALUES ('Chandigarh', ${chId})`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Removing individual seed data in reverse is impractical.
    // This migration only adds data — reverting the parent migration handles full cleanup.
  }
}
