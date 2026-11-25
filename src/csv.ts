import type { CaseInput, FieldDefinition, PlaceInput, PlaceKind } from './core';

/**
 * CSV upload (docs/DESIGN.md §5): one row per place, rows with the same reference are one case.
 * Column names in English or Turkish; `;`, `,` or tab as separator (Turkish Excel saves with `;`);
 * dates as YYYY-MM-DD or DD.MM.YYYY. Custom fields are columns named `case.<key>`,
 * `vehicle.<key>` or `place.<key>`. The core checks every case again on import.
 */

export const MAX_BYTES = 2_000_000;
export const MAX_ROWS = 2000;
export const MAX_CASES = 500;

const COLUMNS: Record<string, keyof Row> = {
  external_ref: 'external_ref',
  referans: 'external_ref',
  vin: 'vin',
  sasi_no: 'vin',
  şasi_no: 'vin',
  plate: 'plate',
  plaka: 'plate',
  make: 'make',
  marka: 'make',
  model: 'model',
  year: 'year',
  yil: 'year',
  yıl: 'year',
  colour: 'colour',
  color: 'colour',
  renk: 'colour',
  icra_office: 'icra_office',
  icra_dairesi: 'icra_office',
  icra_file_no: 'icra_file_no',
  dosya_no: 'icra_file_no',
  serh_date: 'serh_date',
  serh_tarihi: 'serh_date',
  şerh_tarihi: 'serh_date',
  legal_basis: 'legal_basis',
  dayanak: 'legal_basis',
  place_kind: 'place_kind',
  yer_turu: 'place_kind',
  yer_türü: 'place_kind',
  address: 'address',
  adres: 'address',
  district: 'district',
  ilce: 'district',
  ilçe: 'district',
  city: 'city',
  il: 'city',
  lat: 'lat',
  enlem: 'lat',
  lng: 'lng',
  boylam: 'lng',
  note: 'note',
  not: 'note',
};

interface Row {
  external_ref: string;
  vin: string;
  plate: string;
  make: string;
  model: string;
  year: string;
  colour: string;
  icra_office: string;
  icra_file_no: string;
  serh_date: string;
  legal_basis: string;
  place_kind: string;
  address: string;
  district: string;
  city: string;
  lat: string;
  lng: string;
  note: string;
}

const PLACE_KINDS: Record<string, PlaceKind> = {
  owner_home: 'owner_home',
  home: 'owner_home',
  ev: 'owner_home',
  ikamet: 'owner_home',
  work: 'work',
  iş: 'work',
  is: 'work',
  last_seen: 'last_seen',
  son_görülen: 'last_seen',
  son_gorulen: 'last_seen',
  other: 'other',
  diğer: 'other',
  diger: 'other',
};

export interface Parsed {
  cases: CaseInput[];
  errors: { row: number; message: string }[];
}

/** RFC 4180 rows: quoted fields, doubled quotes, CR LF or LF. */
export function splitCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? '';
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

function detectDelimiter(headerLine: string): string {
  const counts = [';', ',', '\t'].map((d) => [d, headerLine.split(d).length] as const);
  return counts.sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',';
}

const normalizeHeader = (value: string) =>
  value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '_');

/** YYYY-MM-DD, or DD.MM.YYYY / DD/MM/YYYY as Turkish spreadsheets write it. */
export function parseDate(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(v);
  if (!m) return null;
  return `${m[3] ?? ''}-${(m[2] ?? '').padStart(2, '0')}-${(m[1] ?? '').padStart(2, '0')}`;
}

/** "1.234,56" or "1234.56" or "1234" (lira) → kuruş. */
export function parseLira(value: string): number | null {
  let v = value.trim().replace(/\s|₺|TL$/gi, '');
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(v) || /^\d+,\d{1,2}$/.test(v)) {
    v = v.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100);
}

