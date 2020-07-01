import { version } from "../../package.json";
import { Router } from "express";
import facets from "./facets";
import fetch from "node-fetch";
global["fetch"] = fetch;
import Amplify, { Auth } from "aws-amplify";

Amplify.configure({
  Auth: {
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    //   identityPoolId: "XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab",

    // REQUIRED - Amazon Cognito Region
    region: "eu-west-1",

    // OPTIONAL - Amazon Cognito Federated Identity Pool Region
    // Required only if it's different from Amazon Cognito Region
    //   identityPoolRegion: "XX-XXXX-X",

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: "eu-west-1_FiFlkqeHB",

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: "5g8rbpi7ftk4md1fgvkkbhdupc",

    // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
    // mandatorySignIn: false,

    // OPTIONAL - Configuration for cookie storage
    // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
    // cookieStorage: {
    //   // REQUIRED - Cookie domain (only required if cookieStorage is provided)
    //   domain: ".yourdomain.com",
    //   // OPTIONAL - Cookie path
    //   //   path: "/",
    //   // OPTIONAL - Cookie expiration in days
    //   //   expires: 365,
    //   // OPTIONAL - Cookie secure flag
    //   // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
    //   secure: true,
    // },

    // OPTIONAL - customized storage object
    // storage: MyStorage,

    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    // authenticationFlowType: "USER_PASSWORD_AUTH",

    // OPTIONAL - Manually set key value pairs that can be passed to Cognito Lambda Triggers
    // clientMetadata: { myCustomKey: "myCustomValue" },

    // OPTIONAL - Hosted UI configuration
    // oauth: {
    //   domain: "your_cognito_domain",
    //   scope: [
    //     "phone",
    //     "email",
    //     "profile",
    //     "openid",
    //     "aws.cognito.signin.user.admin",
    //   ],
    //   redirectSignIn: "http://localhost:3000/",
    //   redirectSignOut: "http://localhost:3000/",
    //   responseType: "code", // or 'token', note that REFRESH token will only be generated when the responseType is code
    // },
  },
});
const currentConfig = Auth.configure();

async function signUp(username, password, email) {
  console.log("pepe", username, password, email);
  try {
    const user = await Auth.signUp({
      username: username,
      password: password,
      attributes: {
        email: email, // optional
        // phone_number, // optional - E.164 number convention
        // other custom attributes
      },
    });
    console.log({ user });
    return user;
  } catch (error) {
    console.log("error signing up:", error);
    return error;
  }
}

async function signIn(username, password) {
  console.log("paolo", username, password);
  try {
    const user = await Auth.signIn(username, password);
    return user;
  } catch (error) {
    console.log("error signing in", error);
    return error;
  }
}

async function signOut() {
  try {
    const signOutRes = await Auth.signOut();
    return signOutRes;
  } catch (error) {
    return error;
    console.log("error signing out: ", error);
  }
}

async function confirmSignUp() {
  try {
    await Auth.confirmSignUp(username, code);
  } catch (error) {
    console.log("error confirming sign up", error);
  }
}

async function invalidateAll() {
  try {
    await Auth.signOut({ global: true });
  } catch (error) {
    console.log("error signing out: ", error);
  }
}

const handleDeleteCognitoUser = async () => {
  const user = await Auth.currentAuthenticatedUser();
  user.deleteUser((error, data) => {
    if (error) {
      throw error;
    }
    // do stuff after deletion
  });
};

export default ({ config, db }) => {
  let api = Router();

  // mount the facets resource
  api.use("/facets", facets({ config, db }));

  // perhaps expose some API metadata at the root
  api.get("/", (req, res) => {
    res.json({ version });
  });

  api.post("/authenticate", async (req, res) => {
    const signInRes = await signIn(req.query.username, req.query.password);
    return res.send(signInRes);
  });

  api.post("/createUser", async (req, res) => {
    console.log("PPP", req.query);
    const signUpRes = await signUp(
      req.query.username,
      req.query.password,
      req.query.email
    );

    return res.send(signUpRes);
  });

  api.post("/editUser", (req, res) => {
    return res.send("Received a POST HTTP method");
  });

  api.post("/deleteUser", (req, res) => {
    return res.send("Received a POST HTTP method");
  });

  api.post("/refresh", (req, res) => {
    return res.send("Received a POST HTTP method");
  });

  api.post("/invalidate", async (req, res) => {
    const signUpRes = await signOut();
    return res.send(signOutRes);
  });

  api.post("/confirmSignUP", async (req, res) => {
    const signUpConfirm = await confirmSignUp();
    return res.send(signUpConfirm);
  });

  api.post("/invalidateAll", async (req, res) => {
    const invalidateAllRes = await invalidateAll();
    return res.send(invalidateAllRes);
  });

  //upload mod

  //delete mod

  //edit mod

  //create packs

  return api;
};
