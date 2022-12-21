# nightowl

A cli for managing a collection of http requests across a collection of environments. Designed to be useful as part of local development and integration test suites.

Note: This project is still in development and should not be used.

## Getting Started Example

```sh
$ owl init

$ owl from curl login -- curl -X POST http:/localhost:3000/login -H "Content-Type: application/json" --data '{"username": "jdoe@example.com", "password": "secret-password"}' # from curl not yet implemented
# $ owl update login --response-state-update 'jwt=jq(body,.jwt)' # hypothetical

$ owl request login # POST to localhost:3000/login
{ "jwt": "eyJhbGciOiJIUzI1NiIs..."}
# state is automatically updated if we have a response state hook

$ owl state patch jwt="eyJhbGciOiJIUzI1NiIs..." # manually store the jwt in our local state

$ owl from curl patients/list -- curl http://localhost:3000/patients -H 'Authorization: Bearer token' # from curl not yet implemented
$ owl patients/list # GET http://localhost:3000 with bearer `token`
# 401 response if `token` isn't valid

$ owl update patients/list --url "{env.host}/patients" --header 'Authorization: Bearer {state.jwt}' # update not yet implemented

$ owl env put local host="http://localhost:3000" username="jdoe@example.com" password="secret-password"
$ owl env put staging host="https://staging.example.com" username="jdoe@example.com" --private password='Xk7hgnB8e!3dzflk3'

$ owl patients/list --env local # GET http://localhost:3000 with bearer `eyJhbGciOiJIUzI1NiIs...`
$ owl patients/list --env staging # GET https://staging.example.com with a prompt for the jwt

$ owl update login --url "{env.host}/login" --body '{"username": "{env.username}", "password": "{env.password}"}' # update not yet implemented
$ owl login --env staging # POST https://staging.example.com/login with a prompt for the jwt
{ "jwt": "eyJhbGciOiJIVwpQQzWa4..."}
$ owl state patch --env staging jwt="eyJhbGciOiJIVwpQQzWa4..." # manually store the jwt in our local state
$ owl patients/list --env staging # GET https://staging.example.com with bearer `eyJhbGciOiJIVwpQQzWa4...`

$ owl verify 'status=2XX' 'success(status)' 'body.[].length=4' 'body.[0].lastName=Smith' 'match(body.[0].firstName, /john/i)' 'sorted(body.[].id)' 'sorted(body.[].id, desc)'
$ owl verify 'status=2XX AMD success(status) AND body.[].length=4 AND body.[0].lastName=Smith AND match(body.[0].firstName, /john/i) AND sorted(body.[].id) AND sorted(body.[].id, desc)'
$ owl verify 'status=200 AND match(header:authorization, /^Bearer eyJ/) AND request:header:content-type=application/json'

$ owl history


```

## CLI Design Examples

```sh

# create .owl directory
owl init

# running requests
[x] owl patients/list # issue a patient list request
[x] owl request patients/list # same as above, but with an explicit subcommand
[x] owl patients/list --env staging # issue a patient list request to staging
owl patients/list --param name # issue a patients list request, with the name param
owl patients/list --param name="John" # issue a patients list request with the name param as john
owl patients/list --no-param q # issue a patients list request without the q param
owl users/login --set-state "auth.jwt={response.body}"
# owl users/login --response-set-state "auth.jwt={response.body}"
[x] owl users/login # print only the response body
[x] owl users/login --status --url # print the request method/url and status
[x] owl users/login -i # print the request method/url, http status, and response headers
[x] owl users/login -v # print the request method/url, http status, request and response headers
[x] owl users/get id=12345
[x] owl users/get # prompts for the id

# output request
owl as curl patients/list --env staging # print the curl request
owl copy curl patients/list --env production # print and copy to the clipboard the currequest
owl curl patients/list --env production -- -H 'Accept: application/json' # issue a patients/list request by actually running curl
owl details patients/list
owl export insomnia [outfile]
owl export postman [outfile]
owl import insomnia [infile]
owl import postman [infile]


# creating requests
owl create patients/list "http://localhost:3000/patients" --param q="john" --method get --header accept=application/json
owl show patients
owl from curl patients/list -- curl http://localhost:3000/patients?q=john -H 'Authorization: Bearer token'
owl update patients/list --url "{env.host}/patients" --rm-param q --param "jwt={state.jwt}"

owl rm patients/list


# get info about requests
owl list # list all top level keys
owl list patients # list all top level keys
owl list --all # list all requests
owl details patients/list # show details about the patient/list request

# interactive editor
owl create
owl create patients/list
owl update
owl request
owl show
owl rm

# request history
[x] owl last # show the most recent request (would be equivalent to `owl show 1`, accepts the same print arguments as requests)
[x] owl history # list last n previous requests
owl history patients/list # list last n patients/list request

[x] owl show [id]
[x] owl show 1

# environment managing
[x] owl env create staging
[x] owl env create local # create a new environment named `local`
[x] owl env list # list all environments
[x] owl env default local # set the local environment to be the saved default
[-] owl env use staging # use the staging environment for all subsequent calls within this shell
[x] owl env put local host="http://localhost:3000" token='token'
[x] owl env put staging host="http://staging.example.com"
[x] owl env put staging --private token='my-secret-token'
[x] owl env patch staging --private token='my-secret-token'
[x] owl env put local some.key='{"json":true}'
[x] owl env patch local '{"host": "http://localhost:3000}", "token": "token", "some": { "key": false } }'
[x] owl env patch local --unset some.key --unset token
[x] owl env rm staging
[x] owl env rename local dev
[x] owl env print local
[x] owl env print local --show-private

# state
[x] owl state
[x] owl state patch jwt="eyJhbGciOiJIUzI1NiIs..."
[x] owl state patch test:1 jwt="eyJhbGciOiJIUzI1NiIs..."
[x] owl state patch --state test:1 jwt="eyJhbGciOiJIUzI1NiIs..."
[x] owl state put jwt="eyJhbGciOiJIUzI1NiIs..."
[x] owl state clear
[x] owl state clear --env staging
[x] owl state print test:1
[x] owl state print test:1 --env staging

[x] owl state list
[x] owl state mv test:1 test:2
[x] owl state rename test:1 test:2
[x] owl state cp test:1 test:2
[x] owl state copy test:1 test:2
[x] owl state clear test:1
[x] owl state patch test:1 jwt="eyJhbGciOiJIUzI1NiIs..."
[x] owl state put test:1 jwt="eyJhbGciOiJIUzI1NiIs..."

owl verify [id] --response-status 200,201
owl verify [id] --response-status 2XX
owl verify [id] --response-status success
owl verify [id] --response-status 404
owl verify [id] --response-status 4XX
owl verify [id] --response-status error
owl verify [id] --response-header 'Authorization=Bearer jwt'
owl verify [id] --response-header-exists Authorization
owl verify [id] --response-body '{"hello": "world"}'
owl verify [id] --response-status 2XX --response-json-body-contains '{"ok": true}' --response-header-exists 'Authorization'

owl state clear --cookies test:1

owl state set-cookie test:1 response='bar'
owl state unset-cookie test:1 response
```

## Design Goals


## Integration Tests
- `docker-compose up -d`
- `dc -f docker-compose.integration.yml run local zsh /tests/runner.sh`

### Local Integration Test Development

- Integration tests live in `integration/local/tests`
- The runner is a simple bash script in `integration/local/tests/runner.sh`

### Remote Integration Development

To develop on the remote integration endpoint:

- `cd integration/remote`
- `npm run dev`
- `curl -v localhost:3000/`