export function typedValue(
  field: FieldDefinition,
  raw: string,
): { ok: true; value: unknown } | { ok: false } {
  const v = raw.trim();
  switch (field.type) {
    case 'number': {
      const n = Number(v.replace(',', '.'));
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false };
    }
    case 'money': {
      const kurus = parseLira(v);
      return kurus === null ? { ok: false } : { ok: true, value: kurus };
    }
    case 'bool': {
      const lower = v.toLocaleLowerCase('tr-TR');
      if (['true', 'evet', '1', 'yes'].includes(lower)) return { ok: true, value: true };
      if (['false', 'hayır', 'hayir', '0', 'no'].includes(lower)) return { ok: true, value: false };
      return { ok: false };
    }
    case 'date': {
      const date = parseDate(v);
      return date === null ? { ok: false } : { ok: true, value: date };
    }
    default:
      return { ok: true, value: v };
  }
}

export function parseCases(
  text: string,
  fields: { case: FieldDefinition[]; vehicle: FieldDefinition[]; place: FieldDefinition[] },
): Parsed {
  const errors: Parsed['errors'] = [];
  const clean = text.replace(/^\uFEFF/, '');
  if (clean.includes('�')) {
    return {
      cases: [],
      errors: [{ row: 1, message: 'The file is not UTF-8. In Excel, save it as “CSV UTF-8”.' }],
    };
  }
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const rows = splitCsv(clean, detectDelimiter(firstLine));
  const [header, ...data] = rows;
  if (!header || data.length === 0) {
    return { cases: [], errors: [{ row: 1, message: 'The file has no rows below the header.' }] };
  }
  if (data.length > MAX_ROWS) {
    return {
      cases: [],
      errors: [{ row: 1, message: `At most ${String(MAX_ROWS)} rows per file.` }],
    };
  }

  type Custom = { entity: 'case' | 'vehicle' | 'place'; field: FieldDefinition };
  const columns: ({ core: keyof Row } | { custom: Custom } | null)[] = [];
  for (const [index, name] of header.entries()) {
    const key = normalizeHeader(name);
    const core = COLUMNS[key];
    if (core) {
      columns.push({ core });
      continue;
    }
    const custom = /^(case|vehicle|place)\.([a-z][a-z0-9_]*)$/.exec(key);
    const entity = custom?.[1] as Custom['entity'] | undefined;
    const field = entity ? fields[entity].find((f) => f.key === custom?.[2]) : undefined;
    if (entity && field) {
      columns.push({ custom: { entity, field } });
      continue;
    }
    errors.push({
      row: 1,
      message: `Unknown column “${name.trim()}” (column ${String(index + 1)}).`,
    });
    columns.push(null);
  }
  if (errors.length > 0) return { cases: [], errors };

  const byRef = new Map<string, CaseInput>();
  for (const [offset, values] of data.entries()) {
    const rowNumber = offset + 2;
    const row = Object.fromEntries(
      Object.keys(COLUMNS).map((k) => [COLUMNS[k], '']),
    ) as unknown as Row;
    const attrs = {
      case: {} as Record<string, unknown>,
      vehicle: {} as Record<string, unknown>,
      place: {} as Record<string, unknown>,
    };
    let rowOk = true;
    for (const [index, column] of columns.entries()) {
      const raw = values[index] ?? '';
      if (!column) continue;
      if ('core' in column) {
        row[column.core] = raw.trim();
      } else if (raw.trim() !== '') {
        const value = typedValue(column.custom.field, raw);
        if (!value.ok) {
          errors.push({
            row: rowNumber,
            message: `“${raw}” is not a valid ${column.custom.field.key}.`,
          });
          rowOk = false;
        } else attrs[column.custom.entity][column.custom.field.key] = value.value;
      }
    }
    if (!rowOk) continue;
    if (!row.external_ref) {
      errors.push({ row: rowNumber, message: 'The reference (external_ref) is empty.' });
      continue;
    }

    let place: PlaceInput | null = null;
    if (row.address || row.district || row.city) {
      const kind = PLACE_KINDS[row.place_kind.toLocaleLowerCase('tr-TR') || 'owner_home'];
      if (!kind) {
        errors.push({ row: rowNumber, message: `“${row.place_kind}” is not a kind of place.` });
        continue;
      }
      place = { kind, address: row.address, district: row.district, city: row.city };
      if (row.lat || row.lng) {
        const lat = Number(row.lat.replace(',', '.'));
        const lng = Number(row.lng.replace(',', '.'));
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          errors.push({ row: rowNumber, message: 'Latitude and longitude must be numbers.' });
          continue;
        }
        place.lat = lat;
        place.lng = lng;
      }
      if (row.note) place.note = row.note;
      if (Object.keys(attrs.place).length > 0) place.attributes = attrs.place;
    }

    const existing = byRef.get(row.external_ref);
    if (existing) {
      if (row.plate && row.plate !== existing.plate) {
        errors.push({
          row: rowNumber,
          message: `Reference ${row.external_ref} has two different plates.`,
        });
        continue;
      }
      if (place) existing.places = [...(existing.places ?? []), place];
      continue;
    }

    const serhDate = parseDate(row.serh_date);
    if (!serhDate) {
      errors.push({ row: rowNumber, message: `“${row.serh_date}” is not a date.` });
      continue;
    }
    const basis = row.legal_basis.toLocaleLowerCase('tr-TR');
    if (basis !== 'rehin' && basis !== 'haciz') {
      errors.push({ row: rowNumber, message: 'The legal basis must be rehin or haciz.' });
      continue;
    }
    const input: CaseInput = {
      external_ref: row.external_ref,
      plate: row.plate,
      make: row.make,
      model: row.model,
      icra_office: row.icra_office,
      icra_file_no: row.icra_file_no,
      serh_date: serhDate,
      legal_basis: basis,
      places: place ? [place] : [],
    };
    if (row.vin) input.vin = row.vin;
    if (row.year) {
      const year = Number(row.year);
      if (!Number.isInteger(year)) {
        errors.push({ row: rowNumber, message: `“${row.year}” is not a year.` });
        continue;
      }
      input.year = year;
    }
    if (row.colour) input.colour = row.colour;
    if (Object.keys(attrs.case).length > 0) input.attributes = attrs.case;
    if (Object.keys(attrs.vehicle).length > 0) input.vehicle_attributes = attrs.vehicle;
    byRef.set(row.external_ref, input);
    if (byRef.size > MAX_CASES) {
      return {
        cases: [],
        errors: [{ row: rowNumber, message: `At most ${String(MAX_CASES)} cases per file.` }],
      };
    }
  }
  return { cases: [...byRef.values()], errors };
}

