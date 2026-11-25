/**
 * The contract with emanet-core's `PartnerApi` entrypoint (2earl/emanet-core src/index.ts), as
 * this app uses it. The core is the source of truth; keep these types in step with it.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string; detail?: string };

export type CaseStatus = 'pending_identity' | 'active' | 'delivered' | 'withdrawn' | 'expired';
export const CASE_STATUSES: readonly CaseStatus[] = [
  'active',
  'pending_identity',
  'delivered',
  'withdrawn',
  'expired',
];

export type PlaceKind = 'owner_home' | 'work' | 'last_seen' | 'other';
export const PLACE_KINDS: readonly PlaceKind[] = ['owner_home', 'work', 'last_seen', 'other'];

export interface PlaceInput {
  kind: PlaceKind;
  address: string;
  district: string;
  city: string;
  lat?: number;
  lng?: number;
  note?: string;
  attributes?: Record<string, unknown>;
}

export interface CaseInput {
  external_ref: string;
  vin?: string;
  plate: string;
  make: string;
  model: string;
  year?: number;
  colour?: string;
  icra_office: string;
  icra_file_no: string;
  serh_date: string;
  legal_basis: 'rehin' | 'haciz';
  places?: PlaceInput[];
  attributes?: Record<string, unknown>;
  vehicle_attributes?: Record<string, unknown>;
}

export interface CaseView {
  id: string;
  external_ref: string;
  status: CaseStatus;
  vehicle: {
    vin: string | null;
    plate: string;
    make: string;
    model: string;
    year: number | null;
    colour: string | null;
    attributes: Record<string, unknown>;
  };
  icra_office: string;
  icra_file_no: string;
  serh_date: string;
  legal_basis: 'rehin' | 'haciz';
  places: (PlaceInput & { id: string })[];
  attributes: Record<string, unknown>;
  fee_kurus: number;
  last_confirmed_at: number;
  expires_at: number;
  delivered_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Partner {
  id: string;
  orgId: string;
  kind: 'bank' | 'vys' | 'law_firm' | 'leasing' | 'other';
  legalName: string;
  status: 'invited' | 'active' | 'suspended';
  reconfirmDays: number;
}

export type FieldEntity = 'vehicle' | 'case' | 'place';

export interface FieldDefinition {
  key: string;
  labelTr: string;
  labelEn: string;
  type: 'text' | 'number' | 'date' | 'enum' | 'bool' | 'phone' | 'money';
  enumValues: string[] | null;
  required: boolean;
  deprecated: boolean;
  entity: FieldEntity;
}

export interface CoreEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  created_at: number;
}

/** The core's PartnerApi, as reached over the CORE Service Binding. */
export interface PartnerApi {
  partner(orgId: string): Promise<Result<Partner>>;
  upsertCase(orgId: string, actor: string, input: CaseInput): Promise<Result<CaseView>>;
  getCase(orgId: string, caseId: string): Promise<Result<CaseView>>;
  listCases(
    orgId: string,
    query: { status?: CaseStatus; updatedSince?: number; cursor?: string; limit?: number },
  ): Promise<Result<{ cases: CaseView[]; next_cursor: string | null }>>;
  confirmCases(
    orgId: string,
    actor: string,
    caseIds: string[],
  ): Promise<Result<{ confirmed: number }>>;
  withdrawCase(
    orgId: string,
    actor: string,
    caseId: string,
    reason: string,
  ): Promise<Result<CaseView>>;
  counts(orgId: string): Promise<Result<Record<CaseStatus, number>>>;
  schema(orgId: string, entity: FieldEntity): Promise<Result<FieldDefinition[]>>;
  events(
    orgId: string,
    cursor: string | null,
    limit?: number,
  ): Promise<Result<{ events: CoreEvent[]; next_cursor: string | null }>>;
}

export const core = (env: Env): PartnerApi => env.CORE as unknown as PartnerApi;

/** login's OrganizationDirectory (2earl/login src/org-directory.ts). */
export type OrgRole = 'owner' | 'admin' | 'auditor' | 'member';
export interface OrganizationDirectory {
  membershipsOf(userId: string): Promise<{ orgId: string; name: string; role: OrgRole }[]>;
  roleOf(orgId: string, userId: string): Promise<OrgRole | null>;
}
export const orgs = (env: Env): OrganizationDirectory =>
  env.ORGS as unknown as OrganizationDirectory;

/** What each organization role may do here. */
export const can = {
  /** Add, change, confirm and withdraw cases; upload CSV. */
  writeCases: (role: OrgRole) => role !== 'auditor',
  /** API keys and webhooks: they act for the whole organization. */
  manageIntegrations: (role: OrgRole) => role === 'owner' || role === 'admin',
};
