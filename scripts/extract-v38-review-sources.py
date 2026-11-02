"""Extract the V3.8 review documents into deterministic, reviewable JSON.

The DOCX files are editorial/commercial input only. This script never opens a
Manager database and never publishes or adopts a version.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
CLAUSES_DOCX = Path(r"C:\Users\AtoumWeb\Downloads\AtoumWeb_Bibliotheque_119_Clauses_V3_8_PROJET_RELECTURE.docx")
CATALOG_DOCX = Path(r"C:\Users\AtoumWeb\Downloads\AtoumWeb_Grille_Tarifaire_Detaillee_V38_PROJET_RELECTURE.docx")
V37_JSON = ROOT / "data/contracts/atoumweb-contract-library-v37.json"
CATALOG_V1_JSON = ROOT / "data/catalogue/atoumweb-catalogue-v1.json"
OUT_CLAUSES = ROOT / "data/contracts/atoumweb-contract-library-v38-review.json"
OUT_CATALOG = ROOT / "data/catalogue/atoumweb-catalogue-v38-review.json"
OUT_REPORT = ROOT / "docs/ux-v2/AUDIT-V38-2026-11-02.md"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text_sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def extract_clauses() -> dict:
    document = Document(CLAUSES_DOCX)
    parsed: list[dict] = []
    current: dict | None = None
    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        match = re.match(r"^(\d{3})\s*·\s*(.+)$", text)
        if paragraph.style.name == "Heading 2" and match:
            if current:
                current["body"] = "\n\n".join(current.pop("paragraphs"))
                parsed.append(current)
            current = {"number": int(match.group(1)), "title": match.group(2).strip(), "paragraphs": []}
            continue
        if not current:
            continue
        if paragraph.style.name == "Meta" and text.startswith("Code"):
            code = re.search(r"Code\s*:\s*([^|]+)", text)
            audience = re.search(r"Public\s*:\s*(.+)$", text)
            current["code"] = code.group(1).strip() if code else ""
            current["audienceLabel"] = audience.group(1).strip() if audience else ""
        elif paragraph.style.name == "Normal" and text:
            current["paragraphs"].append(text)
    if current:
        current["body"] = "\n\n".join(current.pop("paragraphs"))
        parsed.append(current)

    previous = json.loads(V37_JSON.read_text(encoding="utf-8"))
    previous_by_code = {entry["code"]: entry for entry in previous["clauses"]}
    rows: list[dict] = []
    for clause in parsed:
        old = previous_by_code.get(clause["code"])
        row = {
            **clause,
            "proposal": clause["body"],
            "bodySHA256": text_sha256(clause["body"]),
            "change": "new" if old is None else ("unchanged" if normalize(clause["body"]) == normalize(old["proposal"]) else "rewritten"),
            "sourceBodySHA256": old.get("sourceBodySHA256") if old else None,
            "origin": old.get("origin") if old else {
                "templateId": "", "currentVersionId": "", "versionId": "", "version": 0,
                "versionStatus": "new", "body": "", "title": clause["title"],
                "code": clause["code"], "audience": "all",
            },
            "sourceAudience": old.get("sourceAudience") if old else "all",
            "approval": None,
            "publication": False,
            "adoption": False,
        }
        if old is None:
            row["newClause"] = {"scope": "base", "audience": "all", "sortOrder": 1190}
        rows.append(row)

    expected_changes = {"BASE-COOPERATION", "PRO-LITIGE", "WEB-CONTENUS", "BASE-REFERENCES-AGENCE"}
    actual_changes = {row["code"] for row in rows if row["change"] != "unchanged"}
    if len(rows) != 119 or [row["number"] for row in rows] != list(range(1, 120)):
        raise RuntimeError(f"Clause numbering invalid: {len(rows)} rows")
    if actual_changes != expected_changes:
        raise RuntimeError(f"Unexpected V3.8 changes: {sorted(actual_changes)}")
    liability = next(row for row in rows if row["number"] == 22)
    old_liability = previous["clauses"][21]
    if liability["code"] != old_liability["code"] or normalize(liability["body"]) != normalize(old_liability["proposal"]):
        raise RuntimeError("Clause 022 changed although the review document requires it to remain identical")

    return {
        "schemaVersion": 1,
        "reference": "Bibliothèque contractuelle AtoumWeb — projet V3.8 — 2 novembre 2026 — non publié",
        "status": "review_only_not_published",
        "source": {"filename": CLAUSES_DOCX.name, "sha256": sha256(CLAUSES_DOCX)},
        "baseReference": previous.get("reference"),
        "clauses": rows,
        "summary": {"total": len(rows), "unchanged": 115, "rewritten": 3, "new": 1},
    }


def split_bullets(value: str) -> list[str]:
    return [normalize(item) for item in value.split("•") if normalize(item)]


def extract_catalog() -> dict:
    document = Document(CATALOG_DOCX)
    records: list[dict] = []
    # Tables 0–14 are notices and summary tables. Detailed cards follow.
    for table in document.tables[15:]:
        if len(table.rows) != 3 or len(table.columns) != 2:
            continue
        header = table.rows[0].cells[0].text.strip()
        match = re.match(r"^(.*?)\s+(AW-[A-Z0-9-]+)$", header)
        is_lune = header == "Hébergement isolé avec Lune dédiée  CODE CATALOGUE À CRÉER"
        if not match and not is_lune:
            raise RuntimeError(f"Detailed catalogue card without canonical code: {header!r}")
        records.append({
            "name": "Hébergement isolé avec Lune dédiée" if is_lune else match.group(1).strip(),
            "canonicalCode": None if is_lune else match.group(2),
            "catalogueAction": "create_draft_after_explicit_confirmation" if is_lune else "compare_existing",
            "priceLabel": normalize(table.rows[0].cells[1].text),
            "inclusions": split_bullets(table.rows[2].cells[0].text),
            "exclusions": split_bullets(table.rows[2].cells[1].text),
        })
    codes = [row["canonicalCode"] for row in records if row["canonicalCode"]]
    if len(records) != 113 or len(set(codes)) != 112:
        raise RuntimeError(f"Expected 112 catalogue references plus Lune, got {len(records)} ({len(set(codes))} coded)")
    current = json.loads(CATALOG_V1_JSON.read_text(encoding="utf-8"))
    current_by_code = {row["canonicalCode"]: row for row in current["records"]}
    comparison = []
    for row in records:
        if not row["canonicalCode"]:
            comparison.append({"canonicalCode": None, "name": row["name"], "status": "new_draft_required", "differences": ["new catalogue reference"]})
            continue
        existing = current_by_code.get(row["canonicalCode"])
        differences = []
        if not existing:
            differences.append("canonical code missing from V1")
        else:
            version = existing["version"]
            if normalize(existing["name"]) != normalize(row["name"]): differences.append("name")
            if [normalize(x) for x in version.get("inclusions", [])] != row["inclusions"]: differences.append("inclusions")
            if [normalize(x) for x in version.get("exclusions", [])] != row["exclusions"]: differences.append("exclusions")
            source_price = normalize(version.get("commercialParameters", {}).get("sourcePriceLabel", ""))
            if source_price and source_price not in row["priceLabel"] and row["priceLabel"] not in source_price: differences.append("priceLabel")
        comparison.append({"canonicalCode": row["canonicalCode"], "name": row["name"], "status": "identical" if not differences else "review", "differences": differences})
    missing_from_review = sorted(set(current_by_code) - {code for code in codes})
    if missing_from_review:
        raise RuntimeError(f"Catalogue codes absent from V3.8 review: {missing_from_review}")
    identical = sum(1 for row in comparison if row["status"] == "identical")
    review = sum(1 for row in comparison if row["status"] == "review")
    return {
        "schemaVersion": 1,
        "reference": "Grille tarifaire détaillée AtoumWeb — projet V3.8 — 2 novembre 2026 — non publiée",
        "status": "review_only_not_published",
        "source": {"filename": CATALOG_DOCX.name, "sha256": sha256(CATALOG_DOCX)},
        "records": records,
        "comparison": comparison,
        "summary": {"catalogueReferences": 112, "dedicatedLuneFormula": 1, "totalCards": 113,
                    "identicalCards": identical, "cardsToReview": review, "newDrafts": 1},
    }


def main() -> None:
    clauses = extract_clauses()
    catalog = extract_catalog()
    OUT_CLAUSES.parent.mkdir(parents=True, exist_ok=True)
    OUT_CATALOG.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_CLAUSES.write_text(json.dumps(clauses, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    changed = [row for row in clauses["clauses"] if row["change"] != "unchanged"]
    changed_labels = ", ".join(
        f"{row['number']:03d} {row['code']} ({row['change']})" for row in changed
    )
    catalog_review = [row for row in catalog["comparison"] if row["status"] == "review"]
    catalog_review_lines = "\n".join(
        f"- `{row['canonicalCode']}` — {', '.join(row['differences'])}." for row in catalog_review
    )
    OUT_REPORT.write_text(
        "# Audit déterministe des sources V3.8\n\n"
        "> Extraction de documents de relecture uniquement. Aucun brouillon, tarif, clause ou contrat n’est publié.\n\n"
        f"- Bibliothèque : **{len(clauses['clauses'])} clauses** — 115 inchangées, 3 réécrites, 1 nouvelle.\n"
        f"- Changements détectés : {changed_labels}.\n"
        "- Clause 022 : identité textuelle contrôlée avec la proposition V3.7 ; aucun plafond ajouté.\n"
        f"- Catalogue : **{catalog['summary']['catalogueReferences']} références** + **1 formule Lune dédiée**.\n"
        f"- Comparaison Catalogue V1 : **{catalog['summary']['identicalCards']} fiches identiques**, **{catalog['summary']['cardsToReview']} à examiner**, **1 nouveau brouillon**.\n"
        f"- Empreinte DOCX clauses : `{clauses['source']['sha256']}`.\n"
        f"- Empreinte DOCX tarifs : `{catalog['source']['sha256']}`.\n\n"
        "## Écarts Catalogue à soumettre à validation\n\n"
        f"{catalog_review_lines}\n"
        "- Nouvelle formule sans code inventé : **Hébergement isolé avec Lune dédiée** ; création de brouillon uniquement après confirmation explicite.\n\n"
        "## Fichiers structurés\n\n"
        f"- `{OUT_CLAUSES.relative_to(ROOT).as_posix()}`\n"
        f"- `{OUT_CATALOG.relative_to(ROOT).as_posix()}`\n",
        encoding="utf-8",
    )
    print(json.dumps({"clauses": clauses["summary"], "catalog": catalog["summary"], "report": str(OUT_REPORT)}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise
