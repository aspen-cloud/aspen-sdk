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

/**
 * The primary Aspen Client that's usable after the user has authenticated.
 */
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
  /**
   * Navigates user to Aspen's login/regisration and returns to your app after succesful authentication.
   * @param cred A optional credential (e.g. username, email) to start the auth flow.
   */
  login(cred?: UserCredential) {
    if (!cred) {
      window.location.href = this.authClient.getAuthURL();
    }
  }

  /**
   * Unathenticates the currently signed-in user.
   * @param cred A optional credential (e.g. username, email) to start the auth flow.
   */
  logout() {
    this.authClient.unauthenticate();
    this.userState = ConnectionState.DISCONNECTED;
  }

  /**
   * Gets currently authenticated user's profile if permitted.
   */
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

  /**
   * Returns a collection instance scoped to the provided name to store and retrieve documents.
   * @param name The name of the collection
   */
  collection(name: string) {
    return new Collection(this.db, name);
  }

  /**
   * Subscribes to the user's application inbox
   * @param callback
   */
  onNewMessages(callback: (newDoc: object) => void) {
    this.inbox.subscribe(callback);
  }

  /**
   * Sends a doc to users contact by username. The doc will be stored in the recipient's database and optionally notify the recipient.
   * @param doc
   * @param username
   */
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

/**
 * The Aspen client that's accessible before the user is signed in and authenticated.
 * It provides basic functionally to retrieve information about the app and log the user in.
 */
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
