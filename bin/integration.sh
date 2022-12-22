#!/bin/bash

echo -e "\nstarting integration tests\n"
set -e

docker-compose -f docker-compose.integration.yml up -d --build
docker-compose -f docker-compose.integration.yml run --no-TTY local zsh /tests/runner.sh

set +e
docker-compose -f docker-compose.integration.yml down