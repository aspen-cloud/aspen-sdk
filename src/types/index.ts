import { AspenAppScope } from "@aspen.cloud/aspendb";

export interface AspenConfig {
  clientId: string;
  callbackURL: string;
}

// User fields
export interface User {
  db: AspenAppScope;
  id: string;
  fullName: string;
}

// User Methods
export interface User {
  notify: (message: { title?: string; text: string }) => Promise<void>;
  sendEmail: (message: { title?: string; text: string }) => Promise<void>;
}

export interface AppInfo {
  name: string;
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

export interface iAspen {
  clientID: string;
  callbackURL: string;
  User: {
    login: (cred?: UserCredential) => Promise<User>;
    isLoggedIn: () => boolean;
    getCurrentUser: () => User | null;
    getState: () => ConnectionState;
  };

  App: {
    getInfo: () => Promise<AppInfo>;
  };
}

interface AspenObject {}
