import { AspenClient } from "../src/AspenClient";
import AuthClient from "../src/auth/oauth-client";

jest.mock("../src/auth/oauth-client");
jest.mock("pouchdb");
jest.mock("../src/outbox", () => jest.fn());

// @ts-ignore
let aspen: AspenClient;

describe("Database works for existing user", () => {
  beforeAll(() => {
    // @ts-ignore
    aspen = new AspenClient(new AuthClient());
  });

  test("Can get exisiting user database context", () => {
    const context = aspen.currentUser();
    expect(context).toBeDefined();
  });

  test("Can create a collection context on current user", () => {
    const collection = aspen.currentUser().collection("testCollection");
    expect(collection).toBeDefined();
  });

  test.skip("Can add and get data in a collection", async () => {
    await aspen.currentUser().collection("testName").add({ test: "data" });
    const allData = await aspen.currentUser().collection("testName").getAll();
    console.log(allData);
    expect(allData.rows.length).toBe(1);
  });
});

describe("Database works for anonymous user", () => {
  beforeAll(() => {
    // @ts-ignore
    AuthClient.mockImplementation(() => ({
      isAuthenticated: () => false,
      redirectUri: "http://localhost:1234/callback",
    }));
    // @ts-ignore
    aspen = new AspenClient(new AuthClient());
  });

  test("Cannot access currentUser when unauthenticated", () => {
    expect(() => {
      aspen.currentUser();
    }).toThrowError();
  });

  test.skip("You can request data from other users databases", async () => {
    const resp = await aspen.user("someOtherUser").collection("test").getAll();
    console.log(resp);
  });
});
