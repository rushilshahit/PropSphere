// Run: node scripts/seed.js
const { Client } = require('pg');

const DATABASE_URL =
  'postgresql://postgres.lfvgrqrdwrnfxhuchwat:Superbase%408889@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

async function seed() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected. Seeding...');

  // ── Clear existing seed data ──────────────────────────────────────────────
  await client.query(`
    DELETE FROM property_images;
    DELETE FROM inspections;
    DELETE FROM properties;
    DELETE FROM agents;
    DELETE FROM agencies;
    DELETE FROM suburbs;
    DELETE FROM schools;
    DELETE FROM profiles WHERE email LIKE '%@propsphere.in';
  `);

  // ── Agency ────────────────────────────────────────────────────────────────
  const agencyRes = await client.query(`
    INSERT INTO agencies (name, slug, logo_url, website, phone, address, suburb, state, postcode)
    VALUES (
      'PropSphere Realty', 'propsphere-realty',
      'https://api.dicebear.com/7.x/initials/svg?seed=PR&backgroundColor=1a56db',
      'https://propsphere.in', '+91-79-4001-1234',
      '301, Titanium Square, Thaltej', 'Ahmedabad', 'GJ', '380054'
    ) RETURNING id;
  `);
  const agencyId = agencyRes.rows[0].id;
  console.log('Agency:', agencyId);

  // ── Suburbs ───────────────────────────────────────────────────────────────
  const suburbData = [
    { name: 'Navrangpura',   slug: 'navrangpura',   postcode: '380009', lat: 23.0395, lng: 72.5577, median_sale: 9500000,  median_rent: 28000 },
    { name: 'Satellite',     slug: 'satellite',     postcode: '380015', lat: 23.0225, lng: 72.5075, median_sale: 11000000, median_rent: 32000 },
    { name: 'Bopal',         slug: 'bopal',         postcode: '380058', lat: 23.0333, lng: 72.4667, median_sale: 7500000,  median_rent: 22000 },
    { name: 'Vastrapur',     slug: 'vastrapur',     postcode: '380015', lat: 23.0364, lng: 72.5230, median_sale: 10500000, median_rent: 30000 },
    { name: 'Prahlad Nagar', slug: 'prahlad-nagar', postcode: '380015', lat: 23.0154, lng: 72.5060, median_sale: 12000000, median_rent: 35000 },
    { name: 'SG Highway',    slug: 'sg-highway',    postcode: '380054', lat: 23.0569, lng: 72.5047, median_sale: 8500000,  median_rent: 25000 },
    { name: 'Thaltej',       slug: 'thaltej',       postcode: '380054', lat: 23.0665, lng: 72.5021, median_sale: 9000000,  median_rent: 26000 },
    { name: 'Gota',          slug: 'gota',          postcode: '382481', lat: 23.1025, lng: 72.5186, median_sale: 6000000,  median_rent: 18000 },
    { name: 'Chandkheda',    slug: 'chandkheda',    postcode: '382424', lat: 23.1167, lng: 72.5833, median_sale: 5500000,  median_rent: 16000 },
    { name: 'Maninagar',     slug: 'maninagar',     postcode: '380008', lat: 22.9955, lng: 72.6050, median_sale: 6500000,  median_rent: 20000 },
  ];

  const suburbIds = {};
  for (const s of suburbData) {
    const r = await client.query(`
      INSERT INTO suburbs (name, slug, postcode, state, lat, lng, median_sale_price, median_rent_price, days_on_market_avg, stats_updated_at)
      VALUES ($1,$2,$3,'GJ',$4,$5,$6,$7,32,NOW()) RETURNING id;
    `, [s.name, s.slug, s.postcode, s.lat, s.lng, s.median_sale, s.median_rent]);
    suburbIds[s.slug] = r.rows[0].id;
  }
  console.log('Suburbs:', Object.keys(suburbIds).length);

  // ── Agent profiles ────────────────────────────────────────────────────────
  const profileRes1 = await client.query(`
    INSERT INTO profiles (id, email, full_name, avatar_url, phone, role)
    VALUES (uuid_generate_v4(),'riya.shah@propsphere.in','Riya Shah',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=riya','+91-98250-11001','agent') RETURNING id;
  `);
  const profileRes2 = await client.query(`
    INSERT INTO profiles (id, email, full_name, avatar_url, phone, role)
    VALUES (uuid_generate_v4(),'arjun.mehta@propsphere.in','Arjun Mehta',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=arjun','+91-98250-22002','agent') RETURNING id;
  `);
  const profileRes3 = await client.query(`
    INSERT INTO profiles (id, email, full_name, avatar_url, phone, role)
    VALUES (uuid_generate_v4(),'priya.patel@propsphere.in','Priya Patel',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=priya','+91-98250-33003','agent') RETURNING id;
  `);

  const agentRes1 = await client.query(`
    INSERT INTO agents (profile_id, agency_id, slug, license_no, bio, years_active, is_verified)
    VALUES ($1,$2,'riya-shah','RERA-GJ-AG-1001','Specialising in luxury apartments across West Ahmedabad with 8 years of experience.',8,true) RETURNING id;
  `, [profileRes1.rows[0].id, agencyId]);
  const agentRes2 = await client.query(`
    INSERT INTO agents (profile_id, agency_id, slug, license_no, bio, years_active, is_verified)
    VALUES ($1,$2,'arjun-mehta','RERA-GJ-AG-1002','Expert in residential plots and villas across North Ahmedabad growth corridors.',5,true) RETURNING id;
  `, [profileRes2.rows[0].id, agencyId]);
  const agentRes3 = await client.query(`
    INSERT INTO agents (profile_id, agency_id, slug, license_no, bio, years_active, is_verified)
    VALUES ($1,$2,'priya-patel','RERA-GJ-AG-1003','Rental specialist with deep knowledge of Central and South Ahmedabad markets.',6,true) RETURNING id;
  `, [profileRes3.rows[0].id, agencyId]);

  const agent1 = agentRes1.rows[0].id;
  const agent2 = agentRes2.rows[0].id;
  const agent3 = agentRes3.rows[0].id;
  console.log('Agents:', agent1, agent2, agent3);

  // ── Properties ────────────────────────────────────────────────────────────
  const properties = [
    // ── NAVRANGPURA ───────────────────────────────────────────────────────
    {
      agent: agent1, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '12', street_name: 'Panchvati Cross Road', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0401, lng: 72.5569, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 142,
      price: 9200000, price_display: '₹92 L',
      headline: '3 BHK Premium Apartment in the Heart of Navrangpura',
      description: 'Spacious 3 BHK apartment with modern finishes, Italian marble flooring, and a stunning city view. Walking distance to CG Road, schools, and hospitals. Well-maintained society with 24x7 security, swimming pool, and clubhouse.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Intercom','Wardrobes'], outdoor: ['Swimming Pool','Gymnasium','Clubhouse','Children Play Area'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-01', is_featured: true,
    },
    {
      agent: agent3, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '5', street_name: 'Swastik Society', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0412, lng: 72.5590, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 98,
      price: 6500000, price_display: '₹65 L',
      headline: 'Stylish 2 BHK on CG Road — Move-In Ready',
      description: 'Fully renovated 2 BHK apartment in a prime Navrangpura address. Open-plan living with contemporary kitchen, designer bathrooms, and premium wooden flooring throughout. Just 5 minutes from CG Road and all major amenities.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes','Intercom'], outdoor: ['Society Parking','Lift','Security Guard'], climate: ['Air Conditioning'] },
      published_at: '2026-04-22', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'navrangpura', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '8', street_name: 'Nehru Park Road', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0385, lng: 72.5560, bedrooms: 3, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 135,
      price: 32000, price_display: '₹32,000/mo',
      headline: 'Semi-Furnished 3 BHK Near Navrangpura Metro',
      description: 'Beautifully maintained 3 BHK apartment steps from the metro station. Semi-furnished with AC, wardrobes, and modular kitchen. High-rise society with gym and security. Ideal for families and corporate professionals.',
      features: { indoor: ['Semi-Furnished','Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Gymnasium','Security','Covered Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-28', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '21', street_name: 'Mithakhali Six Roads', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0375, lng: 72.5545, bedrooms: 4, bathrooms: 4, car_spaces: 3, land_size: 0, build_size: 280,
      price: 21000000, price_display: '₹2.1 Cr',
      headline: 'Ultra-Luxury 4 BHK Penthouse with Panoramic Views',
      description: 'One-of-a-kind sky penthouse spanning the entire top floor with 360° views of Ahmedabad. Imported marble, bespoke cabinetry, private rooftop terrace, and separate staff quarters. Only for discerning buyers who demand the best.',
      features: { indoor: ['Smart Home','Home Theatre','Imported Marble','Wardrobes','Staff Quarter'], outdoor: ['Private Rooftop','Concierge','Valet Parking','Infinity Pool'], climate: ['Central AC','Heat Pump'] },
      published_at: '2026-03-10', is_featured: true,
    },
    {
      agent: agent2, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '3', street_name: 'Ankur Society', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0420, lng: 72.5610, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 148,
      price: 8800000, price_display: '₹88 L',
      headline: 'SOLD — 3 BHK in Prestigious Ankur Society',
      description: 'This well-appointed 3 BHK in one of Navrangpura\'s most prestigious societies has just been sold. The property featured large bedrooms, a private terrace, and beautiful garden views.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Garden','Security','Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-02-15', sold_at: '2026-04-10', sold_price: 8750000, is_featured: false,
    },

    // ── SATELLITE ─────────────────────────────────────────────────────────
    {
      agent: agent1, suburb_slug: 'satellite', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '4B', street_name: 'Anandnagar Road', suburb: 'Satellite', postcode: '380015',
      lat: 23.0231, lng: 72.5071, bedrooms: 4, bathrooms: 3, car_spaces: 2, land_size: 0, build_size: 210,
      price: 14500000, price_display: '₹1.45 Cr',
      headline: 'Stunning 4 BHK in Premium Satellite Locality',
      description: 'Ultra-premium 4 BHK apartment in one of Ahmedabad\'s most sought-after addresses. Features a large terrace garden, smart home automation, and premium fittings throughout. Top-tier amenities including rooftop pool and concierge services.',
      features: { indoor: ['Smart Home','Home Theatre','Modular Kitchen','Wardrobes','Study Room'], outdoor: ['Rooftop Pool','Gymnasium','Concierge','Visitor Parking'], climate: ['Central AC','Heat Pump'] },
      published_at: '2026-03-15', is_featured: true,
    },
    {
      agent: agent3, suburb_slug: 'satellite', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '11', street_name: 'Shyamal Cross Road', suburb: 'Satellite', postcode: '380015',
      lat: 23.0248, lng: 72.5088, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 165,
      price: 11000000, price_display: '₹1.1 Cr',
      headline: 'Elegant 3 BHK in Central Satellite — Ready to Register',
      description: 'Premium 3 BHK apartment in the heart of Satellite. Spacious rooms with high ceilings, premium woodwork, and a fully-fitted modular kitchen. Society features a pool, gym, and children\'s play zone. Walking distance to popular malls.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes','Study Room'], outdoor: ['Swimming Pool','Gymnasium','Children Play Zone','Visitor Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-04-03', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'satellite', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '7', street_name: 'Jodhpur Cross Road', suburb: 'Satellite', postcode: '380015',
      lat: 23.0215, lng: 72.5065, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 110,
      price: 30000, price_display: '₹30,000/mo',
      headline: 'Fully Furnished 2 BHK in Upscale Satellite',
      description: 'Tastefully furnished 2 BHK in a premium Satellite address. Equipped with branded appliances, designer furniture, and smart TV. High-speed internet ready. Ideal for expats and senior executives. Zero brokerage for long-term lease.',
      features: { indoor: ['Fully Furnished','Air Conditioning','Smart TV','Washing Machine','Refrigerator'], outdoor: ['Swimming Pool','Security','Covered Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-05-01', is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'satellite', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '2', street_name: 'Shrimali Society', suburb: 'Satellite', postcode: '380015',
      lat: 23.0262, lng: 72.5052, bedrooms: 4, bathrooms: 3, car_spaces: 3, land_size: 0, build_size: 225,
      price: 15800000, price_display: '₹1.58 Cr',
      headline: 'SOLD — Luxurious 4 BHK in Shrimali Society',
      description: 'This landmark 4 BHK apartment in the iconic Shrimali Society was recently sold. The unit offered grand living spaces, a private jacuzzi, and exclusive club membership. A benchmark sale for the Satellite micro-market.',
      features: { indoor: ['Smart Home','Jacuzzi','Wardrobes','Study Room'], outdoor: ['Club Membership','Concierge','Valet Parking'], climate: ['Central AC'] },
      published_at: '2026-01-20', sold_at: '2026-03-28', sold_price: 15500000, is_featured: false,
    },

    // ── BOPAL ─────────────────────────────────────────────────────────────
    {
      agent: agent2, suburb_slug: 'bopal', listing_type: 'buy', property_type: 'house',
      status: 'active', sale_method: 'private_treaty',
      street_number: '7', street_name: 'Shivalik Row Houses', suburb: 'Bopal', postcode: '380058',
      lat: 23.0328, lng: 72.4672, bedrooms: 4, bathrooms: 3, car_spaces: 3, land_size: 280, build_size: 320,
      price: 12000000, price_display: '₹1.2 Cr',
      headline: 'Spacious 4 BHK Bungalow with Private Garden in Bopal',
      description: 'Elegant independent bungalow offering privacy and space. Landscaped garden, private parking for 3 cars, and expansive living areas. Close to Bopal Circle, shopping malls, and reputed schools. Ideal for families seeking tranquillity near the city.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Servant Quarter','Pooja Room'], outdoor: ['Private Garden','Terrace','Covered Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-10', is_featured: true,
    },
    {
      agent: agent3, suburb_slug: 'bopal', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '18', street_name: 'Bopal-Ghuma Road', suburb: 'Bopal', postcode: '380058',
      lat: 23.0345, lng: 72.4689, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 148,
      price: 7500000, price_display: '₹75 L',
      headline: 'Spacious 3 BHK in Gated Township — Bopal',
      description: 'Well-designed 3 BHK apartment in one of Bopal\'s finest gated townships. Wide roads, lush greenery, and world-class amenities. Near top international schools and the upcoming metro corridor. Ready to move.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes','Intercom'], outdoor: ['Swimming Pool','Gymnasium','Badminton Court','Jogging Track'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-15', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'bopal', listing_type: 'rent', property_type: 'house',
      status: 'active', sale_method: null,
      street_number: '23', street_name: 'Sindhu Bhavan Road', suburb: 'Bopal', postcode: '380058',
      lat: 23.0312, lng: 72.4655, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 180, build_size: 220,
      price: 28000, price_display: '₹28,000/mo',
      headline: 'Independent 3 BHK House with Terrace in Bopal',
      description: 'Spacious independent house with a private terrace perfect for families. Freshly painted with new tile flooring, a modern kitchen, and ample natural light. Quiet residential street close to Bopal schools and shopping centres.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Terrace','Private Parking','Garden'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-05-02', is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'bopal', listing_type: 'buy', property_type: 'land',
      status: 'active', sale_method: 'private_treaty',
      street_number: 'Plot 14', street_name: 'Aavkar Greens', suburb: 'Bopal', postcode: '380058',
      lat: 23.0355, lng: 72.4700, bedrooms: 0, bathrooms: 0, car_spaces: 0, land_size: 200, build_size: 0,
      price: 5500000, price_display: '₹55 L',
      headline: 'NA Plot 200 sqm in Premium Bopal Layout',
      description: 'Ready NA (Non-Agricultural) plot in a fully developed layout with paved roads, street lights, water supply, and drainage. AUDA-approved. Ideal to build your dream bungalow. Corner plot with extra width. Title clear.',
      features: { indoor: [], outdoor: ['NA Approved','Paved Roads','Street Lights','Water Connection','Drainage'], climate: [] },
      published_at: '2026-04-18', is_featured: false,
    },

    // ── VASTRAPUR ─────────────────────────────────────────────────────────
    {
      agent: agent1, suburb_slug: 'vastrapur', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '202', street_name: 'Vastrapur Lake Road', suburb: 'Vastrapur', postcode: '380015',
      lat: 23.0361, lng: 72.5235, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 95,
      price: 28000, price_display: '₹28,000/mo',
      headline: 'Modern 2 BHK Overlooking Vastrapur Lake',
      description: 'Beautiful lake-facing apartment with contemporary interiors. Fully furnished with brand-new appliances. Society amenities include gym, jogging track, and children\'s park. Excellent connectivity to IIM-A and Prahlad Nagar.',
      features: { indoor: ['Furnished','Air Conditioning','Washing Machine','Refrigerator'], outdoor: ['Gymnasium','Jogging Track','Children Play Area'], climate: ['Air Conditioning'] },
      published_at: '2026-04-20', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'vastrapur', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '6', street_name: 'Judges Bungalow Road', suburb: 'Vastrapur', postcode: '380015',
      lat: 23.0378, lng: 72.5248, bedrooms: 3, bathrooms: 3, car_spaces: 2, land_size: 0, build_size: 175,
      price: 10500000, price_display: '₹1.05 Cr',
      headline: 'Lake-View 3 BHK — Ahmedabad\'s Most Coveted Address',
      description: 'Rare lake-view apartment on the prestigious Judges Bungalow Road. Floor-to-ceiling windows frame the stunning Vastrapur Lake. Premium fittings, private lift lobby, and exclusive resident club. Steps from IIM Ahmedabad and ISKCON temple.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Walk-in Wardrobe','Jacuzzi'], outdoor: ['Resident Club','Swimming Pool','Private Lift Lobby','Valet Parking'], climate: ['Central AC'] },
      published_at: '2026-03-25', is_featured: true,
    },
    {
      agent: agent2, suburb_slug: 'vastrapur', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '45', street_name: 'Vastrapur Village Road', suburb: 'Vastrapur', postcode: '380015',
      lat: 23.0350, lng: 72.5220, bedrooms: 1, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 58,
      price: 20000, price_display: '₹20,000/mo',
      headline: 'Cosy 1 BHK Studio Near Vastrapur Lake — Students Welcome',
      description: 'Compact and well-maintained 1 BHK near Vastrapur Lake. Close to IIM, CEPT, and LD Engineering College. Furnished with bed, wardrobe, and kitchen appliances. Society has 24x7 security. Bills on actuals.',
      features: { indoor: ['Semi-Furnished','Air Conditioning','Kitchen Appliances'], outdoor: ['Security','Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-05-03', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'vastrapur', listing_type: 'buy', property_type: 'house',
      status: 'active', sale_method: 'private_treaty',
      street_number: '1', street_name: 'Sardar Patel Nagar', suburb: 'Vastrapur', postcode: '380015',
      lat: 23.0395, lng: 72.5260, bedrooms: 5, bathrooms: 5, car_spaces: 4, land_size: 450, build_size: 520,
      price: 28000000, price_display: '₹2.8 Cr',
      headline: 'Grand 5 BHK Villa with Private Pool — Vastrapur',
      description: 'Spectacular independent villa with a private swimming pool, home theatre, and landscaped garden spanning 450 sqm. Handcrafted interiors with imported stone, bespoke furniture, and a fully automated smart home system. A trophy property in every sense.',
      features: { indoor: ['Smart Home','Home Theatre','Imported Stone','Walk-in Closet','Staff Quarters'], outdoor: ['Private Pool','Landscaped Garden','4-Car Garage','Outdoor Kitchen'], climate: ['Central AC','Heat Pump'] },
      published_at: '2026-02-28', is_featured: true,
    },

    // ── PRAHLAD NAGAR ─────────────────────────────────────────────────────
    {
      agent: agent2, suburb_slug: 'prahlad-nagar', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'auction',
      street_number: '9', street_name: 'Corporate Road', suburb: 'Prahlad Nagar', postcode: '380015',
      lat: 23.0158, lng: 72.5055, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 158,
      price: 11800000, price_display: '₹1.18 Cr',
      headline: 'Premium 3 BHK Near Prahlad Nagar Garden',
      description: 'Luxurious apartment in Ahmedabad\'s corporate hub. Walking distance to premier offices, five-star hotels, and fine dining. Investment-grade property with strong rental yield. Amenities include infinity pool, spa, and business centre.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Intercom','Video Door Phone'], outdoor: ['Infinity Pool','Spa','Business Centre','Concierge'], climate: ['Central AC'] },
      published_at: '2026-03-28', auction_at: '2026-05-25T11:00:00+05:30', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'prahlad-nagar', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '35', street_name: 'Prahlad Nagar Garden Road', suburb: 'Prahlad Nagar', postcode: '380015',
      lat: 23.0170, lng: 72.5068, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 112,
      price: 35000, price_display: '₹35,000/mo',
      headline: 'Premium Furnished 2 BHK Opposite Prahlad Nagar Garden',
      description: 'Beautifully furnished apartment with garden-facing balcony. Premium society with 24x7 concierge, housekeeping, and valet. Ideal for senior executives working in the Corporate Road belt. Lease term: 11 months minimum.',
      features: { indoor: ['Fully Furnished','Smart TV','Air Conditioning','Modular Kitchen'], outdoor: ['Concierge','Housekeeping','Valet Parking','Garden View'], climate: ['Central AC'] },
      published_at: '2026-04-30', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'prahlad-nagar', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '17', street_name: 'Iscon Cross Road', suburb: 'Prahlad Nagar', postcode: '380015',
      lat: 23.0144, lng: 72.5040, bedrooms: 4, bathrooms: 4, car_spaces: 3, land_size: 0, build_size: 260,
      price: 19500000, price_display: '₹1.95 Cr',
      headline: '4 BHK Sky Suite Near ISCON — Prahlad Nagar',
      description: 'Expansive sky-level apartment with private elevator access, 12-foot ceilings, and wrap-around balcony. Open-plan great room perfect for entertaining. Society with platinum amenities — tennis court, squash, bowling alley, and fine-dining restaurant.',
      features: { indoor: ['Smart Home','Private Elevator','12-ft Ceilings','Wardrobes','Study'], outdoor: ['Tennis Court','Squash','Bowling Alley','Fine Dining'], climate: ['Central AC','Radiant Heating'] },
      published_at: '2026-03-05', is_featured: true,
    },

    // ── SG HIGHWAY ────────────────────────────────────────────────────────
    {
      agent: agent2, suburb_slug: 'sg-highway', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '504', street_name: 'SGRD Complex', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0574, lng: 72.5043, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 105,
      price: 7200000, price_display: '₹72 L',
      headline: 'Affordable 2 BHK on SG Highway with Great Connectivity',
      description: 'Well-planned 2 BHK apartment on the bustling SG Highway corridor. Easy access to GIFT City, Gandhinagar, and Ahmedabad airport. Modern society with all amenities. Perfect for young professionals and small families.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Swimming Pool','Gymnasium','Visitor Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-04-05', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'sg-highway', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '12', street_name: 'SG Road Opp. BDPL', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0588, lng: 72.5060, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 155,
      price: 8500000, price_display: '₹85 L',
      headline: '3 BHK in Premier SG Highway Tower',
      description: 'High-floor apartment with commanding views of SG Highway skyline. Large living room, separate dining, and a fully modular kitchen. Society has a rooftop lounge, gym, and co-working space. Quick drive to GIFT City and Ahmedabad International Airport.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes','Intercom'], outdoor: ['Rooftop Lounge','Gymnasium','Co-Working Space','Visitor Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-04-12', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'sg-highway', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '801', street_name: 'Sindhu Bhavan Marg', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0562, lng: 72.5028, bedrooms: 4, bathrooms: 3, car_spaces: 2, land_size: 0, build_size: 215,
      price: 11500000, price_display: '₹1.15 Cr',
      headline: 'Luxury 4 BHK High-Rise — SG Highway Skyline',
      description: 'Landmark high-rise apartment in a brand-new tower on SG Highway. Double-height lobby, imported fittings, and a sprawling balcony with sunset views. Society features a 3-level clubhouse, indoor sports facilities, and 5-star amenities.',
      features: { indoor: ['Smart Home','Air Conditioning','Modular Kitchen','Walk-in Wardrobe'], outdoor: ['3-Level Clubhouse','Indoor Sports','Swimming Pool','Helipad'], climate: ['Central AC'] },
      published_at: '2026-03-20', is_featured: true,
    },
    {
      agent: agent2, suburb_slug: 'sg-highway', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '302', street_name: 'Adani Shantigram', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0550, lng: 72.5015, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 108,
      price: 22000, price_display: '₹22,000/mo',
      headline: 'Semi-Furnished 2 BHK in Shantigram Township',
      description: 'Peaceful township apartment with lush surroundings and 180+ amenities. Semi-furnished with AC in all rooms, modular kitchen, and piped gas. Just 10 minutes from GIFT City. Ideal for GIFT City professionals.',
      features: { indoor: ['Semi-Furnished','Air Conditioning','Modular Kitchen','Piped Gas'], outdoor: ['Township Amenities','Security','Landscaped Gardens'], climate: ['Air Conditioning'] },
      published_at: '2026-05-04', is_featured: false,
    },

    // ── THALTEJ ───────────────────────────────────────────────────────────
    {
      agent: agent1, suburb_slug: 'thaltej', listing_type: 'rent', property_type: 'house',
      status: 'active', sale_method: null,
      street_number: '15', street_name: 'Titanium City Road', suburb: 'Thaltej', postcode: '380054',
      lat: 23.0661, lng: 72.5025, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 200, build_size: 240,
      price: 35000, price_display: '₹35,000/mo',
      headline: 'Independent 3 BHK Row House in Quiet Thaltej Enclave',
      description: 'Charming semi-furnished row house in a peaceful gated community. Private front yard, dedicated parking, and quick access to SG Highway. Society boasts landscaped gardens and 24x7 security. Ideal for families relocating to Ahmedabad.',
      features: { indoor: ['Semi-Furnished','Air Conditioning','Modular Kitchen'], outdoor: ['Private Yard','Landscaped Gardens','Security'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-18', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'thaltej', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '48', street_name: 'Thaltej Cross Road', suburb: 'Thaltej', postcode: '380054',
      lat: 23.0672, lng: 72.5038, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 102,
      price: 6800000, price_display: '₹68 L',
      headline: 'Ready-to-Move 2 BHK in Thaltej — New Construction',
      description: 'Brand-new 2 BHK apartment in a boutique 8-floor building near Thaltej Circle. Vastu-compliant design, high-quality fittings, and a modern lobby. Society has CCTV, intercom, and covered parking. OC received.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes','Intercom'], outdoor: ['CCTV','Covered Parking','Lift'], climate: ['Air Conditioning'] },
      published_at: '2026-04-25', is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'thaltej', listing_type: 'buy', property_type: 'house',
      status: 'active', sale_method: 'private_treaty',
      street_number: '5', street_name: 'Westgate Villas', suburb: 'Thaltej', postcode: '380054',
      lat: 23.0680, lng: 72.5050, bedrooms: 5, bathrooms: 5, car_spaces: 4, land_size: 400, build_size: 480,
      price: 25000000, price_display: '₹2.5 Cr',
      headline: 'Trophy 5 BHK Villa in Westgate — Thaltej\'s Finest',
      description: 'Flagship villa in an exclusive gated community with only 12 homes. Italian marble, German kitchen, and bespoke joinery throughout. Private pool, outdoor BBQ area, and a home office. Only 3 minutes from SG Highway.',
      features: { indoor: ['Italian Marble','German Kitchen','Smart Home','Home Office','Staff Quarter'], outdoor: ['Private Pool','BBQ Area','4-Car Garage','Landscaped Garden'], climate: ['Central AC','Solar Water Heater'] },
      published_at: '2026-02-20', is_featured: true,
    },
    {
      agent: agent1, suburb_slug: 'thaltej', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '201', street_name: 'Thaltej Tekra Road', suburb: 'Thaltej', postcode: '380054',
      lat: 23.0655, lng: 72.5010, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 145,
      price: 25000, price_display: '₹25,000/mo',
      headline: 'Spacious 3 BHK Near Thaltej Metro Station',
      description: 'Well-maintained 3 BHK apartment just 5 minutes walk from Thaltej metro. Partially furnished with wardrobes and AC. Society has a gym and children\'s play area. Convenient for families commuting across Ahmedabad.',
      features: { indoor: ['Semi-Furnished','Air Conditioning','Wardrobes'], outdoor: ['Gymnasium','Children Play Area','Security'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-05-05', is_featured: false,
    },

    // ── GOTA ─────────────────────────────────────────────────────────────
    {
      agent: agent2, suburb_slug: 'gota', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '301', street_name: 'Gota Flyover Road', suburb: 'Gota', postcode: '382481',
      lat: 23.1021, lng: 72.5190, bedrooms: 2, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 82,
      price: 4800000, price_display: '₹48 L',
      headline: 'Budget-Friendly 2 BHK Apartment in Emerging Gota',
      description: 'Great opportunity for first-time homebuyers in the rapidly developing Gota area. Clean, well-maintained apartment with modern kitchen and good ventilation. Close to Gota Flyover and multiple bus routes. Excellent investment potential.',
      features: { indoor: ['Modular Kitchen','Wardrobes'], outdoor: ['Society Parking','Children Play Area'], climate: ['Ceiling Fans'] },
      published_at: '2026-04-12', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'gota', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '55', street_name: 'Gota-Chanakyapuri Road', suburb: 'Gota', postcode: '382481',
      lat: 23.1035, lng: 72.5205, bedrooms: 3, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 125,
      price: 5800000, price_display: '₹58 L',
      headline: 'Affordable 3 BHK Family Home in Up-and-Coming Gota',
      description: 'Large 3 BHK apartment at a price that\'s hard to beat. New construction with contemporary finishes, good storage, and a well-lit kitchen. Gota is one of Ahmedabad\'s fastest-growing suburbs — buy now before prices rise.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Lift','Society Parking','Security Guard'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-19', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'gota', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '10', street_name: 'New Ranip Road', suburb: 'Gota', postcode: '382481',
      lat: 23.1008, lng: 72.5175, bedrooms: 1, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 52,
      price: 3200000, price_display: '₹32 L',
      headline: '1 BHK Starter Home — Best Value in Gota',
      description: 'Perfect starter home or investment property in Gota. Compact and efficient 1 BHK with a modern kitchen and bright bedroom. Society is quiet and well-managed. On a main road with direct bus connectivity to Chandkheda and Ahmedabad central.',
      features: { indoor: ['Modular Kitchen'], outdoor: ['Society Parking','Water Storage'], climate: ['Ceiling Fans'] },
      published_at: '2026-05-02', is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'gota', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '88', street_name: 'Gota Circle Road', suburb: 'Gota', postcode: '382481',
      lat: 23.1042, lng: 72.5220, bedrooms: 2, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 85,
      price: 15000, price_display: '₹15,000/mo',
      headline: '2 BHK Rental in Gota — Bills Negotiable',
      description: 'Affordable 2 BHK rental in Gota with good connectivity to North Ahmedabad and Gandhinagar. Society has covered parking and 24x7 water supply. Landlord open to negotiation for long-term tenants. No brokerage.',
      features: { indoor: ['Air Conditioning','Basic Kitchen'], outdoor: ['Covered Parking','Water Storage'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-05-06', is_featured: false,
    },

    // ── CHANDKHEDA ────────────────────────────────────────────────────────
    {
      agent: agent1, suburb_slug: 'chandkheda', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '108', street_name: 'Chandkheda-Visat Road', suburb: 'Chandkheda', postcode: '382424',
      lat: 23.1163, lng: 72.5829, bedrooms: 1, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 55,
      price: 12000, price_display: '₹12,000/mo',
      headline: 'Cosy 1 BHK Studio Near Chandkheda BRTS',
      description: 'Compact and well-designed 1 BHK apartment, perfect for working professionals or students. Fully equipped kitchen, separate bedroom, and attached bathroom. Excellent BRTS and metro connectivity. Bills negotiable.',
      features: { indoor: ['Furnished','Shared Washing Machine'], outdoor: ['Covered Parking','Society Security'], climate: ['Ceiling Fans'] },
      published_at: '2026-04-25', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'chandkheda', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '42', street_name: 'Chandkheda-Naroda Highway', suburb: 'Chandkheda', postcode: '382424',
      lat: 23.1178, lng: 72.5845, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 90,
      price: 4500000, price_display: '₹45 L',
      headline: '2 BHK Apartment Near Chandkheda Metro — High ROI',
      description: 'Strategically located 2 BHK near the Chandkheda metro station and BRTS corridor. High rental demand from ISRO, DRDO, and pharmaceutical companies nearby. Ready-to-rent property with strong investment fundamentals.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Society Parking','Lift','Security'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-26', is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'chandkheda', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '29', street_name: 'Gyanmanjari Complex', suburb: 'Chandkheda', postcode: '382424',
      lat: 23.1150, lng: 72.5815, bedrooms: 2, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 80,
      price: 14000, price_display: '₹14,000/mo',
      headline: '2 BHK Flat in Gyanmanjari — Chandkheda',
      description: 'Clean and well-ventilated 2 BHK in a family-friendly society. Freshly painted and ready to move in. Society has water-purifier access, garden area, and covered parking. Walking distance to schools, banks, and supermarkets.',
      features: { indoor: ['Air Conditioning','Basic Kitchen','Wardrobes'], outdoor: ['Garden','Covered Parking','Water Purifier'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-05-01', is_featured: false,
    },

    // ── MANINAGAR ─────────────────────────────────────────────────────────
    {
      agent: agent2, suburb_slug: 'maninagar', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '22', street_name: 'Maninagar Station Road', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9950, lng: 72.6055, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 130,
      price: 6800000, price_display: '₹68 L',
      headline: 'Well-Connected 3 BHK Near Maninagar Railway Station',
      description: 'Solid construction apartment in one of Ahmedabad\'s oldest and most established localities. Minutes from Maninagar railway station and major markets. Strong rental demand makes this an excellent investment. Society with lift and security.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Lift','Society Security','Visitor Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-08', is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'maninagar', listing_type: 'rent', property_type: 'apartment',
      status: 'active', sale_method: null,
      street_number: '14', street_name: 'Trikamnagar Society', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9965, lng: 72.6070, bedrooms: 2, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 88,
      price: 18000, price_display: '₹18,000/mo',
      headline: '2 BHK Rental in Central Maninagar — No Brokerage',
      description: 'Centrally located 2 BHK in a well-maintained Maninagar society. Walking distance to Maninagar station, vegetable markets, and temples. Semi-furnished with wardrobes and ceiling fans. Family preferred.',
      features: { indoor: ['Semi-Furnished','Wardrobes'], outdoor: ['Society Parking','Lift','Security'], climate: ['Ceiling Fans'] },
      published_at: '2026-04-29', is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'maninagar', listing_type: 'buy', property_type: 'house',
      status: 'active', sale_method: 'private_treaty',
      street_number: '7', street_name: 'Jawahar Nagar', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9938, lng: 72.6040, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 150, build_size: 180,
      price: 8000000, price_display: '₹80 L',
      headline: 'Independent 3 BHK House in Jawahar Nagar — Maninagar',
      description: 'Classic independent house with a small front garden in the heart of Maninagar. Two floors, two separate entrances, and ample natural light. Ideal for a joint family or as an income property (rent both floors). Near Maninagar railway overbridge.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Pooja Room','Storage Room'], outdoor: ['Front Garden','Two Parking Spots','Terrace'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-14', is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'maninagar', listing_type: 'buy', property_type: 'apartment',
      status: 'active', sale_method: 'private_treaty',
      street_number: '66', street_name: 'Kankaria Road', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9975, lng: 72.6085, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 95,
      price: 5200000, price_display: '₹52 L',
      headline: '2 BHK Near Kankaria Lake — Ahmedabad\'s Iconic Landmark',
      description: 'Charming apartment a short walk from the iconic Kankaria Lake. Perfect for families who love outdoor living. Renovated kitchen and bathrooms with modern fixtures. Society is peaceful and child-friendly. Great connectivity via BRTS.',
      features: { indoor: ['Air Conditioning','Renovated Kitchen','Wardrobes'], outdoor: ['Society Parking','Children Play Area','Garden'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-21', is_featured: false,
    },

    // ── SOLD PROPERTIES (25 records) ──────────────────────────────────────────

    // Navrangpura sold
    {
      agent: agent1, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '14', street_name: 'Panchvati Road', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0408, lng: 72.5580, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 105,
      price: 7200000, price_display: '₹72 L',
      headline: 'SOLD — 2 BHK on Panchvati Road, Navrangpura',
      description: 'Bright 2 BHK in a sought-after Navrangpura address. Sold within 18 days of listing.',
      features: { indoor: ['Air Conditioning','Modular Kitchen'], outdoor: ['Society Parking','Lift'], climate: ['Air Conditioning'] },
      published_at: '2026-01-05', sold_at: '2026-01-23', sold_price: 7050000, is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '9', street_name: 'CG Road', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0388, lng: 72.5555, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 152,
      price: 9500000, price_display: '₹95 L',
      headline: 'SOLD — 3 BHK on CG Road',
      description: 'Prime CG Road apartment sold at above asking. One of the fastest closures in the precinct.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Swimming Pool','Security'], climate: ['Air Conditioning'] },
      published_at: '2025-11-10', sold_at: '2025-11-28', sold_price: 9600000, is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'navrangpura', listing_type: 'buy', property_type: 'house',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '3', street_name: 'Nehru Park Bungalows', suburb: 'Navrangpura', postcode: '380009',
      lat: 23.0395, lng: 72.5598, bedrooms: 4, bathrooms: 3, car_spaces: 2, land_size: 280, build_size: 330,
      price: 22000000, price_display: '₹2.2 Cr',
      headline: 'SOLD — 4 BHK Bungalow Near Nehru Park',
      description: 'Prestigious bungalow in the quietest pocket of Navrangpura. Sold after competitive offers from three buyers.',
      features: { indoor: ['Smart Home','Modular Kitchen','Servant Quarter'], outdoor: ['Private Garden','Covered Parking'], climate: ['Central AC'] },
      published_at: '2025-10-01', sold_at: '2025-10-22', sold_price: 21500000, is_featured: false,
    },

    // Satellite sold
    {
      agent: agent1, suburb_slug: 'satellite', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '8', street_name: 'Jodhpur Village Road', suburb: 'Satellite', postcode: '380015',
      lat: 23.0240, lng: 72.5082, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 162,
      price: 11500000, price_display: '₹1.15 Cr',
      headline: 'SOLD — 3 BHK in Jodhpur Village Road, Satellite',
      description: 'Well-appointed 3 BHK in the Satellite premium corridor. Closed in under three weeks.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Pool','Gymnasium','Security'], climate: ['Air Conditioning'] },
      published_at: '2026-02-01', sold_at: '2026-02-19', sold_price: 11200000, is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'satellite', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '3A', street_name: 'Anandnagar Cross Road', suburb: 'Satellite', postcode: '380015',
      lat: 23.0255, lng: 72.5095, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 112,
      price: 8800000, price_display: '₹88 L',
      headline: 'SOLD — 2 BHK, Anandnagar Cross Road',
      description: 'Compact yet luxurious 2 BHK that attracted multiple offers on the first weekend.',
      features: { indoor: ['Air Conditioning','Modular Kitchen'], outdoor: ['Gymnasium','Covered Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-03-01', sold_at: '2026-03-14', sold_price: 9000000, is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'satellite', listing_type: 'buy', property_type: 'house',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '12', street_name: 'Panchwati Society Satellite', suburb: 'Satellite', postcode: '380015',
      lat: 23.0268, lng: 72.5108, bedrooms: 5, bathrooms: 4, car_spaces: 3, land_size: 380, build_size: 450,
      price: 30000000, price_display: '₹3 Cr',
      headline: 'SOLD — Trophy Villa in Satellite',
      description: 'Iconic standalone villa in Satellite. Sold at ₹3 Cr — a landmark transaction for the suburb.',
      features: { indoor: ['Smart Home','Home Theatre','Italian Marble','Staff Quarter'], outdoor: ['Private Pool','Landscaped Garden','4-Car Garage'], climate: ['Central AC'] },
      published_at: '2025-09-15', sold_at: '2025-10-10', sold_price: 29500000, is_featured: false,
    },

    // Bopal sold
    {
      agent: agent2, suburb_slug: 'bopal', listing_type: 'buy', property_type: 'house',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '4', street_name: 'Shivalik Bungalows Phase 2', suburb: 'Bopal', postcode: '380058',
      lat: 23.0320, lng: 72.4660, bedrooms: 4, bathrooms: 3, car_spaces: 2, land_size: 260, build_size: 300,
      price: 13500000, price_display: '₹1.35 Cr',
      headline: 'SOLD — 4 BHK Bungalow in Shivalik Phase 2, Bopal',
      description: 'Spacious bungalow in Bopal\'s most established row-house scheme. Sold above asking.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Pooja Room'], outdoor: ['Private Garden','Covered Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-01-10', sold_at: '2026-02-05', sold_price: 13800000, is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'bopal', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '22', street_name: 'Bopal-Ghuma Main Road', suburb: 'Bopal', postcode: '380058',
      lat: 23.0338, lng: 72.4678, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 96,
      price: 6500000, price_display: '₹65 L',
      headline: 'SOLD — 2 BHK in Bopal Township',
      description: 'First-home buyer favourite in Bopal. Strong capital growth area.',
      features: { indoor: ['Air Conditioning','Modular Kitchen'], outdoor: ['Society Parking','Lift'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-02-20', sold_at: '2026-03-08', sold_price: 6400000, is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'bopal', listing_type: 'buy', property_type: 'land',
      status: 'sold', sale_method: 'private_treaty',
      street_number: 'Plot 7', street_name: 'Aavkar Greens Phase 2', suburb: 'Bopal', postcode: '380058',
      lat: 23.0360, lng: 72.4710, bedrooms: 0, bathrooms: 0, car_spaces: 0, land_size: 180, build_size: 0,
      price: 4800000, price_display: '₹48 L',
      headline: 'SOLD — NA Plot 180 sqm in Bopal Layout',
      description: 'Corner NA plot sold to a family planning to construct a custom bungalow.',
      features: { indoor: [], outdoor: ['NA Approved','Paved Roads','Water Connection'], climate: [] },
      published_at: '2026-01-18', sold_at: '2026-01-30', sold_price: 4700000, is_featured: false,
    },

    // Vastrapur sold
    {
      agent: agent3, suburb_slug: 'vastrapur', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '10', street_name: 'Judges Bungalow Cross Road', suburb: 'Vastrapur', postcode: '380015',
      lat: 23.0370, lng: 72.5240, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 168,
      price: 10800000, price_display: '₹1.08 Cr',
      headline: 'SOLD — Lake-View 3 BHK, Vastrapur',
      description: 'Rare lake-view apartment in Vastrapur. Sold within days of listing to an NRI buyer.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Walk-in Wardrobe'], outdoor: ['Private Lift Lobby','Pool'], climate: ['Central AC'] },
      published_at: '2025-12-01', sold_at: '2025-12-15', sold_price: 11000000, is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'vastrapur', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '33', street_name: 'Vastrapur Lake Road', suburb: 'Vastrapur', postcode: '380015',
      lat: 23.0368, lng: 72.5225, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 98,
      price: 8200000, price_display: '₹82 L',
      headline: 'SOLD — 2 BHK Overlooking Vastrapur Lake',
      description: 'Peaceful lake-facing 2 BHK that sold at full asking price.',
      features: { indoor: ['Air Conditioning','Modular Kitchen'], outdoor: ['Gymnasium','Jogging Track'], climate: ['Air Conditioning'] },
      published_at: '2026-03-05', sold_at: '2026-03-20', sold_price: 8200000, is_featured: false,
    },

    // Prahlad Nagar sold
    {
      agent: agent2, suburb_slug: 'prahlad-nagar', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'auction',
      street_number: '6', street_name: 'Corporate Road South', suburb: 'Prahlad Nagar', postcode: '380015',
      lat: 23.0162, lng: 72.5062, bedrooms: 3, bathrooms: 3, car_spaces: 2, land_size: 0, build_size: 165,
      price: 13000000, price_display: '₹1.3 Cr',
      headline: 'SOLD Under Hammer — 3 BHK, Prahlad Nagar',
      description: 'Auctioned property that attracted 6 registered bidders. Sold ₹12 L above reserve.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Video Door Phone'], outdoor: ['Spa','Infinity Pool','Concierge'], climate: ['Central AC'] },
      published_at: '2026-01-25', sold_at: '2026-02-22', sold_price: 13200000, is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'prahlad-nagar', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '20', street_name: 'Iscon Cross Road', suburb: 'Prahlad Nagar', postcode: '380015',
      lat: 23.0148, lng: 72.5045, bedrooms: 4, bathrooms: 3, car_spaces: 3, land_size: 0, build_size: 255,
      price: 20000000, price_display: '₹2 Cr',
      headline: 'SOLD — 4 BHK Sky Suite, Prahlad Nagar',
      description: 'Ultra-premium sky suite that set a new price record for the precinct.',
      features: { indoor: ['Smart Home','Private Elevator','12-ft Ceilings'], outdoor: ['Tennis Court','Fine Dining','Bowling Alley'], climate: ['Central AC','Radiant Heating'] },
      published_at: '2025-08-10', sold_at: '2025-09-05', sold_price: 19800000, is_featured: false,
    },

    // SG Highway sold
    {
      agent: agent3, suburb_slug: 'sg-highway', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '606', street_name: 'SGRD Complex', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0578, lng: 72.5050, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 108,
      price: 7400000, price_display: '₹74 L',
      headline: 'SOLD — 2 BHK on SG Highway',
      description: 'Investment-grade apartment near GIFT City. Sold to a corporate buyer.',
      features: { indoor: ['Air Conditioning','Modular Kitchen'], outdoor: ['Swimming Pool','Gymnasium'], climate: ['Air Conditioning'] },
      published_at: '2026-02-10', sold_at: '2026-02-28', sold_price: 7300000, is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'sg-highway', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '902', street_name: 'Sindhu Bhavan Marg', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0568, lng: 72.5035, bedrooms: 4, bathrooms: 3, car_spaces: 2, land_size: 0, build_size: 218,
      price: 12000000, price_display: '₹1.2 Cr',
      headline: 'SOLD — Luxury 4 BHK High-Rise, SG Highway',
      description: 'Landmark high-rise apartment with sunset views. Sold to an GIFT City executive.',
      features: { indoor: ['Smart Home','Air Conditioning','Modular Kitchen'], outdoor: ['3-Level Clubhouse','Indoor Sports','Pool'], climate: ['Central AC'] },
      published_at: '2025-12-20', sold_at: '2026-01-12', sold_price: 11800000, is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'sg-highway', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '15', street_name: 'SG Road Opp. Times Square', suburb: 'SG Highway', postcode: '380054',
      lat: 23.0592, lng: 72.5065, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 160,
      price: 9000000, price_display: '₹90 L',
      headline: 'SOLD — 3 BHK Premier Tower, SG Highway',
      description: 'High-floor apartment with commanding skyline views. Sold in a bidding contest.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Rooftop Lounge','Gymnasium','Co-Working Space'], climate: ['Air Conditioning'] },
      published_at: '2026-03-12', sold_at: '2026-04-01', sold_price: 9200000, is_featured: false,
    },

    // Thaltej sold
    {
      agent: agent2, suburb_slug: 'thaltej', listing_type: 'buy', property_type: 'house',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '8', street_name: 'Westgate Villas', suburb: 'Thaltej', postcode: '380054',
      lat: 23.0685, lng: 72.5055, bedrooms: 4, bathrooms: 4, car_spaces: 3, land_size: 350, build_size: 420,
      price: 22000000, price_display: '₹2.2 Cr',
      headline: 'SOLD — 4 BHK Villa in Westgate, Thaltej',
      description: 'Exclusive villa that sold off-market before the official launch.',
      features: { indoor: ['Italian Marble','Smart Home','Home Office'], outdoor: ['Private Pool','BBQ Area','3-Car Garage'], climate: ['Central AC','Solar Water Heater'] },
      published_at: '2025-11-01', sold_at: '2025-11-20', sold_price: 22500000, is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'thaltej', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '52', street_name: 'Thaltej Cross Road', suburb: 'Thaltej', postcode: '380054',
      lat: 23.0676, lng: 72.5042, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 105,
      price: 7200000, price_display: '₹72 L',
      headline: 'SOLD — 2 BHK New Construction, Thaltej',
      description: 'Brand-new 2 BHK near Thaltej Circle. Sold to first homebuyer within 10 days.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['CCTV','Lift','Covered Parking'], climate: ['Air Conditioning'] },
      published_at: '2026-04-01', sold_at: '2026-04-11', sold_price: 7100000, is_featured: false,
    },

    // Gota sold
    {
      agent: agent1, suburb_slug: 'gota', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '320', street_name: 'Gota Flyover Road', suburb: 'Gota', postcode: '382481',
      lat: 23.1025, lng: 72.5195, bedrooms: 2, bathrooms: 1, car_spaces: 1, land_size: 0, build_size: 84,
      price: 4900000, price_display: '₹49 L',
      headline: 'SOLD — 2 BHK in Gota — First Home Buyer Success',
      description: 'Sold in 12 days. One of Gota\'s fastest-moving properties this quarter.',
      features: { indoor: ['Modular Kitchen','Wardrobes'], outdoor: ['Society Parking','Children Play Area'], climate: ['Ceiling Fans'] },
      published_at: '2026-03-20', sold_at: '2026-04-01', sold_price: 4850000, is_featured: false,
    },
    {
      agent: agent3, suburb_slug: 'gota', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '60', street_name: 'Gota-Chanakyapuri Road', suburb: 'Gota', postcode: '382481',
      lat: 23.1040, lng: 72.5210, bedrooms: 3, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 128,
      price: 6000000, price_display: '₹60 L',
      headline: 'SOLD — 3 BHK Family Apartment, Gota',
      description: 'Popular family configuration in Gota. Sold to a growing family relocating from Chandkheda.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Lift','Security Guard','Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-02-05', sold_at: '2026-02-25', sold_price: 5900000, is_featured: false,
    },

    // Chandkheda sold
    {
      agent: agent2, suburb_slug: 'chandkheda', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '50', street_name: 'Chandkheda-Naroda Highway', suburb: 'Chandkheda', postcode: '382424',
      lat: 23.1182, lng: 72.5850, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 93,
      price: 4700000, price_display: '₹47 L',
      headline: 'SOLD — 2 BHK Near Chandkheda Metro',
      description: 'High-demand rental zone near ISRO and DRDO. Sold as investment property.',
      features: { indoor: ['Air Conditioning','Modular Kitchen'], outdoor: ['Society Parking','Lift'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-01-15', sold_at: '2026-02-02', sold_price: 4650000, is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'chandkheda', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '35', street_name: 'Gyanmanjari Complex', suburb: 'Chandkheda', postcode: '382424',
      lat: 23.1155, lng: 72.5820, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 135,
      price: 5800000, price_display: '₹58 L',
      headline: 'SOLD — Spacious 3 BHK, Chandkheda',
      description: 'Well-sized 3 BHK in a quiet Chandkheda society. Sold at full asking to a local family.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Garden','Covered Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-02-18', sold_at: '2026-03-05', sold_price: 5800000, is_featured: false,
    },

    // Maninagar sold
    {
      agent: agent3, suburb_slug: 'maninagar', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '28', street_name: 'Maninagar Station Road', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9958, lng: 72.6060, bedrooms: 3, bathrooms: 2, car_spaces: 2, land_size: 0, build_size: 133,
      price: 7000000, price_display: '₹70 L',
      headline: 'SOLD — 3 BHK Near Maninagar Station',
      description: 'Strong railway connectivity made this a sought-after buy. Sold after two inspections.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Wardrobes'], outdoor: ['Lift','Visitor Parking'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-01-28', sold_at: '2026-02-15', sold_price: 6900000, is_featured: false,
    },
    {
      agent: agent2, suburb_slug: 'maninagar', listing_type: 'buy', property_type: 'house',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '9', street_name: 'Jawahar Nagar', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9942, lng: 72.6044, bedrooms: 4, bathrooms: 3, car_spaces: 2, land_size: 165, build_size: 200,
      price: 9500000, price_display: '₹95 L',
      headline: 'SOLD — 4 BHK Independent House, Maninagar',
      description: 'Income-generating independent house — both floors rented at time of sale. Sold to an investor.',
      features: { indoor: ['Air Conditioning','Modular Kitchen','Pooja Room','Storage Room'], outdoor: ['Front Garden','Terrace','Two Parking Spots'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2025-12-05', sold_at: '2025-12-28', sold_price: 9300000, is_featured: false,
    },
    {
      agent: agent1, suburb_slug: 'maninagar', listing_type: 'buy', property_type: 'apartment',
      status: 'sold', sale_method: 'private_treaty',
      street_number: '70', street_name: 'Kankaria Road', suburb: 'Maninagar', postcode: '380008',
      lat: 22.9980, lng: 72.6090, bedrooms: 2, bathrooms: 2, car_spaces: 1, land_size: 0, build_size: 97,
      price: 5500000, price_display: '₹55 L',
      headline: 'SOLD — 2 BHK Near Kankaria Lake',
      description: 'Lake-proximity premium — sold within a week of listing.',
      features: { indoor: ['Air Conditioning','Renovated Kitchen','Wardrobes'], outdoor: ['Society Parking','Children Play Area'], climate: ['Air Conditioning','Ceiling Fans'] },
      published_at: '2026-04-05', sold_at: '2026-04-12', sold_price: 5600000, is_featured: false,
    },
  ];

  // ── Image pool (cycled across properties) ────────────────────────────────
  const imagePool = [
    ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
    ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'],
    ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80','https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&q=80'],
    ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80','https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80','https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80'],
    ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80','https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80'],
    ['https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=800&q=80','https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80','https://images.unsplash.com/photo-1560184897-502a475f7a0d?w=800&q=80'],
    ['https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80','https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80','https://images.unsplash.com/photo-1600047508788-786f3865b65c?w=800&q=80'],
    ['https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80','https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800&q=80','https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'],
    ['https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80','https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80','https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80'],
    ['https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80','https://images.unsplash.com/photo-1600573472550-8090733a21e0?w=800&q=80','https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80'],
    ['https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=800&q=80','https://images.unsplash.com/photo-1558442086-8ea4b6e45d8b?w=800&q=80','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'],
    ['https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80'],
    ['https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80','https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80'],
    ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80','https://images.unsplash.com/photo-1613977257592-4a9a32f9141b?w=800&q=80','https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80'],
    ['https://images.unsplash.com/photo-1416331108676-a22ccbe8ef03?w=800&q=80','https://images.unsplash.com/photo-1420331329021-4a7e7f7a0380?w=800&q=80','https://images.unsplash.com/photo-1465301055284-72f355b16d85?w=800&q=80'],
  ];

  const propIds = [];
  for (const p of properties) {
    const suburbId = suburbIds[p.suburb_slug];
    const r = await client.query(`
      INSERT INTO properties (
        agent_id, agency_id, suburb_id,
        listing_type, property_type, status, sale_method,
        street_number, street_name, suburb, state, postcode, lat, lng,
        location,
        bedrooms, bathrooms, car_spaces, land_size_sqm, build_size_sqm,
        price, price_display, is_price_hidden,
        headline, description, features,
        published_at, auction_at, sold_at, sold_price, is_featured
      ) VALUES (
        $1,$2,$3,
        $4,$5,$6,$7,
        $8,$9,$10,'GJ',$11,$12,$13,
        $29::geography,
        $14,$15,$16,$17,$18,
        $19,$20,false,
        $21,$22,$23,
        $24,$25,$26,$27,$28
      ) RETURNING id;
    `, [
      p.agent, agencyId, suburbId,
      p.listing_type, p.property_type, p.status, p.sale_method,
      p.street_number, p.street_name, p.suburb, p.postcode, p.lat, p.lng,
      p.bedrooms, p.bathrooms, p.car_spaces, p.land_size || null, p.build_size || null,
      p.price, p.price_display,
      p.headline, p.description, JSON.stringify(p.features),
      p.published_at, p.auction_at || null, p.sold_at || null, p.sold_price || null, p.is_featured,
      `SRID=4326;POINT(${p.lng} ${p.lat})`,
    ]);
    propIds.push(r.rows[0].id);
  }
  console.log('Properties:', propIds.length);

  // ── Property images ───────────────────────────────────────────────────────
  for (let i = 0; i < propIds.length; i++) {
    const imgs = imagePool[i % imagePool.length];
    for (let j = 0; j < imgs.length; j++) {
      await client.query(`
        INSERT INTO property_images (property_id, storage_path, cdn_url, sort_order, is_floor_plan)
        VALUES ($1,$2,$3,$4,false);
      `, [propIds[i], `properties/${propIds[i]}/${j}.webp`, imgs[j], j]);
    }
  }
  console.log('Property images added.');

  // ── Inspections (upcoming open homes for active buy listings) ─────────────
  const buyActivePropIds = propIds.filter((_, i) => properties[i].listing_type === 'buy' && properties[i].status === 'active');
  const baseDate = new Date('2026-05-17T10:00:00+05:30');
  for (let k = 0; k < buyActivePropIds.length; k++) {
    const pid = buyActivePropIds[k];
    const weekOffset = k % 3;
    const base = new Date(baseDate.getTime() + weekOffset * 7 * 86400000);
    await client.query(`
      INSERT INTO inspections (property_id, type, starts_at, ends_at, cancelled)
      VALUES ($1,'open_home',$2,$3,false);
    `, [pid, base.toISOString(), new Date(base.getTime() + 30 * 60000).toISOString()]);
    if (k % 2 === 0) {
      const base2 = new Date(base.getTime() + 86400000 + 3600000);
      await client.query(`
        INSERT INTO inspections (property_id, type, starts_at, ends_at, cancelled)
        VALUES ($1,'open_home',$2,$3,false);
      `, [pid, base2.toISOString(), new Date(base2.getTime() + 30 * 60000).toISOString()]);
    }
  }
  console.log('Inspections added.');

  // ── Schools (3 per suburb) ────────────────────────────────────────────────
  const schoolTemplates = [
    { suffix: 'International School', type: 'combined',   sector: 'independent', rating: 9 },
    { suffix: 'Government High School', type: 'secondary', sector: 'government',  rating: 6 },
    { suffix: 'Primary Academy',        type: 'primary',   sector: 'catholic',    rating: 7 },
  ];

  for (const [slug, suburbId] of Object.entries(suburbIds)) {
    const s = suburbData.find(x => x.slug === slug);
    for (const t of schoolTemplates) {
      await client.query(`
        INSERT INTO schools (name, type, sector, suburb, state, postcode, lat, lng, location, rating)
        VALUES ($1,$2,$3,$4,'GJ',$5,$6,$7,$8::geography,$9);
      `, (() => {
        const lat = s.lat + (Math.random() - 0.5) * 0.01;
        const lng = s.lng + (Math.random() - 0.5) * 0.01;
        return [`${s.name} ${t.suffix}`, t.type, t.sector, s.name, s.postcode, lat, lng, `SRID=4326;POINT(${lng} ${lat})`, t.rating];
      })());
    }
  }
  console.log('Schools added.');

  await client.end();
  console.log(`\nSeed complete! ${properties.length} properties across ${suburbData.length} suburbs.`);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
