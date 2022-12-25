owlout=$(owl help err-owldir-not-found)
if ! echo $owlout | grep -qi "The owl directory was not found."; then
  echo "expected owl help to print error help";
  echo -e "output was:\n$owlout"
  exit 1;
fi