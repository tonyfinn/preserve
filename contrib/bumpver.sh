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

cat preserve-ui/package.json | jq --indent 4 --arg newver $newver '.version = $newver' | tee preserve-ui/package.json
cat preserve-electron/package.json | jq --indent 4 --arg newver $newver '.version = $newver' | tee preserve-electron/package.json
