// This file should be extracted into the proposed npm package that the webapp can consume 
// and use for consistency

export interface StreamCommsError {
    code: number,
    message: string,
}

export const UNKNOWN_ERROR = 1;
export const MAX_REWRAP_INTERVAL_TOO_LARGE = 2;
export const INVALID_ARWEAVE_SHARD = 3;