export type AuthGetToken = (options?: { template?: string }) => Promise<string | null>;

export type AuthState = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  getToken: AuthGetToken;
  signOut: () => Promise<void>;
  email: string | null;
  displayName: string | null;
};

export const GUEST_AUTH: AuthState = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  getToken: async () => null,
  signOut: async () => undefined,
  email: null,
  displayName: null,
};
