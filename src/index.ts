import {
  iAspen,
  AspenConfig,
  User,
  UserCredential,
  ConnectionState,
} from "./types/index";

import AuthClient from "./auth/oauth-client";

import PouchDB from "pouchdb";
PouchDB.plugin(require("pouchdb-adapter-http"));

export default class Aspen {
  private static AUTH_URL = "https://localhost:9000/oauth2/";
  //private static AUTH_URL = "https://oauth.aspen.cloud/oauth2/";
  //private user?: User;
  private clientId: string;
  private callbackURL: string;
  private authCallback?: (state: ConnectionState) => any;
  private _userState: ConnectionState;
  private authState?: string;
  private db?: PouchDB.Database;

  private authClient: AuthClient;

  constructor(config: AspenConfig) {
    this.clientId = config.clientId;
    this.callbackURL = config.callbackURL;
    this._userState = ConnectionState.CONNECTING;

    this.authClient = new AuthClient({
      clientId: config.clientId,
      scope: ["openid"],
      redirectUri: config.callbackURL,
      authEndpoint: Aspen.AUTH_URL,
    });

    if (this.authClient.accessToken) {
      this.userState = ConnectionState.CONNECTED;
    } else {
      this.userState = ConnectionState.DISCONNECTED;
    }

    this.init();

    if (window.location.pathname == new URL(this.callbackURL).pathname) {
      this.authClient.handleAuthRedirect(window.location).then(() => {
        window.location.href = "/";
      });
    }
  }

  private connectDB({
    accessToken,
    appID,
    userID,
  }: {
    accessToken: string;
    appID: string;
    userID: string;
  }) {
    this.db = new PouchDB(`http://localhost:3000/api/${userID}/${appID}`, {
      fetch: (url, opts) => {
        // @ts-ignore
        opts.credentials = "omit";
        // @ts-ignore
        opts.headers.set("Authorization", `Bearer ${accessToken}`);
        return PouchDB.fetch(url, opts);
      },
    });
  }

  private init() {
    const accessToken = this.authClient.accessToken;
    const identityToken = this.authClient.identityToken;
    if (accessToken && identityToken) {
      try {
        this.connectDB({
          accessToken,
          appID: this.clientId,
          userID: identityToken.sub,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  private get userState() {
    return this._userState;
  }

  private set userState(newState: ConnectionState) {
    this._userState = newState;
    if (this.authCallback) {
      this.authCallback(newState);
    }
  }

  async sendDocTo(doc: any, username: string) {
    return this.authClient.fetch(
      `http://localhost:3000/api/inbox/${username}/${this.clientId}/`,
      "POST",
      {
        body: JSON.stringify(doc),
      },
    );
  }

  user = {
    login: (cred?: UserCredential) => {
      if (!cred) {
        window.location.href = this.authClient.getAuthURL();
      }
    },
    logout: () => {
      this.authClient.unauthenticate();
      this.userState = ConnectionState.DISCONNECTED;
    },
    get: async () => {
      const resp = await this.authClient.fetch(
        // @ts-ignore
        "http://localhost:3000/api/" + this.authClient.identityToken.sub,
      );
      const user = resp.json();
      return user;
    },
    isSignedIn: () => {
      return !!this.authClient.accessToken;
    },
    isLoggedIn: () => {
      return this.user.isSignedIn();
    },
    getState: () => {
      return this.userState;
    },
    onAuthChange: (callback: (state: ConnectionState) => any) => {
      this.authCallback = callback;
    },
  };
}
