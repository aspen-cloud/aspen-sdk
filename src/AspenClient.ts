import { UserCredential, ConnectionState } from "./types/index";
import AuthClient from "./auth/oauth-client";
import PouchDB from "pouchdb";

PouchDB.plugin(require("pouchdb-upsert"));
PouchDB.plugin(require("pouchdb-adapter-http"));

import { API_URL } from "./config";
import { Collection } from "./Collection";

export abstract class BaseClient {
  abstract isLoggedIn(): boolean;
  abstract login(): void;
  abstract logout(): void;
  protected authClient: AuthClient;
  constructor(authClient: AuthClient) {
    this.authClient = authClient;
  }
}

export class AspenClient extends BaseClient {
  private authCallback?: (state: ConnectionState) => any;
  private db: PouchDB.Database;
  private inbox: Collection;
  private outbox: Collection;
  constructor(authClient: AuthClient) {
    super(authClient);
    const accessToken = this.authClient.accessToken;
    const appId = this.authClient.clientId;
    const userId = this.authClient.identityToken!.sub;
    this.db = new PouchDB(`${API_URL}/${userId}/${appId}`, {
      fetch: (url: string | Request, opts?: RequestInit) => {
        // @ts-ignore
        if (opts) {
          opts.credentials = "omit";
          if (!opts.headers) {
            opts.headers = {} as Record<string, string>;
          }
          // @ts-ignore
          opts.headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return PouchDB.fetch(url, opts);
      },
    });
    this.inbox = this.collection("_inbox");
    this.outbox = this.collection("_outbox");
  }
  private set userState(newState: ConnectionState) {
    if (this.authCallback) {
      this.authCallback(newState);
    }
  }
  login(cred?: UserCredential) {
    if (!cred) {
      window.location.href = this.authClient.getAuthURL();
    }
  }
  logout() {
    this.authClient.unauthenticate();
    this.userState = ConnectionState.DISCONNECTED;
  }
  async getUserProfile() {
    const resp = await this.authClient.fetch(
      // @ts-ignore
      //"http://localhost:3000/api/" + this.authClient.identityToken.sub,
      // @ts-ignore
      Aspen.API_URL + "/" + this.authClient.identityToken.sub,
    );
    const user = resp.json();
    return user;
  }
  isSignedIn() {
    return true;
  }
  isLoggedIn() {
    return true;
  }
  //   onAuthChange(callback: (state: ConnectionState) => any) {
  //     this.authCallback = callback;
  //   }
  collection(name: string) {
    return new Collection(this.db, name);
  }
  onNewMessages(callback: (newDoc: object) => void) {
    this.inbox.subscribe(callback);
  }
  async sendDocTo(doc: any, username: string) {
    this.outbox.add({
      to: username,
      body: doc,
    });
    // return this.authClient.fetch(
    //   `${API_URL}/inbox/${username}/${this.authClient.clientId}/`,
    //   "POST",
    //   {
    //     body: JSON.stringify(doc),
    //   },
    // );
  }
}

export class PreAuthAspenClient extends BaseClient {
  constructor(authClient: AuthClient) {
    super(authClient);
    if (
      window.location.pathname == new URL(this.authClient.redirectUri).pathname
    ) {
      this.authClient.handleAuthRedirect(window.location).then(() => {
        window.location.assign("/");
      });
    }
  }
  isLoggedIn() {
    return false;
  }
  login(cred?: UserCredential) {
    if (!cred) {
      window.location.assign(this.authClient.getAuthURL());
    }
  }
  logout() {
    throw new Error("Cannot logout without being logged in.");
  }
}
