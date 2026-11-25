import { describe, expect, it } from 'vitest';
import type { FieldDefinition } from '../src/core';
import { parseCases, parseDate, parseLira, splitCsv, templateCsv } from '../src/csv';

const none = { case: [], vehicle: [], place: [] };
const money: FieldDefinition = {
  key: 'principal',
  labelTr: 'Anapara',
  labelEn: 'Principal',
  type: 'money',
  enumValues: null,
  required: false,
  deprecated: false,
  entity: 'case',
};

describe('CSV', () => {
  it('splits quoted fields, doubled quotes and CRLF', () => {
    expect(splitCsv('a;"b;c";"d ""e"""\r\n1;2;3\r\n', ';')).toEqual([
      ['a', 'b;c', 'd "e"'],
      ['1', '2', '3'],
    ]);
  });

  it('reads Turkish dates and lira amounts', () => {
    expect(parseDate('1.10.2026')).toBe('2026-10-01');
    expect(parseDate('2026-10-01')).toBe('2026-10-01');
    expect(parseDate('10/2026')).toBeNull();
    expect(parseLira('1.234,56')).toBe(123_456);
    expect(parseLira('1234.5')).toBe(123_450);
    expect(parseLira('₺ 2.000')).toBe(200_000);
    expect(parseLira('abc')).toBeNull();
  });

  it('merges rows of one reference into one case with several places', () => {
    const csv = [
      'external_ref,plate,make,model,icra_office,icra_file_no,serh_date,legal_basis,address,district,city,case.principal',
      'A,34ABC123,Renault,Clio,Ofis,1,2026-01-01,rehin,X Sk,Kadıköy,İstanbul,"1.500,00"',
      'A,,,,,,,,Y Sk,Üsküdar,İstanbul,',
    ].join('\n');
    const parsed = parseCases(csv, { ...none, case: [money] });
    expect(parsed.errors).toEqual([]);
    expect(parsed.cases).toHaveLength(1);
    expect(parsed.cases[0]?.places?.map((p) => p.district)).toEqual(['Kadıköy', 'Üsküdar']);
    expect(parsed.cases[0]?.attributes).toEqual({ principal: 150_000 });
  });

  it('refuses files that are not UTF-8, unknown columns and two plates for one reference', () => {
    expect(parseCases('plaka\nx�\n', none).errors[0]?.message).toContain('UTF-8');
    expect(parseCases('plaka,whatever\n34ABC123,1\n', none).errors[0]?.message).toContain(
      'Unknown column',
    );
    const twoPlates = parseCases(
      'external_ref,plate,make,model,icra_office,icra_file_no,serh_date,legal_basis\nA,34ABC123,R,C,O,1,2026-01-01,rehin\nA,06AB123,,,,,,\n',
      none,
    );
    expect(twoPlates.errors[0]?.message).toContain('two different plates');
  });

  it('offers a template with the partner’s own columns', () => {
    const template = templateCsv({ ...none, case: [money] });
    expect(template.startsWith('﻿external_ref;vin;plate')).toBe(true);
    expect(template).toContain('case.principal');
    expect(parseCases(template, { ...none, case: [money] }).errors).toEqual([]);
  });
});
