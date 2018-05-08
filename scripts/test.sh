#!/usr/bin/env bash

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    echo "Stoppping ganache instance (PID $ganache_pid)"
    kill -9 $ganache_pid
  fi
}


if [ "$SOLIDITY_COVERAGE" = true ]; then
  ganache_cmd="testrpc-sc"
  ganache_port=8555
else
  ganache_cmd="ganache-cli"
  ganache_port=8545
fi

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  local accounts=(                                                                                           # Account
    --account="0x0000000000000000000000000000000000000000000000000000000000000021,1000000000000000000000000" # 0x0..
    --account="0x000000000000000000000000000000000000000000000000000000000000001b,1000000000000000000000000" # 0x1..
    --account="0x00000000000000000000000000000000000000000000000000000000000000bf,1000000000000000000000000" # 0x2..
    --account="0x000000000000000000000000000000000000000000000000000000000000009e,1000000000000000000000000" # 0x3..
    --account="0x0000000000000000000000000000000000000000000000000000000000000013,1000000000000000000000000" # 0x4..
    --account="0x0000000000000000000000000000000000000000000000000000000000000058,1000000000000000000000000" # 0x5..
    --account="0x000000000000000000000000000000000000000000000000000000000000001f,1000000000000000000000000" # 0x6..
    --account="0x0000000000000000000000000000000000000000000000000000000000000023,1000000000000000000000000" # 0x7..
    --account="0x0000000000000000000000000000000000000000000000000000000000000070,1000000000000000000000000" # 0x8..
    --account="0x0000000000000000000000000000000000000000000000000000000000000019,1000000000000000000000000" # 0x9..
)
  npx ${ganache_cmd} --gasLimit 0xfffffffffff --port "$ganache_port" "${accounts[@]}" > /dev/null &
  ganache_pid=$!
  echo " (PID $ganache_pid)"
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  printf "Starting new ganache instance"
  start_ganache
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  npx solidity-coverage
else
  npx truffle test "$@"
fi
