"""Safely reset application/test records while preserving policy knowledge.

Default mode is a read-only dry run. The populated backup database is used
only as a reference and is never a reset target.

Run from backend\\:
    python reset_application_data.py

To execute against the normal backend database, which must be a separate
database from the reference backup:
    python reset_application_data.py --confirm-reset
"""

from __future__ import annotations

import argparse
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE = BACKEND_DIR / "zintellect.db"
REFERENCE_DATABASE = BACKEND_DIR / "zintellect_backup_2026-09-14.db"
BACKUP_ROOT = BACKEND_DIR.parent / "runtime_backups"

# Providers are preserved because insurance_policies refers to provider
# identities logically, although the reference schema does not declare an FK.
PRESERVED_TABLES = {
    "admins",
    "insurance_policies",
    "insurance_providers",
}

RESET_TABLES = (
    "uploaded_files",
    "human_reviews",
    "authorization_stages",
    "prior_auth_requests",
    "notifications",
    "audit_logs",
    "email_logs",
    "insurance_members",
    "doctors",
    "users",
)

EXPECTED_TABLES = PRESERVED_TABLES | set(RESET_TABLES)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--database",
        type=Path,
        default=DEFAULT_DATABASE,
        help=f"SQLite target (default: {DEFAULT_DATABASE})",
    )
    parser.add_argument(
        "--confirm-reset",
        action="store_true",
        help="Create a backup and execute the reset transaction.",
    )
    return parser.parse_args()


def normalized(path: Path) -> Path:
    return path.expanduser().resolve()


def table_counts(connection: sqlite3.Connection) -> dict[str, int]:
    tables = [
        row[0]
        for row in connection.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' "
            "ORDER BY name"
        )
    ]
    return {
        table: int(
            connection.execute(
                f'SELECT COUNT(*) FROM "{table}"'
            ).fetchone()[0]
        )
        for table in tables
    }


def print_counts(label: str, counts: dict[str, int]) -> None:
    print(label)
    for table, count in counts.items():
        print(f"  {table}: {count}")


def validate_target(target: Path) -> None:
    if target == normalized(REFERENCE_DATABASE):
        raise SystemExit(
            "Refusing to reset the populated reference database: "
            f"{REFERENCE_DATABASE}"
        )
    if target == normalized(BACKEND_DIR / "frontend" / "zintellect.db"):
        raise SystemExit("Refusing to use the frontend SQLite placeholder.")


def validate_schema(connection: sqlite3.Connection) -> None:
    actual = set(table_counts(connection))
    missing = EXPECTED_TABLES - actual
    if missing:
        names = ", ".join(sorted(missing))
        raise RuntimeError(f"Target database is missing expected tables: {names}")


def create_backup(target: Path) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    destination = BACKUP_ROOT / timestamp / target.name
    destination.parent.mkdir(parents=True, exist_ok=False)
    shutil.copy2(target, destination)
    for suffix in ("-wal", "-shm"):
        sidecar = Path(f"{target}{suffix}")
        if sidecar.exists():
            shutil.copy2(sidecar, Path(f"{destination}{suffix}"))
    return destination


def proposed_counts(before: dict[str, int]) -> dict[str, int]:
    return {
        table: (before[table] if table in PRESERVED_TABLES else 0)
        for table in before
    }


def reset(connection: sqlite3.Connection) -> None:
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("BEGIN")
    try:
        for table in RESET_TABLES:
            connection.execute(f'DELETE FROM "{table}"')
        connection.commit()
    except Exception:
        connection.rollback()
        raise


def main() -> None:
    args = parse_args()
    target = normalized(args.database)
    validate_target(target)

    if not target.exists():
        if args.confirm_reset:
            raise SystemExit(
                f"Cannot reset missing database: {target}. "
                "Start the backend once to create it, then rerun."
            )
        print(f"DRY RUN: target database does not exist yet: {target}")
        if REFERENCE_DATABASE.exists():
            reference = sqlite3.connect(
                f"file:{REFERENCE_DATABASE}?mode=ro", uri=True
            )
            try:
                validate_schema(reference)
                reference_counts = table_counts(reference)
                print_counts(
                    "Reference-only counts (not a reset target):",
                    reference_counts,
                )
                print_counts(
                    "Reference-only projected counts:",
                    proposed_counts(reference_counts),
                )
            finally:
                reference.close()
        print("No files or database records were changed.")
        return

    connection = sqlite3.connect(target)
    try:
        validate_schema(connection)
        before = table_counts(connection)
        print_counts("Counts before proposed reset:", before)
        print_counts("Counts after proposed reset (dry-run projection):",
                     proposed_counts(before))
        print("Preserved tables: " + ", ".join(sorted(PRESERVED_TABLES)))
        print("Tables proposed for clearing: " + ", ".join(RESET_TABLES))

        if not args.confirm_reset:
            print(f"DRY RUN ONLY. Planned backup: {BACKUP_ROOT}\\<timestamp>\\{target.name}")
            print("No backup, deletion, or database modification was performed.")
            return

        backup = create_backup(target)
        print(f"Backup created: {backup}")
        reset(connection)
        after = table_counts(connection)
        print_counts("Counts after reset:", after)
    finally:
        connection.close()


if __name__ == "__main__":
    main()
