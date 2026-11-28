-- Why a webhook was switched off: 'failures' (the receiver kept failing), 'owner_left' (the person
-- who set it up no longer manages integrations in the organization) or 'partner_inactive' (the
-- organization isn't active in Emanet). NULL while it is on.
ALTER TABLE webhooks ADD COLUMN disabled_reason TEXT;
UPDATE webhooks SET disabled_reason = 'failures' WHERE disabled_at IS NOT NULL;
