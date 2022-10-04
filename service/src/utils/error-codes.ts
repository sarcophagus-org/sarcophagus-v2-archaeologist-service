// This file should be extracted into the proposed npm package that the webapp can consume 
// and use for consistency

export interface StreamCommsError {
    code: number,
    message: string,
}

export enum SarcophagusValidationError {
   UNKNOWN_ERROR = 1,
   MAX_REWRAP_INTERVAL_TOO_LARGE = 2,
   INVALID_ARWEAVE_SHARD = 3,
   DIGGING_FEE_TOO_LOW = 4,
   INVALID_TIMESTAMP = 5
}