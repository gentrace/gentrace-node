#!/bin/bash

find dist -type f -name "*.js" -exec sh -c 'mv "$0" "${0%.js}.mjs"' {} \;
