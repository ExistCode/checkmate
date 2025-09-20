const region = process.env.AWS_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

if (!region || !userPoolId || !clientId) {
  throw new Error(
    "AWS_REGION, COGNITO_USER_POOL_ID, and COGNITO_CLIENT_ID environment variables are required for Convex auth configuration."
  );
}

export default {
  providers: [
    {
      domain: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      applicationID: clientId,
    },
  ],
};
