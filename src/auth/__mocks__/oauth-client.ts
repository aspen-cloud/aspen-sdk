const mockREDIRECT_URI = "http://localhost:1234/callback";
export const mockRedirectHandler = jest.fn(
  () => new Promise((resolve) => resolve()),
);

export default jest.fn().mockImplementation(() => {
  return {
    redirectUri: mockREDIRECT_URI,
    handleAuthRedirect: mockRedirectHandler,
    accessToken: "test-token",
    isAuthenticated: () => true,
    identityToken: { sub: "mock-user-id" },
  };
});
