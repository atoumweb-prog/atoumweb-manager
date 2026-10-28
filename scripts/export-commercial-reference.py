"""Export commercial AtoumWeb en lecture seule, sans données CRM ni devis clients."""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any


CATALOG_TABLES = (
    "catalog_categories",
    "catalog_items",
    "catalog_versions",
    "offer_components",
    "catalog_commercial_rules",
    "catalog_version_recommendations",
    "catalog_project_blueprints",
)

CONTRACT_TABLES = (
    "contract_clause_templates",
    "contract_clause_versions",
    "catalog_contract_clause_links",
    "contract_types",
    "contract_type_versions",
    "contract_type_version_modules",
    "catalog_contract_type_links",
    "contract_library_import_runs",
    "contract_library_import_entries",
)

EXECUTION_TABLES = (
    "project_templates",
    "project_template_versions",
    "project_template_nodes",
    "project_template_sites",
    "project_template_site_pages",
    "project_type_site_blueprints",
    "maintenance_checklist_templates",
    "maintenance_checklist_template_items",
)

JSON_COLUMNS = {
    "identity_provenance_json",
    "inclusions_json",
    "exclusions_json",
    "prerequisites_json",
    "provenance_json",
    "commercial_parameters_json",
    "rules_json",
    "review_metadata_json",
    "catalog_links_json",
    "document_sources_json",
    "summary_json",
    "work_card_json",
    "advice_json",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("database", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def decode_json_columns(row: dict[str, Any]) -> dict[str, Any]:
    decoded: dict[str, Any] = {}
    for key, value in row.items():
        if key in JSON_COLUMNS and isinstance(value, str):
            try:
                decoded[key.removesuffix("_json")] = json.loads(value)
            except json.JSONDecodeError:
                decoded[key] = value
        else:
            decoded[key] = value
    return decoded


def export_table(connection: sqlite3.Connection, table: str) -> list[dict[str, Any]]:
    columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')]
    if not columns:
        raise RuntimeError(f"Table attendue absente : {table}")
    order = ", ".join(f'"{column}"' for column in columns)
    rows = connection.execute(f'SELECT * FROM "{table}" ORDER BY {order}').fetchall()
    return [decode_json_columns(dict(row)) for row in rows]


def write_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    args = parse_args()
    database = args.database.resolve()
    output = args.output.resolve()
    if not database.is_file():
        raise FileNotFoundError(database)
    output.mkdir(parents=True, exist_ok=True)

    before = sha256(database)
    connection = sqlite3.connect(
        f"file:{database.as_posix()}?mode=ro&immutable=1",
        uri=True,
    )
    connection.row_factory = sqlite3.Row
    try:
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise RuntimeError(f"Intégrité SQLite : {integrity}")
        foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
        if foreign_keys:
            raise RuntimeError(f"Clés étrangères invalides : {len(foreign_keys)}")

        groups = {
            "catalogue.json": CATALOG_TABLES,
            "contrats-publies.json": CONTRACT_TABLES,
            "temps-et-modeles-execution.json": EXECUTION_TABLES,
        }
        counts: dict[str, int] = {}
        for filename, tables in groups.items():
            exported = {table: export_table(connection, table) for table in tables}
            counts.update({table: len(rows) for table, rows in exported.items()})
            write_json(
                output / filename,
                {
                    "schemaVersion": 1,
                    "source": "atoumweb-manager.sqlite (export commercial en lecture seule)",
                    "tables": exported,
                },
            )
    finally:
        connection.close()

    after = sha256(database)
    if before != after:
        raise RuntimeError("La base source a changé pendant l'export")

    files = ["catalogue.json", "contrats-publies.json", "temps-et-modeles-execution.json"]
    write_json(
        output / "manifest.json",
        {
            "schemaVersion": 1,
            "exportDate": "2026-10-27",
            "sourceDatabaseSha256": before,
            "sourceDatabaseUnchanged": True,
            "files": [
                {
                    "path": filename,
                    "sha256": sha256(output / filename),
                }
                for filename in files
            ],
            "rowCounts": counts,
            "privacy": {
                "included": "Catalogue, clauses, associations, modèles et temps de référence",
                "excluded": [
                    "prospects et clients",
                    "contacts et coordonnées",
                    "devis et contrats de dossiers clients",
                    "réglages personnels de l'entreprise",
                    "documents, chemins locaux et secrets",
                ],
            },
        },
    )
    print(json.dumps({"output": str(output), "counts": counts}, ensure_ascii=False))


if __name__ == "__main__":
    main()
