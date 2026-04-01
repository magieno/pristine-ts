#!/bin/bash

for dir in packages/*; do
  if [ -d "$dir" ]; then
    echo "Installing dependencies in $dir"
    (cd "$dir" && npm install)
  fi
done
