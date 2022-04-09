# replay-node-cli

CLI tool for creating recordings using the [Replay](https://replay.io) version of node.

## Overview

The replay version of node is a replacement for the `node` executable which saves a recording of its behavior to disk that can be uploaded to the record/replay web service for viewing.  `replay-node` is a CLI tool that allows the replay version of node to be selectively used when running node scripts.

## Installation

`npm i @recordreplay/replay-node-cli --global`

## Usage

`replay-node` can be used in the following ways to create recordings.  Afterwards, use the [replay-recordings](https://www.npmjs.com/package/@recordreplay/recordings-cli) CLI tool to manage and upload the recordings.

`replay-node script.js ...args`

Use the replay version of node to record a specific script and arguments.

`replay-node --exec executable ...args`

Run an executable command with `$PATH` updated so that all node scripts will use the Replay version of node to record their behavior.

`replay-node --update`

Ensure the replay version of node is downloaded/updated.

### Supported environment variables:

- RECORD_REPLAY_DIRECTORY (defaults to $HOME/.replay)
- RECORD_REPLAY_NODE_DIRECTORY (defaults to $RECORD_REPLAY_DIRECTORY/node)
  Allows to specify a folder in which the `node` binary is to be found.
  Specifying this environment variable means you take control over that binary - the script will only use it, but never update it.
- RECORD_REPLAY_DRIVER
  Allows you to specify the path to the `recordreplay.so` driver library.
  Specifying this environment variable means you take control over that library file - the script will use it, but never update it.
