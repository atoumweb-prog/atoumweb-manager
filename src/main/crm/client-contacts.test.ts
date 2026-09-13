import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ClientContactService } from './ClientContactService';
import { CrmService } from './CrmService';

describe('contacts client', () => {
  it('ajoute plusieurs contacts et change le contact principal sans doublon', () => {
    const database = new NodeSqliteAdapter(':memory:');
    database.exec('PRAGMA foreign_keys = ON;');
    applyPendingMigrations(database);

    const crm = new CrmService(database);
    const clientContacts = new ClientContactService(database, crm);

    const organization = crm.createOrganization({ name: 'Atoum Test' });
    const primary = crm.createContact({
      organizationId: organization.id,
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.test',
    });
    const client = crm.createClient({
      organizationId: organization.id,
      primaryContactId: primary.id,
      status: 'active',
    });

    const billing = clientContacts.add(
      client.id,
      {
        firstName: 'Bob',
        lastName: 'Durand',
        email: 'bob@example.test',
      },
      'billing',
    );

    let links = clientContacts.list(client.id);
    expect(links).toHaveLength(2);
    expect(links.find((link) => link.contactId === primary.id)?.isPrimary).toBe(true);
    expect(billing.role).toBe('billing');
    expect(billing.isPrimary).toBe(false);

    clientContacts.setPrimary(client.id, billing.contactId);
    links = clientContacts.list(client.id);

    expect(links.filter((link) => link.isPrimary)).toHaveLength(1);
    expect(links.find((link) => link.contactId === billing.contactId)?.isPrimary).toBe(true);
    expect(links.find((link) => link.contactId === billing.contactId)?.role).toBe('primary');
    expect(links.find((link) => link.contactId === primary.id)?.isPrimary).toBe(false);

    const clientRow = database.get<{ primary_contact_id: string }>(
      'SELECT primary_contact_id FROM client_accounts WHERE id=?',
      [client.id],
    );
    expect(clientRow?.primary_contact_id).toBe(billing.contactId);

    database.close();
  });
});
