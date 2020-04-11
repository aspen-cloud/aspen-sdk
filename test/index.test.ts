import Aspen from "../src/index";
import { PreAuthAspenClient, AspenClient } from "../src/AspenClient";
import AuthClient from "../src/auth/oauth-client";

const mockREDIRECT_URI = "http://localhost:1234/callback";
const mockRedirectHandler = jest.fn(() => new Promise((resolve) => resolve()));

jest.mock("../src/auth/oauth-client");

describe("createClient provides the appropriate client", () => {
  beforeAll(() => {
    // @ts-ignore
    AuthClient.mockImplementationOnce(() => {
      return {
        redirectUri: mockREDIRECT_URI,
        handleAuthRedirect: mockRedirectHandler,
        accessToken: null,
        identityToken: null,
      };
    }).mockImplementationOnce(() => {
      return {
        redirectUri: mockREDIRECT_URI,
        handleAuthRedirect: mockRedirectHandler,
        accessToken: "test-token",
        identityToken: { sub: "mock-user-id" },
      };
    });
  });

  test("Aspen provides pre-auth client when not authenticated", () => {
    const aspenClient = Aspen.createClient({
      clientId: "test-client",
      callbackURL: "http://localhost:1234",
    });

    expect(aspenClient).toBeInstanceOf(PreAuthAspenClient);
    expect(aspenClient.isLoggedIn()).toBe(false);
  });

  test("Aspen provides post-auth client when authenticated", () => {
    const mockToken = {
      access_token: "test-token",
    };

    localStorage.setItem("authToken", JSON.stringify(mockToken));

    const aspenClient = Aspen.createClient({
      clientId: "test-client",
      callbackURL: "http://localhost:1234",
    });

    expect(localStorage.getItem("authToken")).toEqual(
      JSON.stringify(mockToken),
    );
    expect(aspenClient).toBeInstanceOf(AspenClient);
    expect(aspenClient.isLoggedIn()).toBeTruthy();
  });
});

describe("Pre-auth client correctly handles redirect_uri", () => {
  let authClient: AuthClient;

  beforeAll(() => {
    // @ts-ignore
    AuthClient.mockImplementationOnce(() => {
      return {
        redirectUri: mockREDIRECT_URI,
        handleAuthRedirect: mockRedirectHandler,
        accessToken: null,
        identityToken: null,
      };
    });

    delete window.location;

    authClient = new AuthClient({
      redirectUri: mockREDIRECT_URI,
      authEndpoint: "http://localhost/auth",
      clientId: "test",
      scope: ["openid"],
    });
  });

  it("ignores urls that don't match the redirect url", () => {
    // @ts-ignore
    window.location = {
      pathname: new URL(mockREDIRECT_URI).pathname,
      assign: jest.fn(),
    };
  });

  it("reacts when the url matches the redirect url", () => {
    // @ts-ignore
    window.location = {
      pathname: "/",
      assign: jest.fn(),
    };

    const preAuthClient = new PreAuthAspenClient(authClient);

    expect(mockRedirectHandler).not.toHaveBeenCalled();
  });
});

describe("Post-Auth Aspen Client works correctly", () => {
  let authClient: AuthClient;
  beforeAll(() => {
    // @ts-ignore
    AuthClient.mockImplementationOnce(() => {
      return {
        redirectUri: mockREDIRECT_URI,
        handleAuthRedirect: mockRedirectHandler,
        accessToken: null,
        identityToken: null,
      };
    });

    authClient = new AuthClient({
      redirectUri: mockREDIRECT_URI,
      authEndpoint: "http://localhost/auth",
      clientId: "test",
      scope: ["openid"],
    });
  });
});
