#!/bin/bash

cd ./bot

COMMIT_STRING=$(yarn outdated | sed -e '1,/Package/d' -e '/Done/d')

yarn upgrade

git add package.json
git add yarn.lock

git commit -m "Yarn upgrade: " -m "$COMMIT_STRING"
