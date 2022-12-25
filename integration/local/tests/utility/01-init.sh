set -e

if [ -d ".owl" ]; then echo "expected .owl directory not to exist at the start of the test"; exit 1; fi

# expect owl env list to fail when we haven't done an init yet
set +e
owlout=$(owl env list 2>&1)
if [ $? -ne 2 ]; then echo "expected owl env list to exit with code 2"; exit 1; fi
if [[ "$owlout" != *"err-owldir-not-found"* ]]; then echo "expected owl env list to have err-owldir-not-found in output";
  echo -e "output was:\n$owlout"
exit 1; fi
set -e

owl init

if [ ! -d ".owl" ]; then echo "expected .owl directory to exist after owl init"; exit 1; fi

owl env list 2>&1
if [ $? -ne 0 ]; then echo "expected owl env list to succeed after owl init"; exit 1; fi

# expect owl init to fail now that the directory exists
set +e
owl_init_output=$(owl init 2>&1)
if [ $? -ne 4 ]; then echo "expected owl init to exit with code 4"; exit 1; fi
if [[ "$owl_init_output" != *"err-owldir-already-exists"* ]]; then echo "expected owl init to have err-owldir-already-exists in output"; exit 1; fi
set -e