/**
 * Genera 90 vacantes mock con campos realistas.
 * Distribución: CDMX, Monterrey, Guadalajara, Querétaro, Puebla, Remoto.
 * Salarios en MXN mensuales: 8,000 - 95,000.
 */

const CITIES = ['Ciudad de México', 'Monterrey', 'Guadalajara', 'Querétaro', 'Puebla', 'Remoto'];
const COMPANIES = [
  'Rappi', 'Mercado Libre', 'Amazon', 'Globant', 'BBVA', 'Santander', 'Wizeline',
  'Konfío', 'Bitso', 'Clip', 'Kavak', 'Stori', 'Albo', 'Nu', 'Cornershop',
  'Uber', 'DiDi', 'Platzi', 'Linio', 'OpenPay', 'Conekta', 'Mercado Pago',
  'Softtek', 'Tata Consultancy', 'Accenture', 'IBM', 'Microsoft', 'Google',
  'Facebook', 'Stripe', 'Shopify', 'Vercel', 'GitHub', 'Notion',
];
const TITLE_PREFIX = [
  'Senior', 'Lead', 'Junior', 'Mid', 'Staff', 'Principal', 'Tech Lead',
];
const TITLE_ROLE = [
  'React Native Developer', 'iOS Engineer', 'Android Developer', 'Full Stack Engineer',
  'Frontend Engineer', 'Mobile Engineer', 'DevOps Engineer', 'QA Automation',
  'Data Engineer', 'ML Engineer', 'Backend Developer', 'Cloud Architect',
  'Engineering Manager', 'Product Designer', 'UX Researcher', 'SRE',
  'Security Engineer', 'Platform Engineer', 'Tech Lead', 'Solutions Architect',
];
const TAGS = [
  ['react-native', 'typescript', 'expo'],
  ['swift', 'swiftui', 'ios'],
  ['kotlin', 'jetpack-compose', 'android'],
  ['nodejs', 'express', 'typescript'],
  ['react', 'nextjs', 'typescript'],
  ['python', 'django', 'aws'],
  ['aws', 'terraform', 'kubernetes'],
  ['cypress', 'playwright', 'qa'],
  ['python', 'spark', 'sql'],
  ['pytorch', 'tensorflow', 'ml'],
  ['go', 'grpc', 'postgres'],
  ['aws', 'gcp', 'azure'],
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randomInt(min, max, seed) {
  // Determinista según seed
  const x = Math.sin(seed * 9999) * 10000;
  const r = x - Math.floor(x);
  return Math.floor(min + r * (max - min));
}

function dateOffset(daysAgo, seed) {
  const base = Date.now() - daysAgo * 86400000;
  const jitter = randomInt(-12, 12, seed) * 3600000;
  return new Date(base + jitter).toISOString();
}

function makeDescription(role, company) {
  return `En ${company} buscamos un ${role} apasionado por construir productos de alto impacto. ` +
    `Trabajarás con un equipo multidisciplinario, definirás la arquitectura técnica y mentorizarás a otros engineers. ` +
    `Ofrecemos salario competitivo, equity, home office y presupuesto de aprendizaje continuo.`;
}

export function buildJobs(count = 90) {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const prefix = pick(TITLE_PREFIX, i);
    const role = pick(TITLE_ROLE, i * 7);
    const title = `${prefix} ${role}`;
    const company = pick(COMPANIES, i * 3);
    const city = pick(CITIES, i * 5);
    const hasSalary = i % 9 !== 0; // ~11% sin salario
    const salary = hasSalary ? randomInt(10, 95, i + 1) * 1000 : null;
    const tags = pick(TAGS, i * 11);
    jobs.push({
      id: `job_${String(i + 1).padStart(3, '0')}`,
      title,
      company,
      city,
      salary,
      description: makeDescription(role, company),
      publishedAt: dateOffset(randomInt(0, 60, i + 100), i + 200),
      tags,
    });
  }
  return jobs;
}
