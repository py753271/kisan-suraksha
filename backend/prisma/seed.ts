import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Complete system access' },
    { name: 'STATE_ADMIN', description: 'State authority disaster manager' },
    { name: 'DISTRICT_ADMIN', description: 'District monitoring authority' },
    { name: 'AGRICULTURE_OFFICER', description: 'Agricultural advisories supervisor' },
    { name: 'FARMER', description: 'Standard farm subscriber' },
  ];

  const dbRoles: Record<string, any> = {};
  for (const role of roles) {
    dbRoles[role.name] = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log(`- Seeded ${roles.length} roles.`);

  // 2. Permissions
  const permissions = [
    { name: 'user:read', description: 'View user profile' },
    { name: 'user:write', description: 'Modify user profile' },
    { name: 'alert:create', description: 'Issue warning alert' },
    { name: 'alert:read', description: 'View warning alert list' },
    { name: 'alert:update', description: 'Edit or cancel warning alert' },
    { name: 'crop:create', description: 'Publish crop advisory' },
    { name: 'crop:read', description: 'View crop advisories' },
    { name: 'emergency:sos', description: 'Emit SOS distress trigger' },
    { name: 'emergency:read', description: 'Monitor active SOS alerts' },
    { name: 'dashboard:view', description: 'Access dashboard analytics' },
  ];

  const dbPermissions: Record<string, any> = {};
  for (const perm of permissions) {
    dbPermissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`- Seeded ${permissions.length} permissions.`);

  // 3. RolePermission mappings
  // Super Admin gets all permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: dbRoles['SUPER_ADMIN'].id,
          permissionId: dbPermissions[perm.name].id,
        },
      },
      update: {},
      create: {
        roleId: dbRoles['SUPER_ADMIN'].id,
        permissionId: dbPermissions[perm.name].id,
      },
    });
  }

  // Farmer gets user, alert read, crop read, and emergency:sos permissions
  const farmerPerms = ['user:read', 'user:write', 'alert:read', 'crop:read', 'emergency:sos'];
  for (const name of farmerPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: dbRoles['FARMER'].id,
          permissionId: dbPermissions[name].id,
        },
      },
      update: {},
      create: {
        roleId: dbRoles['FARMER'].id,
        permissionId: dbPermissions[name].id,
      },
    });
  }
  console.log('- Seeded RolePermission mappings.');

  // 4. Alert Categories
  const categories = [
    { name: 'Rain', description: 'Precipitation and extreme rainfall alerts' },
    { name: 'Flood', description: 'River overflow and flooding alerts' },
    { name: 'Cyclone', description: 'Tropical storm alerts' },
    { name: 'Heatwave', description: 'Excessive high temperature warnings' },
    { name: 'Cold Wave', description: 'Extreme cold temperature warnings' },
    { name: 'Lightning', description: 'High probability lightning strikes warnings' },
    { name: 'Thunderstorm', description: 'Severe convective storms warnings' },
    { name: 'Earthquake', description: 'Seismic activity warnings' },
    { name: 'Landslide', description: 'Slope displacement and debris flow warnings' },
  ];

  for (const cat of categories) {
    await prisma.alertCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log(`- Seeded ${categories.length} alert categories.`);

  // 5. Alert Severities
  const severities = [
    { name: 'info', colorCode: '#3B82F6' },
    { name: 'minor', colorCode: '#10B981' },
    { name: 'moderate', colorCode: '#F59E0B' },
    { name: 'severe', colorCode: '#EF4444' },
    { name: 'extreme', colorCode: '#7F1D1D' },
  ];

  for (const sev of severities) {
    await prisma.alertSeverity.upsert({
      where: { name: sev.name },
      update: { colorCode: sev.colorCode },
      create: sev,
    });
  }
  console.log(`- Seeded ${severities.length} alert severities.`);

  // 6. Location Hierarchy (Country -> States -> Districts -> Tehsils -> Villages)
  const india = await prisma.country.upsert({
    where: { code: 'IN' },
    update: {},
    create: { name: 'India', code: 'IN' },
  });

  const locationsData = [
    {
      stateName: 'Gujarat',
      stateCode: 'GJ',
      districtName: 'Rajkot',
      districtCode: 'GJ_RAJ',
      tehsilName: 'Jetpur',
      tehsilCode: 'GJ_RAJ_JET',
      villageName: 'Jetpur Village',
      villageCode: 'GJ_RAJ_JET_VIL',
    },
    {
      stateName: 'Bihar',
      stateCode: 'BR',
      districtName: 'Patna',
      districtCode: 'BR_PAT',
      tehsilName: 'Danapur',
      tehsilCode: 'BR_PAT_DAN',
      villageName: 'Danapur Village',
      villageCode: 'BR_PAT_DAN_VIL',
    },
    {
      stateName: 'Punjab',
      stateCode: 'PB',
      districtName: 'Bathinda',
      districtCode: 'PB_BTI',
      tehsilName: 'Maur',
      tehsilCode: 'PB_BTI_MA',
      villageName: 'Maur Village',
      villageCode: 'PB_BTI_MA_VIL',
    },
  ];

  for (const item of locationsData) {
    const state = await prisma.state.upsert({
      where: { code: item.stateCode },
      update: {},
      create: { name: item.stateName, code: item.stateCode, countryId: india.id },
    });

    const district = await prisma.district.upsert({
      where: { code: item.districtCode },
      update: {},
      create: { name: item.districtName, code: item.districtCode, stateId: state.id },
    });

    const tehsil = await prisma.tehsil.upsert({
      where: { code: item.tehsilCode },
      update: {},
      create: { name: item.tehsilName, code: item.tehsilCode, districtId: district.id },
    });

    await prisma.village.upsert({
      where: { code: item.villageCode },
      update: {},
      create: { name: item.villageName, code: item.villageCode, tehsilId: tehsil.id },
    });
  }
  console.log('- Seeded geographic regions hierarchy.');

  // 7. Government Sources
  const sources = [
    { name: 'India Meteorological Department (IMD)', type: 'IMD', endpointUrl: 'https://api.imd.gov.in/v1', syncFrequency: '*/15 * * * *' },
    { name: 'National Disaster Management Authority (NDMA)', type: 'NDMA', endpointUrl: 'https://api.ndma.gov.in/v1', syncFrequency: '0 * * * *' },
    { name: 'Central Water Commission (CWC)', type: 'CWC', endpointUrl: 'https://api.cwc.gov.in/v1', syncFrequency: '*/30 * * * *' },
    { name: 'INCOIS', type: 'INCOIS', endpointUrl: 'https://api.incois.gov.in/v1', syncFrequency: '0 */2 * * *' },
    { name: 'MOSDAC', type: 'MOSDAC', endpointUrl: 'https://api.mosdac.gov.in/v1', syncFrequency: '0 0 * * *' },
    { name: 'Bhuvan', type: 'BHUVAN', endpointUrl: 'https://api.bhuvan.nrsc.gov.in/v1', syncFrequency: '0 0 1 * *' },
    { name: 'Open Government Data Platform', type: 'OGD', endpointUrl: 'https://data.gov.in/api/v1', syncFrequency: '0 0 * * *' },
  ];

  for (const src of sources) {
    await prisma.governmentSource.upsert({
      where: { name: src.name },
      update: { endpointUrl: src.endpointUrl, syncFrequency: src.syncFrequency },
      create: src,
    });
  }
  console.log(`- Seeded ${sources.length} government sources.`);

  // 8. Crop Categories
  const cropCats = [
    { name: 'Cereals', description: 'Wheat, Paddy, Maize, etc.' },
    { name: 'Cash Crops', description: 'Sugarcane, Cotton, etc.' },
    { name: 'Pulses', description: 'Lentils, Chickpeas, etc.' },
    { name: 'Oilseeds', description: 'Mustard, Sunflower, etc.' },
    { name: 'Vegetables', description: 'Potato, Onion, Tomato, etc.' },
  ];

  const dbCropCats: Record<string, any> = {};
  for (const cat of cropCats) {
    dbCropCats[cat.name] = await prisma.cropCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log(`- Seeded ${cropCats.length} crop categories.`);

  // 9. Crops
  const cropsList = [
    { name: 'Wheat', categoryName: 'Cereals' },
    { name: 'Paddy', categoryName: 'Cereals' },
    { name: 'Sugarcane', categoryName: 'Cash Crops' },
    { name: 'Maize', categoryName: 'Cereals' },
    { name: 'Pulses', categoryName: 'Pulses' },
    { name: 'Mustard', categoryName: 'Oilseeds' },
    { name: 'Potato', categoryName: 'Vegetables' },
    { name: 'Onion', categoryName: 'Vegetables' },
    { name: 'Tomato', categoryName: 'Vegetables' },
    { name: 'Cotton', categoryName: 'Cash Crops' },
  ];

  for (const crop of cropsList) {
    await prisma.crop.upsert({
      where: { name: crop.name },
      update: {},
      create: { name: crop.name, categoryId: dbCropCats[crop.categoryName].id },
    });
  }
  console.log(`- Seeded ${cropsList.length} crops.`);

  // 10. Notification Templates
  const templates = [
    { name: 'WEATHER_WARN_SMS', subject: 'IMD Alert', body: 'Weather Alert: {{alert}} is expected in {{village}} today. Stay safe.', channel: 'SMS', language: 'en' },
    { name: 'CROP_ADVISORY_SMS', subject: 'Agri Advisory', body: 'Crop Advisory for {{crop}}: Due to {{weather}}, we advise {{name}} to take {{severity}} preventive actions.', channel: 'SMS', language: 'en' },
    { name: 'SOS_TRIGGERED_PUSH', subject: 'SOS Beacon Emitted', body: 'SOS Triggered by User {{name}} in Village {{village}}. Disaster: {{alert}}.', channel: 'Push', language: 'en' },
  ];

  for (const temp of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: temp.name },
      update: { body: temp.body, subject: temp.subject },
      create: temp,
    });
  }
  console.log(`- Seeded ${templates.length} notification templates.`);

  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
