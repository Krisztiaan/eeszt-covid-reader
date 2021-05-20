#!/bin/sh

# Decrypt the file
mkdir $GITHUB_WORKSPACE/secrets
# --batch to prevent interactive command
# --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$PG_PASSPHRASE" \
--output $GITHUB_WORKSPACE/secrets/pc.json $GITHUB_WORKSPACE/pc.json.gpg
