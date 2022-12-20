set -e

if [ -d ".owl" ]; then
  echo ".owl directory exists before init"; exit 1
fi

echo "owl init"
owl init
mkdir -p .owl

if [ ! -d ".owl" ]; then
  echo ".owl directory does not exists"; exit 1
fi