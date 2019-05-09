#!/usr/bin/env bash

# Simple script to make sure the current build is on the production branch and
# has the correct version tag.
# This script is used as a check to prevent from deploying a wrong version to
# the docs.

DIR=$(dirname "$(realpath $0)")

say() {
    printf "[%s] %s\n" "$0" "$*" >&2
}

die() {
    say "$*"
    exit 100
}

check_branch() {
    if [[ "$CIRCLE_BRANCH" != "master" ]]; then
        die "Error: Invalid branch name '$CIRCLE_BRANCH', expected master"
    fi
}

check_tag() {
    NPM_VERSION=$(node -p "require('${DIR}/../package.json').version")
    DISTANCE=$(git rev-list --count "v$NPM_VERSION..HEAD")
    if [[ "$DISTANCE" != "0" ]]; then
        die "Error: Production branch must point to the current version tag ($DISTANCE commits ahead)"
    fi
}

check_branch
check_tag

