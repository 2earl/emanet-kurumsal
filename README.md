# Emanet Kurumsal

Emanet for creditors at **emanet-kurumsal.2earl.com**. Banks, asset management companies and
their law firms add the vehicles their enforcement files allow them to take, follow each case,
and are told when a vehicle reaches a custodian car park.

- **Web app**: sign in with login.2earl.com. Pages per login organization, by role:
  - members add vehicles (form or CSV upload) and withdraw or confirm cases;
  - auditors read;
  - owners and admins also manage API keys and webhooks, after a fresh second factor.
- **API** at `/api/v1`, with scoped API keys: cases, schema, events. Reference at `/docs/api`.
- **Webhooks**: `case.delivered`, `case.expired`, `invoice.issued`. Signed with HMAC-SHA256,
  retried with backoff for a day, switched off after 20 failures in a row.
- **Turkish and English**, the same language engine as login and promptshare.

The data and rules live in [emanet-core](https://github.com/2earl/emanet-core): this app reaches
its `PartnerApi` entrypoint over a Service Binding and can do only what a creditor may. Its own
database holds sign-in sessions, API keys (as HMACs), webhooks (secrets encrypted) and the
delivery log. Design: emanet-core `docs/DESIGN.md` §5.

Emanet is a private service, not a public authority.

## Develop

```sh
pnpm install
pnpm test        # Workers runtime, with stand-ins for login and emanet-core
pnpm typecheck
pnpm lint
```

## Licence

Proprietary; see [LICENSE](LICENSE).
