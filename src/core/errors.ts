export type OwlErrorKey =
  // indicates that the .owl directory (or whatever directory is configured as the store) could
  // not be found on disk
  'err-store-not-found'

  // indicates that the .owl directory was found on disk, but the structure of the folder was not
  // recognized (e.g. it was a file instead of a directory, or the directory did not have the
  // expected structure (.config, .env/.config, etc).
  | 'err-store-not-recognized'

  // indiciates that the store already exists when the user attempted to initialize it.
  | 'err-store-already-exists'

  // an unknown error occurred while the store was being initialized
  | 'err-store-initialization';

export type OwlError = {
  error: OwlErrorKey;
  detail?: string | Error;
}