import type { Migration } from './migrations';
export const CRM_ORGANIZATION_CONTACTS_MIGRATION:Migration={id:74,name:'crm_organization_contact_links',sql:`
  CREATE TABLE organization_contact_links(
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    job_title TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,archived_at TEXT,
    provenance TEXT NOT NULL,
    PRIMARY KEY(organization_id,contact_id)
  ) STRICT;
  CREATE INDEX idx_org_contact_person ON organization_contact_links(contact_id,archived_at);
  INSERT INTO organization_contact_links
  SELECT organization_id,id,job_title,created_at,updated_at,archived_at,'legacy-contacts.organization_id/job_title'
  FROM contacts WHERE organization_id IS NOT NULL;
  CREATE TRIGGER crm_contact_initial_association AFTER INSERT ON contacts WHEN NEW.organization_id IS NOT NULL
  BEGIN
    INSERT INTO organization_contact_links VALUES(NEW.organization_id,NEW.id,NEW.job_title,NEW.created_at,NEW.updated_at,NEW.archived_at,'contact-creation');
  END;
`};
