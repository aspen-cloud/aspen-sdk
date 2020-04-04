import { AuthToken, IdentityToken, ErrorResp } from "./types/oauth-client";
import jwtDecode from "jwt-decode";
import crypto from "crypto";

export default class AuthClient {
  private clientId: string;
  private redirectUri: string;
  private scope: string[];
  private authEndpoint: string;

  private authToken: AuthToken | null;

  constructor({
    clientId,
    redirectUri,
    scope,
    authEndpoint,
  }: {
    clientId: string;
    redirectUri: string;
    scope: string[];
    authEndpoint: string;
  }) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.scope = scope;
    this.authEndpoint = authEndpoint;
    this.authToken = this.initAuthToken();
  }

  private initAuthToken(): AuthToken | null {
    const tokenString = window.localStorage.getItem("authToken");
    return tokenString && JSON.parse(tokenString);
  }

  async handleAuthRedirect(location: Location) {
    // TODO compare redirect URI and provided url
    const params = new window.URLSearchParams(location.search);
    const code = params.get("code");
    if (!code) {
      throw new Error("Endpoint did not return code.");
    }
    const state = params.get("state");
    const savedState = window.localStorage.getItem("state");
    window.localStorage.removeItem("state");
    if (state !== savedState) {
      throw new Error("Server returned state different than state provided.");
    }
    const token = await this.getTokenWithCode(code);
    window.localStorage.setItem("authToken", JSON.stringify(token));
    this.authToken = token;
  }

  private async getTokenWithCode(code: string) {
    const codeVerifier = localStorage.getItem("codeVerifier");
    localStorage.removeItem("codeVerifier");
    if (!codeVerifier) {
      throw new Error("Could not retrieve code verifier from local storage.");
    }
    const data = {
      grant_type: "authorization_code",
      client_id: this.clientId,
      code_verifier: codeVerifier,
      code: code,
      redirect_uri: this.redirectUri,
    };
    const resp = await fetch(this.authEndpoint + "token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Object.entries(data)
        .map(pair => pair.join("="))
        .join("&"),
    });
    const token = (await resp.json()) as AuthToken | ErrorResp;

    if ("error" in token) {
      console.error(token.error_description, token.error_hint);
      throw new Error(token.error);
    }
    return token;
  }

  get accessToken() {
    return this.authToken?.access_token;
  }

  get identityToken(): IdentityToken | null {
    return this.authToken && jwtDecode(this.authToken.id_token);
  }

  unauthenticate() {
    window.localStorage.removeItem("authToken");
    this.authToken = null;
  }

  fetch(url: string, method = "GET", options?: {}) {
    if (!this.authToken) {
      throw new Error("No token provided. Cannot make authorized fetch.");
    }
    return fetch(url, {
      method,
      credentials: "omit",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        // @ts-ignore
        Authorization: `Bearer ${this.accessToken}`,
      },
      ...options,
    });
  }

  getAuthURL() {
    const codeVerifier = createCodeVerifier();
    localStorage.setItem("codeVerifier", codeVerifier);
    const codeChallenge = createCodeChallenge(codeVerifier);

    const state = window.crypto
      .getRandomValues(new Uint32Array(1))[0]
      .toString();
    window.localStorage.setItem("state", state);

    const authURL = new URL(this.authEndpoint + "auth");
    authURL.searchParams.append("response_type", "code");
    authURL.searchParams.append("client_id", this.clientId);
    authURL.searchParams.append("redirect_uri", this.redirectUri);
    authURL.searchParams.append("state", state);
    authURL.searchParams.append(
      "scope",
      encodeURIComponent(this.scope.join(" ")),
    );
    authURL.searchParams.append("code_challenge", codeChallenge);
    authURL.searchParams.append("code_challenge_method", "S256");

    return authURL.toString();
  }
}

function base64URLEncode(str: Buffer) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(buffer: Buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest();
}

function createCodeVerifier(): string {
  return base64URLEncode(crypto.randomBytes(32));
}

function createCodeChallenge(str: string): string {
  const buffer = Buffer.from(str);
  return base64URLEncode(sha256(buffer));
}
