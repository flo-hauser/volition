const fallbackName = '[YOUR FULL NAME]';
const fallbackStreet = '[STREET AND HOUSE NUMBER]';
const fallbackPostalCode = '[POSTAL CODE]';
const fallbackCity = '[CITY]';
const fallbackCountry = '[COUNTRY]';
const fallbackEmail = '[YOUR EMAIL ADDRESS]';

function readEnv(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function assertProductionEnv(label: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }

  if (import.meta.env.PROD) {
    throw new Error(`Missing required legal environment variable: ${label}`);
  }

  return '';
}

export function useLegalContact() {
  const name = readEnv(
    assertProductionEnv('VITE_LEGAL_NAME', import.meta.env.VITE_LEGAL_NAME),
    fallbackName,
  );
  const street = readEnv(
    assertProductionEnv('VITE_LEGAL_STREET', import.meta.env.VITE_LEGAL_STREET),
    fallbackStreet,
  );
  const postalCode = readEnv(
    assertProductionEnv('VITE_LEGAL_POSTAL_CODE', import.meta.env.VITE_LEGAL_POSTAL_CODE),
    fallbackPostalCode,
  );
  const city = readEnv(
    assertProductionEnv('VITE_LEGAL_CITY', import.meta.env.VITE_LEGAL_CITY),
    fallbackCity,
  );
  const country = readEnv(
    assertProductionEnv('VITE_LEGAL_COUNTRY', import.meta.env.VITE_LEGAL_COUNTRY),
    fallbackCountry,
  );
  const email = readEnv(
    assertProductionEnv('VITE_LEGAL_EMAIL', import.meta.env.VITE_LEGAL_EMAIL),
    fallbackEmail,
  );

  return {
    name,
    street,
    postalCode,
    city,
    country,
    email,
    cityLine: `${postalCode} ${city}`,
  };
}
