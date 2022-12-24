owlout=$(owl help err-store-not-found)
if ! echo $owlout | grep -qi "The owl directory \(usually .owl\) was not found.)"; then echo "expected owl help to print error help"; exit 1; fi