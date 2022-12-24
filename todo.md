### Next Features

- [ ] UX necessities:

  - [x] add init command
  - [ ] all other commands detect no '.owl' directory and print a warning
    - started, done with commands that useStore
    - need to add ensureStore to other commands
  - [x] help command
  - [x] unrecognized command output
  - [x] version information
  - [x] add import from curl
  - [ ] help for specific command
  - [x] help for error messages

- [x] warnings zero
- [x] Add integration tests to pre-push hook

- [ ] request editing
  - [ ] owl list
    - owl list
    - owl list [prefix]
    - owl list --all
  - [ ] owl remove <request-key>
  - [ ] owl create <request-key> [args]
  - [x] owl create <request-key> -- [curl]
    - fork importers and allow calling with
    - live importers in https://github.com/Kong/insomnia/blob/5b2707cb760b901ea1f77067cc0ba92e81fb3644/packages/insomnia/src/utils/importers/importers/curl.ts
    -- import in insomnia is in packages/insomnia-app/app/ui/components/wrapper.tsx
      - _handleImport
  - [ ] owl update <request-key> [args]
  - [ ] owl details <request-key>
  - [ ] owl move <request-key> <request-key>

- [ ] Print curl command
- [ ] History commands

- [ ] Schema validation for `env`
  - probably need to make common `reader` helpers, since we read these files in a number of places


- [ ] Start basic documentation
  - [ ] Command help documentation
  - [x] Error help documentation
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
