import { AspenConfig } from "./types/index";
import AuthClient from "./auth/oauth-client";

import { AspenClient, PreAuthAspenClient } from "./AspenClient";
import { AUTH_URL } from "./config";

interface Aspen {
  createClient: (config: AspenConfig) => PreAuthAspenClient | AspenClient;
}

function createClient(config: AspenConfig) {
  const authClient = new AuthClient({
    clientId: config.clientId,
    scope: ["openid", "storage"],
    redirectUri: config.callbackURL,
    authEndpoint: AUTH_URL,
  });

  return new AspenClient(authClient);

  // if (authClient.accessToken) {
  //   return new AspenClient(authClient);
  // } else {
  //   return new PreAuthAspenClient(authClient);
  // }
}

export default { createClient };
