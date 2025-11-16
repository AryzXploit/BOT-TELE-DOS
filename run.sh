#!/bin/bash

# Run with increased memory limit (8GB)
NODE_OPTIONS="--max-old-space-size=8192 --expose-gc" node index.js "$@"
