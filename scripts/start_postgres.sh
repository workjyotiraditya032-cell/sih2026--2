#!/usr/bin/env bash
# Installs (if missing), initialises and starts a local PostgreSQL for PackIntel. Idempotent.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/app/backend/.env}"
set -a; source "$ENV_FILE"; set +a
PGDATA_DIR="${PGDATA_DIR:-/app/.pgdata}"

find_pgbin() { ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true; }

PGBIN="$(find_pgbin)"
if [ -z "$PGBIN" ]; then
  echo "Installing PostgreSQL..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql >/tmp/postgres_install.log 2>&1 || {
    apt-get update >>/tmp/postgres_install.log 2>&1
    DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql >>/tmp/postgres_install.log 2>&1
  }
  PGBIN="$(find_pgbin)"
fi

if "$PGBIN/pg_isready" -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -q; then
  echo "PostgreSQL already running"
  exit 0
fi

if [ ! -f "$PGDATA_DIR/PG_VERSION" ]; then
  mkdir -p "$PGDATA_DIR"
  chown -R postgres:postgres "$PGDATA_DIR"
  chmod 700 "$PGDATA_DIR"
  su postgres -s /bin/bash -c "$PGBIN/initdb -D $PGDATA_DIR -U postgres --auth-local=trust --auth-host=scram-sha-256 >/dev/null"
fi
chown -R postgres:postgres "$PGDATA_DIR"
rm -f "$PGDATA_DIR/postmaster.pid"
touch /var/log/packintel-postgres.log && chown postgres:postgres /var/log/packintel-postgres.log

su postgres -s /bin/bash -c "$PGBIN/pg_ctl -D $PGDATA_DIR -l /var/log/packintel-postgres.log -o '-p $POSTGRES_PORT -k $PGDATA_DIR -c listen_addresses=$POSTGRES_HOST' -w start"

psql_admin() { su postgres -s /bin/bash -c "$PGBIN/psql -h $PGDATA_DIR -p $POSTGRES_PORT -U postgres -tAc \"$1\""; }

if [ "$(psql_admin "SELECT 1 FROM pg_roles WHERE rolname='$POSTGRES_USER'")" != "1" ]; then
  psql_admin "CREATE ROLE $POSTGRES_USER LOGIN PASSWORD '$POSTGRES_PASSWORD'"
fi
if [ "$(psql_admin "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'")" != "1" ]; then
  psql_admin "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER"
fi
echo "PostgreSQL ready on $POSTGRES_HOST:$POSTGRES_PORT (db: $POSTGRES_DB)"
