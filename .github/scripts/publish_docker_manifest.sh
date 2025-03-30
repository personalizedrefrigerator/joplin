#!/bin/bash

echo "GIT_TAG_NAME=$GIT_TAG_NAME"
echo "SERVER_TAG_PREFIX=$SERVER_TAG_PREFIX"
echo "SERVER_REPOSITORY=$SERVER_REPOSITORY"

# Check if it's a server release, otherwise exit
if [[ $GIT_TAG_NAME != $SERVER_TAG_PREFIX-* ]]; then
	exit 0
fi

docker manifest create $SERVER_REPOSITORY:$GIT_TAG_NAME \
	$SERVER_REPOSITORY:arm64-$GIT_TAG_NAME \
	$SERVER_REPOSITORY:amd64-$GIT_TAG_NAME

docker manifest annotate $SERVER_REPOSITORY:$GIT_TAG_NAME $SERVER_REPOSITORY:arm64-$GIT_TAG_NAME --arch arm64
docker manifest annotate $SERVER_REPOSITORY:$GIT_TAG_NAME $SERVER_REPOSITORY:amd64-$GIT_TAG_NAME --arch amd64

docker manifest push $SERVER_REPOSITORY:$GIT_TAG_NAME
