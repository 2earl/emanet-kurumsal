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

// ---- Onboarding (2earl/emanet-core src/onboarding.ts) ----------------------------------------

export type OnboardingStatus =
  'invited' | 'in_progress' | 'signed' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export type DocumentKind =
  'signed_contract' | 'signature_circular' | 'tax_certificate' | 'trade_registry' | 'other';
export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  'signature_circular',
  'tax_certificate',
  'trade_registry',
  'signed_contract',
  'other',
];
export const REQUIRED_DOCUMENTS: readonly DocumentKind[] = [
  'signature_circular',
  'tax_certificate',
];

export interface CompanyDetails {
  legalName: string;
  address: string;
  taxOffice: string;
  vkn: string;
  mersis: string | null;
  kep: string | null;
  signatoryName: string;
  signatoryTitle: string;
  billingEmail: string;
  operationsName: string;
  operationsEmail: string;
  operationsPhone: string;
  eInvoice: boolean;
}

export interface InvitationView {
  id: string;
  company: string;
  contact_name: string;
  contact_email: string;
  locale: 'tr' | 'en';
  invited_by: string;
  status: OnboardingStatus;
  expires_at: number;
  claimed_by: string | null;
}

export interface OnboardingDocument {
  id: string;
  kind: DocumentKind;
  file_ref: string;
  sha256: string;
  file_name: string;
  content_type: string;
  size: number;
  uploaded_at: number;
}

export interface Onboarding {
  id: string;
  kind: Partner['kind'];
  company: string;
  contact_name: string;
  contact_email: string;
  locale: 'tr' | 'en';
  price_list: {
    default_kurus: number;
    rules: {
      make?: string;
      model?: string;
      year_from?: number;
      year_to?: number;
      fee_kurus: number;
    }[];
  } | null;
  reconfirm_days: number;
  status: OnboardingStatus;
  invited_by: string;
  expires_at: number;
  org_id: string | null;
  details: CompanyDetails | null;
  contract_version: string | null;
  contract_sha256: string | null;
  signer_name: string | null;
  signer_title: string | null;
  signed_at: number | null;
  decision_reason: string | null;
  partner_id: string | null;
  documents: OnboardingDocument[];
  contract_text?: string | null;
}

export interface RenderedContract {
  version: string;
  sections: { title: string; paragraphs: string[] }[];
  text: string;
  sha256: string;
  /** False while 2earl's own details are missing: it can be read, not accepted. */
  final: boolean;
}

/** The core's PartnerApi, as reached over the CORE Service Binding. */
export interface PartnerApi {
  onboardingInvitation(token: string): Promise<Result<InvitationView>>;
  claimOnboarding(token: string, userId: string): Promise<Result<{ id: string }>>;
  myOnboardings(userId: string): Promise<Result<Onboarding[]>>;
  onboarding(id: string, userId: string): Promise<Result<Onboarding>>;
  linkOnboardingOrganization(id: string, userId: string, orgId: string): Promise<Result<null>>;
  saveOnboardingDetails(
    id: string,
    userId: string,
    details: Record<string, unknown>,
  ): Promise<Result<CompanyDetails>>;
  addOnboardingDocument(
    id: string,
    userId: string,
    document: Omit<OnboardingDocument, 'id' | 'uploaded_at'>,
  ): Promise<Result<{ id: string }>>;
  onboardingContract(id: string, userId: string): Promise<Result<RenderedContract>>;
  signOnboarding(
    id: string,
    userId: string,
    input: {
      version: string;
      sha256: string;
      name: string;
      title: string;
      ip: string | null;
      authorised: boolean;
    },
  ): Promise<Result<null>>;

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

/** login's OrganizationProvisioning (2earl/login src/org-provisioning.ts). */
export interface OrganizationProvisioning {
  hasAddress(userId: string, email: string): Promise<boolean>;
  create(request: {
    ownerId: string;
    email: string;
    name: string;
    invitedBy: string;
    service: string;
  }): Promise<
    | { ok: true; orgId: string }
    | { ok: false; reason: 'no_account' | 'wrong_address' | 'not_staff' | 'invalid_name' | 'full' }
  >;
}
export const provisioning = (env: Env): OrganizationProvisioning =>
  env.ORG_PROVISIONING as unknown as OrganizationProvisioning;
