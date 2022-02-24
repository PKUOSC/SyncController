#!/bin/bash
cd /data/repos/git-repos/

if [ ! -x "$1" ]; then
	echo "git clone --mirror $2 $1"
	returnStatus=$(git clone --mirror $2 $1)
else
	cd $1
	returnStatus=$(git remote update)
fi
	
chmod 755 -R $1
echo "Success"
exit 0
