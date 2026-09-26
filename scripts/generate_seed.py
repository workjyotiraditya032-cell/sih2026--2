"""Regenerates database/seed.sql from backend/app/database/reference_data.py."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.database.reference_data import COMMODITIES, MATERIALS  # noqa: E402


def literal(value) -> str:
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return repr(value)
    if isinstance(value, list):
        return "ARRAY[" + ", ".join(literal(v) for v in value) + "]::TEXT[]"
    return "'" + str(value).replace("'", "''") + "'"


def insert(table: str, key: str, rows: list[dict]) -> str:
    columns = list(rows[0].keys())
    values = ",\n".join("  (" + ", ".join(literal(row[c]) for c in columns) + ")" for row in rows)
    return f"INSERT INTO {table} ({', '.join(columns)}) VALUES\n{values}\nON CONFLICT ({key}) DO NOTHING;\n"


def main() -> None:
    header = "-- Reference / prototype data (indicative ranges, not experimentally validated). Generated file.\n\n"
    sql = header + insert("packaging_materials", "material_name", MATERIALS) + "\n" + insert(
        "commodities", "commodity_name", COMMODITIES
    )
    (ROOT / "database" / "seed.sql").write_text(sql)
    print("database/seed.sql written")


if __name__ == "__main__":
    main()
