import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Same-origin by default; set baseURL if the auth server lives elsewhere.
export const authClient = createAuthClient({ plugins: [adminClient()] });
