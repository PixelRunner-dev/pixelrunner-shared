#!/usr/bin/env bash

set -euo pipefail

sshpass -p "$npm_package_config_remote_pass" ssh -o StrictHostKeyChecking=no $npm_package_config_remote_user@$npm_package_config_remote_host "cd $npm_package_config_remote_dir && npm $@"
