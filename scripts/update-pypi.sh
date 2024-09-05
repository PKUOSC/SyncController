#!/bin/bash
cd /data/repos/pypi
TMPFILE=$(mktemp)
echo $TMPFILE
/usr/local/bin/bandersnatch -c /data/SyncController/scripts/bandersnatch.conf mirror 2>&1 | tee $TMPFILE

a=`cat $TMPFILE |tr '\n' ' '| sed 's/.*INFO:\ \([0-9]*\)\ packages.*/\1/g'`
echo $a
if [ "$a" = "0" ];then
    exit 1
fi

b=`cat $TMPFILE |grep "Report issue to PyPA Warehouse" | wc -l `
if [ $b -gt 0 ]; then
    exit 1
fi

exit 0
