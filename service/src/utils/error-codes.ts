// This file should be extracted into the proposed npm package that the webapp can consume
// and use for consistency

export interface StreamCommsError {
  code: SarcophagusValidationError;
  message: string;
}

export enum SarcophagusValidationError {
  UNKNOWN_ERROR,
  MAX_REWRAP_INTERVAL_TOO_LARGE,
  INVALID_ARWEAVE_SHARD,
  DIGGING_FEE_TOO_LOW,
  INVALID_TIMESTAMP,
}
