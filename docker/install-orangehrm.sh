#!/usr/bin/env bash
# Provisions a freshly started OrangeHRM stack (see docker-compose.yml) by
# running its unattended CLI installer. Safe to re-run: if the instance is
# already installed, the installer just reports that and exits cleanly.
#
# Usage: docker/install-orangehrm.sh
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Waiting for the database to be ready..."
for i in $(seq 1 30); do
  if docker compose exec -T db mysqladmin ping -h 127.0.0.1 -uroot -proot --silent; then
    echo "Database is ready"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 5
  if [ "$i" -eq 30 ]; then
    echo "Database did not become ready in time" >&2
    docker compose logs db
    exit 1
  fi
done

echo "Running the OrangeHRM CLI installer..."
docker compose cp docker/installer/cli_install_config.yaml orangehrm:/var/www/html/installer/cli_install_config.yaml
docker compose exec -T orangehrm php /var/www/html/installer/cli_install.php

echo "Waiting for OrangeHRM to respond..."
for i in $(seq 1 60); do
  http_status=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/web/index.php/auth/login || true)
  if [ "$http_status" = "200" ]; then
    echo "OrangeHRM is ready"
    exit 0
  fi
  echo "Waiting for OrangeHRM... ($i/60, last status: $http_status)"
  sleep 5
done

echo "OrangeHRM did not become ready in time" >&2
docker compose logs orangehrm
exit 1
