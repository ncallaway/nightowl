owl init
owl create getpeople -- curl http://remote:3000/people
if [ $? -ne 0 ]; then echo "expected owl create getpeople to succeed"; exit 1; fi
if [ ! -f ".owl/getpeople.json" ]; then echo "expected owl to create getpeople request file"; exit 1; fi
if ! grep -qi 'http://remote:3000/people' '.owl/getpeople.json'; then echo "expected getpeople request file to have the request URL THING"; exit 1; fi
if ! grep -qi '"get"' '.owl/getpeople.json'; then echo "expected getpeople request file to have the request METHOD"; exit 1; fi

# expect owl create otherpeople to fail, since we don't know what a blob glorp format is
set +e
owlout=$(owl create otherpeople -- blob glorp http://remote:3000/people 2>&1)
if [ $? -ne 6 ]; then echo "expected owl create to exit with code 6"; exit 1; fi
if [[ "$owlout" != *"err-unrecognized-request-import"* ]]; then echo "expected owl create to have err-unrecognized-request-import in output"; exit 1; fi
set -e