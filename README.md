# nightowl

A cli for managing a collection of http requests across a collection of environments. Designed to be useful as part of local development and integration test suites.

Note: This project is still in development and should not be used.


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

owl state clear --cookies test:1

owl state set-cookie test:1 response='bar'
owl state unset-cookie test:1 response
```

## Design Goals

