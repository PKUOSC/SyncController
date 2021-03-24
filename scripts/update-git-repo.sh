#!/bin/bash
cd /data/repos/git-repos/
if [ ! -x "$1" ]; then
	mkdir $1
fi

if [ ! -x "$1" ]; then
	returnStatus=$(git clone --mirror $2 $1)
else
	cd $1
	returnStatus=$(git remote update)
fi
if [[ returnStatus == 1 ]]; then
	echo "Failed to update."
else
	chmod 755 -R $1
	echo "Successful."
fi
