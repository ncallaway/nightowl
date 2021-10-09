# nightowl

A cli for managing a collection of http requests across a collection of environments. Designed to be useful as part of local development and integration test suites.

## CLI Design Examples

```sh

# running requests
owl patients/list # issue a patient list request
owl request patients/list # same as above, but with an explicit subcommand
owl patients/list --env staging # issue a patient list request to staging
owl patients/list --param name # issue a patients list request, with the name param
owl patients/list --param name="John" # issue a patients list request with the name param as john
owl patients/list --no-param q # issue a patients list request without the q param
owl users/login --set-state "auth.jwt={response.body}"
owl users/login --print "{response.body}"

# output request
owl as curl patients/list --env staging # print the curl request
owl copy curl patients/list --env production # print and copy to the clipboard the currequest
owl curl patients/list --env production -- -H 'Accept: application/json' # issue a patients/list request by actually running curl
owl show patients/list


# creating requests
owl create patients/list "http://localhost:3000/patients" --param q="john" --method get --header accept=application/json
owl show patientss
owl from curl patients/list -- curl http://localhost:3000/patients?q=john -H 'Authorization: Bearer token'
owl update patients/list --url "{env.host}/patients" --rm-param q --param "jwt={state.jwt}"

owl rm patients/list


# get info about requests
owl list # list all top level keys
owl list patients # list all top level keys
owl list --all # list all requests
owl show patients/list # show details about the patient/list request

# interactive editor
owl create
owl create patients/list
owl update
owl request
owl show
owl rm

# request history

owl history # list last n previous requests
owl history patients/list # list last n patients/list request
owl history show [id] # show the details for a particular request

# environment managing
owl env create staging
owl env create local # create a new environment named `local`
owl env list # list all environments
owl env default local # set the local environment to be the saved default
owl env use staging # use the staging environment for all subsequent calls within this shell
owl env put local host="http://localhost:3000" token='token'
owl env put staging host="http://staging.example.com"
own env put staging --private token='my-secret-token'
owl env put local some.key='{"json":true}'
owl env patch local '{"host": "http://localhost:3000}", "token": "token", "some": { "key": false } }'
owl env patch local --unset some.key --unset token
owl env rm staging
owl env print local
owl env print local --show-private

# state
owl state create test:1
owl state use test:1
owl state clear test:1
owl state pathc test:1 jwt="eyJhbGciOiJIUzI1NiIs..."
owl state post test:1 jwt="eyJhbGciOiJIUzI1NiIs..."

owl state clear --cookies test:1

owl state set-cookie test:1 response='bar'
owl state unset-cookie test:1 response
```

## Design Goals

