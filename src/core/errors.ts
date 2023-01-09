export type InternalErrorKey =
    'file-not-found'
  | 'file-empty'
  | 'json-parse-error'
  | 'schema-validation-error'
  ;

export type InternalError = {
    error: InternalErrorKey;
    detail?: string | Error;
    identifier?: string;
  }

export type OwlErrorKey =
  // indicates that the owl directory could not be found on disk
  'err-owldir-not-found'

  // indicates that the owl directory was found on disk, but the structure of the folder was not
  // recognized (e.g. it was a file instead of a directory, or the directory did not have the
  // expected structure (.config, .env/.config, etc).
  | 'err-owldir-not-recognized'

  // indiciates that the store already exists when the user attempted to initialize it.
  | 'err-owldir-already-exists'

  // an unknown error occurred while the writing to the owl directory
  | 'err-writing-owldir'

  // indicates the request definition was invalid in some way
  | 'err-invalid-request-def'

  // indicates that we tried to create a request definition that already exists
  | 'err-request-def-already-exists'
  | 'err-request-def-not-found'
  | 'err-request-group-already-exists'

  // indicates an error occurred while writing the request definition to
  // disk
  | 'err-writing-request-def'

  // the given import string was not recognized, and could not be imported
  | 'err-unrecognized-request-import'

  // environment
  | 'err-env-not-found'
  | 'err-env-already-exists'
  | 'err-reading-env'
  | 'err-writing-env'
  | 'err-invalid-env-name' // the environment name provided did not meet our rules
  | 'err-no-default-env' // there are 0 environments, so no default exists

  // env config
  | 'err-writing-env-config'
  | 'err-reading-env-config'

  // state
  | 'err-invalid-state-name' // the state name did not meet our rules
  ;

export type OwlError = {
  error: OwlErrorKey;
  detail?: string | Error;
  identifier?: string;
}