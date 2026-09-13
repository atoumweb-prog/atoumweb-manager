import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import {
  CLIENT_CONTACT_ROLES,
  type ClientContactLink,
  type ClientContactRole,
  type Contact,
  type ContactInput,
} from '../../shared/crm';
import type { CrmService } from './CrmService';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function assertEmail(value?: string | null): void {
  const email = clean(value);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Adresse email invalide.');
  }
}

interface ClientRow extends Record<string, unknown> {
  id: string;
  organization_id: string | null;
}

interface LinkRow extends Record<string, unknown> {
  link_id: string;
  client_account_id: string;
  contact_id: string;
  role: ClientContactRole;
  is_primary: number;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export class ClientContactService {
  constructor(
    private readonly database: DatabaseAdapter,
    private readonly crm: CrmService,
  ) {}

  list(clientId: string): ClientContactLink[] {
    this.requireClient(clientId);
    return this.database.all<LinkRow>(
      `SELECT ccr.id AS link_id, ccr.client_account_id, ccr.contact_id, ccr.role, ccr.is_primary,
        c.organization_id, c.first_name, c.last_name, c.job_title, c.email, c.phone,
        c.preferred_channel, c.notes, c.created_at, c.updated_at, c.archived_at
       FROM client_contact_roles ccr
       JOIN contacts c ON c.id=ccr.contact_id
       WHERE ccr.client_account_id=? AND c.archived_at IS NULL
       ORDER BY ccr.is_primary DESC, c.last_name COLLATE NOCASE, c.first_name COLLATE NOCASE`,
      [clientId],
    ).map((row) => this.mapLink(row));
  }

  add(clientId: string, input: ContactInput, role: ClientContactRole, makePrimary = false): ClientContactLink {
    if (!CLIENT_CONTACT_ROLES.includes(role)) throw new Error('Rôle de contact invalide.');
    const client = this.requireClient(clientId);
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    if (!firstName || !lastName) throw new Error('Le prénom et le nom sont requis.');
    assertEmail(input.email);

    const linkId = randomUUID();
    const contactId = randomUUID();
    const now = nowIso();
    const organizationId = clean(input.organizationId) ?? client.organization_id;

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO contacts (
          id, organization_id, first_name, last_name, job_title, email, phone, preferred_channel,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contactId, organizationId, firstName, lastName, clean(input.jobTitle), clean(input.email),
          clean(input.phone), clean(input.preferredChannel), clean(input.notes), now, now,
        ],
      );

      if (makePrimary) {
        this.database.run('UPDATE client_contact_roles SET is_primary=0 WHERE client_account_id=?', [clientId]);
      }

      this.database.run(
        `INSERT INTO client_contact_roles (id, client_account_id, contact_id, role, is_primary, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [linkId, clientId, contactId, role, makePrimary ? 1 : 0, now],
      );

      if (makePrimary) {
        this.database.run(
          'UPDATE client_accounts SET primary_contact_id=?, updated_at=? WHERE id=?',
          [contactId, now, clientId],
        );
      }

      this.database.run(
        `INSERT INTO activity_events (
          id, entity_type, entity_id, action, summary, metadata_json,
          client_account_id, organization_id, contact_id, created_at
        ) VALUES (?, 'client', ?, 'contact_added', ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(), clientId, `Contact ajouté : ${firstName} ${lastName}`,
          JSON.stringify({ role, makePrimary }), clientId, organizationId, contactId, now,
        ],
      );

      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    this.crm.rebuildSearchIndex();
    const created = this.list(clientId).find((item) => item.id === linkId);
    if (!created) throw new Error('Le contact a été créé mais sa liaison est introuvable.');
    return created;
  }

  setPrimary(clientId: string, contactId: string): void {
    this.requireClient(clientId);
    const link = this.database.get<{ id: string }>(
      `SELECT id FROM client_contact_roles
       WHERE client_account_id=? AND contact_id=?
       ORDER BY is_primary DESC, created_at ASC LIMIT 1`,
      [clientId, contactId],
    );
    if (!link) throw new Error('Ce contact n’est pas rattaché au client.');

    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('UPDATE client_contact_roles SET is_primary=0 WHERE client_account_id=?', [clientId]);
      this.database.run('UPDATE client_contact_roles SET is_primary=1 WHERE id=?', [link.id]);
      this.database.run(
        'UPDATE client_accounts SET primary_contact_id=?, updated_at=? WHERE id=?',
        [contactId, now, clientId],
      );
      this.database.run(
        `INSERT INTO activity_events (
          id, entity_type, entity_id, action, summary, client_account_id, contact_id, created_at
        ) VALUES (?, 'client', ?, 'primary_contact_changed', 'Contact principal modifié', ?, ?, ?)`,
        [randomUUID(), clientId, clientId, contactId, now],
      );
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }

    this.crm.rebuildSearchIndex();
  }

  private requireClient(clientId: string): ClientRow {
    const client = this.database.get<ClientRow>('SELECT id, organization_id FROM client_accounts WHERE id=?', [clientId]);
    if (!client) throw new Error('Client introuvable.');
    return client;
  }

  private mapLink(row: LinkRow): ClientContactLink {
    const contact: Contact = {
      id: row.contact_id,
      organizationId: row.organization_id,
      firstName: row.first_name,
      lastName: row.last_name,
      jobTitle: row.job_title,
      email: row.email,
      phone: row.phone,
      preferredChannel: row.preferred_channel,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };

    return {
      id: row.link_id,
      clientAccountId: row.client_account_id,
      contactId: row.contact_id,
      role: row.role,
      isPrimary: row.is_primary === 1,
      contact,
    };
  }
}
