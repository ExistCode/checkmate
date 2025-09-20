import { betterAuth } from "better-auth";

const region = (process.env.COGNITO_REGION || process.env.APP_REGION) as string;
const userPoolId = process.env.COGNITO_USER_POOL_ID as string;

export const auth = betterAuth({
  // Provide a secret for signing cookies/tokens
  secret: process.env.BETTER_AUTH_SECRET as string,
  socialProviders: {
    cognito: {
      clientId: process.env.COGNITO_CLIENT_ID as string,
      clientSecret: process.env.COGNITO_CLIENT_SECRET as string | undefined,
      domain: process.env.COGNITO_DOMAIN as string,
      region,
      userPoolId,
    },
  },
});
