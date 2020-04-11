export interface AspenConfig {
  clientId: string;
  callbackURL: string;
}

type PhoneNumber = string;
type EmailAddress = string;
export type UserCredential = PhoneNumber | EmailAddress;

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  AWAITING_CONFIRMATION = "awaiting confirmation",
  CONNECTED = "connected",
}