/** The template a partner downloads: core columns and its own custom fields. */
export function templateCsv(fields: {
  case: FieldDefinition[];
  vehicle: FieldDefinition[];
  place: FieldDefinition[];
}): string {
  const columns = [
    'external_ref',
    'vin',
    'plate',
    'make',
    'model',
    'year',
    'colour',
    'icra_office',
    'icra_file_no',
    'serh_date',
    'legal_basis',
    'place_kind',
    'address',
    'district',
    'city',
    'lat',
    'lng',
    'note',
    ...fields.case.filter((f) => !f.deprecated).map((f) => `case.${f.key}`),
    ...fields.vehicle.filter((f) => !f.deprecated).map((f) => `vehicle.${f.key}`),
    ...fields.place.filter((f) => !f.deprecated).map((f) => `place.${f.key}`),
  ];
  const example = [
    'K-2026-0001',
    'VF1RJA00061234567',
    '34 ABC 123',
    'Renault',
    'Clio',
    '2021',
    'Beyaz',
    'İstanbul 5. İcra Dairesi',
    '2026/12345',
    '01.10.2026',
    'rehin',
    'owner_home',
    'Örnek Mah. Deneme Sk. No:1',
    'Kadıköy',
    'İstanbul',
    '',
    '',
    '',
  ];
  const quote = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return `\uFEFF${columns.map(quote).join(';')}\r\n${example.map(quote).join(';')}\r\n`;
}
