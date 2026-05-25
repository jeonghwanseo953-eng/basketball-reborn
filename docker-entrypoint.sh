#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ] && echo "$DATABASE_URL" | grep -q '^postgresql://'; then
  connection="${DATABASE_URL#postgresql://}"
  credentials="${connection%%@*}"
  host_and_database="${connection#*@}"

  if [ "$credentials" != "$connection" ]; then
    export DATABASE_USERNAME="${DATABASE_USERNAME:-${credentials%%:*}}"
    export DATABASE_PASSWORD="${DATABASE_PASSWORD:-${credentials#*:}}"
    export DATABASE_URL="jdbc:postgresql://${host_and_database}"
  else
    export DATABASE_URL="jdbc:postgresql://${connection}"
  fi
fi

exec java -jar /app/app.jar
