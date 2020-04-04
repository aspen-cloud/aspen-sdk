export interface AuthToken {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: "bearer";
}

//TODO add descriptions for each field
export interface IdentityToken {
  at_hash: string; // Acces Token hash
  aud: string[]; // List of client id's
  auth_time: number; // When authentication occured
  exp: number; // Expiration time
  iat: number; // Issued at (time)
  iss: string; // Issuer (who created token)
  jti: string; // JWT ID
  nonce: string; // Unique value for request and token
  rat: number; // Unique value for request and token
  sid: string; // Session identifier
  sub: string; // Who the token refers to (username)
}

export interface ErrorResp {
  error: string;
  error_debug: string;
  error_description: string;
  error_hint: string;
  status_code: number;
}
