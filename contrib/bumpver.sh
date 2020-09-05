#!/bin/bash

if [[ "$1" = "major" ]]; then
    echo "Bumping major"
    newver=$(jq -r '.version | split(".") | [(.[0] | tonumber) + 1, 0, 0] | join(".")' package.json)
elif [[ "$1" = "minor" ]]; then
    echo "Bumping minor"
    newver=$(jq -r '.version | split(".") | [.[0], (.[1] | tonumber) + 1, 0] | join(".")' package.json)
elif [[ "$1" = "patch" ]]; then
    echo "Bumping patch"
    newver=$(jq -r '.version | split(".") | [.[0], .[1], (.[2] | tonumber) + 1] | join(".")' package.json)
else
    echo "Usage: bumpver (major|minor|patch)"
fi
    
echo "New version is $newver"

cat package.json | jq --indent 4 --arg newver $newver '.version = $newver' | tee package.json
cat preserve-electron/package.json | jq --indent 4 --arg newver $newver '.version = $newver' | tee preserve-electron/package.json
