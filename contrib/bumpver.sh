#!/bin/bash

if [[ "$1" = "major" ]]; then
    echo "Bumping major"
    newver=$(jq -r '.version | split(".") | [(.[0] | tonumber) + 1, 0, 0] | join(".")' preserve-ui/package.json)
elif [[ "$1" = "minor" ]]; then
    echo "Bumping minor"
    newver=$(jq -r '.version | split(".") | [.[0], (.[1] | tonumber) + 1, 0] | join(".")' preserve-ui/package.json)
elif [[ "$1" = "patch" ]]; then
    echo "Bumping patch"
    newver=$(jq -r '.version | split(".") | [.[0], .[1], (.[2] | tonumber) + 1] | join(".")' preserve-ui/package.json)
else
    echo "Usage: bumpver (major|minor|patch)"
fi
    
echo "New version is $newver"

cat preserve-ui/package.json | \
    jq --indent 4 \
        --arg newver $newver '.version = $newver' \
        > preserve-ui/package.json.new
mv preserve-ui/package.json.new preserve-ui/package.json
(cd preserve-ui && npm install)

cat preserve-electron/package.json | \
    jq --indent 4 \
        --arg newver $newver '.version = $newver' \
        > preserve-electron/package.json.new
mv preserve-electron/package.json.new preserve-electron/package.json
(cd preserve-electron && npm install)
