### Next Features

- [ ] UX necessities:

  - [x] add init command
  - [ ] all other commands detect no '.owl' directory and print a warning
    - started, done with commands that useStore
    - need to add ensureStore to other commands
  - [ ] help command
  - [ ] unrecognized command output
  - [ ] version information
  - [ ] help for when command isn't known
  - [ ] add import from curl

- [ ] Print curl command
- [ ] History commands



- [ ] Start basic documentation

  - [ ] Draft basic getting started information

- [x] move prompts into `core`
- [x] move issue request into core
  - [x] move rendering request into core
  - [x] move running request into core
- [x] Plan how requests storage will work
- [x] Plan request states will be managed

- [x] Port insomnia network stack
- [x] Cleanup `npm run lint` errors

- [x] figure out storage plan
  - [x] per-directory environment privates
  - [x] per-directory environment state
  - [x] per-directory request history
- [x] Store requests in history

- [x] Cleanup command itself

  - [x] Manage logging during request
  - [ ] Display progress status during request
  - [x] Display response data more carefully
  - [ ] Allow ctrl+c cancellation
  - [x] Handle closing the store

- Bad .owl environment issues
- [ ] New environment issues
- [ ] Request loading issues (handle malformed requests and/or requests that don't have enough properties)

Next features

- [x] Allow writing to state, templating from state
- [ ] Import & Export
- [x] Cookies

###

sqlite db of requests, state

### history, state

https://github.com/sindresorhus/env-paths#pathsconfig

~/.local/share/nightowl-nodejs/{owl-key}.sqlite

### privates (conf)

~/.config/nightowl/{owl-key}-private.json
