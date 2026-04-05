#!/usr/bin/env bash

# Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
# Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
# International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
# https://creativecommons.org/licenses/by-nc-nd/4.0/.
#
# @copyright Pixelrunner (https://pixelrunner.dev)
# @license CC-BY-NC-ND-4.0

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"

sshpass -p "$npm_package_config_remote_pass" ssh -o StrictHostKeyChecking=no $npm_package_config_remote_user@$npm_package_config_remote_host "poweroff"
