import type { Migration } from './migrations';

export const TIME_PAUSE_REASON_MIGRATION: Migration = {
  id: 35,
  name: 'time_pause_reasons',
  sql: `
    ALTER TABLE time_session_pauses
      ADD COLUMN reason TEXT
      CHECK (reason IS NULL OR reason IN ('need_information','not_enough_time','other_emergency','other'));

    ALTER TABLE time_session_pauses
      ADD COLUMN reason_note TEXT;
  `,
};
