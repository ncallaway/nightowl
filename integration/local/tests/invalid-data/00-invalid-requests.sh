owl init

## no such request
# owl request apple

## empty request
# touch .owl/apple.json
# owl request apple

## also empty request
# echo "\t  " > .owl/apple.json
# owl request apple

## invalid json
# echo '{"I AM NOT JSON"}'' > .owl/apple.json
# owl request apple

## invalid request (no url)
# echo '{"not_url": "something"}' > .owl/apple.json
# owl request apple