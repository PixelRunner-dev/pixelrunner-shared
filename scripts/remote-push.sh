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

sshpass -p "$npm_package_config_remote_pass" rsync -az --delete -i --out-format="%i %n%L" --no-o --no-g \
  --exclude='node_modules/' --exclude='.git/' --exclude='logs/' \
  -e "ssh -o StrictHostKeyChecking=no" $repo_root "$npm_package_config_remote_user@$npm_package_config_remote_host:$npm_package_config_remote_dir/../" \
  | awk '
    {
      # Entire input line
      line = $0

      # Handle rsync deletion lines that start with "*deleting "
      if (line ~ /^\*deleting[[:space:]]+/) {
        sub(/^\*deleting[[:space:]]+/, "", line)
        print "D  " line
        next
      }

      # Split first token (the itemize code) from the rest (path + optional symlink target)
      code = $1
      # Reconstruct path part: remove first token + space from line
      sub(/^[^ ]+[ ]+/, "", line)
      path = line

      # If the leading character is ">" the sender sent a file/dir => creation or transfer
      if (code ~ /^>/) {
        # If receiver created the item (creation flags often include 'f'/'d' in pos2),
        # treat as 'A' (added). Otherwise still mark as 'A' for transferred new items.
        print "A  " path
        next
      }

      # If the itemize code contains a 'deleting' indicator it would have been caught above.
      # Otherwise, if any of the change flags (positions after first char) are present, mark update.
      # Check for change flags characters used by rsync: c s t p o g u a x
      rest = substr(code,2)
      if (rest ~ /[cstpoguax]/) {
        print "U  " path
        next
      }

      # Fallback: if no flags matched, print unchanged (you can skip printing)
      # Here we choose to skip unchanged entries; uncomment next line to show them as " "
      # print "   " path
    }' \
&& sshpass -p "$npm_package_config_remote_pass" ssh -o StrictHostKeyChecking=no $npm_package_config_remote_user@$npm_package_config_remote_host "chown -R pixelrunner:pixelrunner $npm_package_config_remote_dir"
