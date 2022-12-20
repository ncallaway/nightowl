set -e

if [ -d ".owl" ]; then
  echo ".owl directory exists"; exit 1
fi

result=$(curl -s remote:3000 | jq ".ok")
if [ "$result" != "true" ]; then
  echo "result was not true"; exit 1
fi