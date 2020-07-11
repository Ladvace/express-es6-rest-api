import { version } from "../../package.json";
import { Router } from "express";
import facets from "./facets";
import fetch from "node-fetch";
import { promises as fs } from "fs";
// require("dotenv").config();
import { config } from "dotenv";
import { v4 as uuid } from "uuid";
global["fetch"] = fetch;
import Amplify, { Auth } from "aws-amplify";
import AWS from "aws-sdk";

Amplify.configure({
  Auth: {
    // REQUIRED only for Federated Authentication - Amazon Cognito Identity Pool ID
    // identityPoolId: "XX-XXXX-X:XXXXXXXX-XXXX-1234-abcd-1234567890ab",

    // REQUIRED - Amazon Cognito Region
    region: "eu-west-1",

    // OPTIONAL - Amazon Cognito Federated Identity Pool Region
    // Required only if it's different from Amazon Cognito Region
    //   identityPoolRegion: "XX-XXXX-X",

    // OPTIONAL - Amazon Cognito User Pool ID
    userPoolId: "eu-west-1_FiFlkqeHB",

    // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
    userPoolWebClientId: "5g8rbpi7ftk4md1fgvkkbhdupc",
  },
});

let bucketName = "gdmeta-mods";
var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: bucketName },
});

AWS.config.update({
  accessKeyId: x,
  secretAccessKey: x,
  region: "eu-west-1",
});

const signUp = async (username, password, email) => {
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
};

const signIn = async (username, password) => {
  console.log("paolo", username, password);
  try {
    const user = await Auth.signIn(username, password);
    return user;
  } catch (error) {
    console.log("error signing in", error);
    return error;
  }
};

const signOut = async () => {
  try {
    const signOutRes = await Auth.signOut();
    return signOutRes;
  } catch (error) {
    console.log("error signing out: ", error);
    return error;
  }
};

const confirmSignUp = async (username) => {
  try {
    await Auth.confirmSignUp(username, code);
  } catch (error) {
    console.log("error confirming sign up", error);
  }
};

const invalidateAll = async () => {
  try {
    await Auth.signOut({ global: true });
  } catch (error) {
    console.log("error signing out: ", error);
  }
};

// const DeleteUser = async (user) => {
//   const params = { Username: user, UserPoolId: "eu-west-1_FiFlkqeHB" };
//   const result = await new Promise((resolve, reject) => {
//     cognito.adminDeleteUser(params, (err, data) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(data);
//     });
//   });
//   return result;
// };

const DeleteUser = async () => {
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
    const signInRes = await signIn(req.body.username, req.body.password);
    return res.send(signInRes);
  });

  api.post("/createUser", async (req, res) => {
    console.log("PPP", req.body);
    const signUpRes = await signUp(
      req.body.username,
      req.body.password,
      req.body.email
    );

    return res.send(signUpRes);
  });

  api.post("/editUser", (req, res) => {
    return res.send("Received a POST HTTP method");
  });

  api.post("/deleteUser", async (req, res) => {
    const deleteUserRes = await DeleteUser(req.body.username);
    return res.send(deleteUserRes);
  });

  // api.post("/refresh", (req, res) => {
  //   return res.send("Received a POST HTTP method");
  // });

  api.post("/invalidate", async (req, res) => {
    const signOutResp = await signOut();
    return res.send(signOutResp);
  });

  api.post("/confirmSignUP", async (req, res) => {
    const signUpConfirm = await confirmSignUp(req.body.username);
    return res.send(signUpConfirm);
  });

  api.post("/invalidateAll", async (req, res) => {
    const invalidateAllRes = await invalidateAll();
    return res.send(invalidateAllRes);
  });

  //upload mod
  api.post("/uploadMod", async (req, res) => {
    //{name: gdmod1, hash:234343434, file: buffer223239r033}
    // const readStream = await fs.readFile("C:\\Users\\caval\\Desktop\\mod.jar");
    console.log(
      "Mod",
      req.files,
      req.files["file\n"].data,
      req.files.data,
      req.files.name,
      req.body
      // readStream,
      // Buffer.byteLength(readStream)
    );

    // if (!req.files) {
    //   res.send({
    //     status: false,
    //     message: "No file uploaded",
    //   });
    // } else {
    //   // req.files.forEach((x) => res.send({ data: x }));
    //   res.send({
    //     status: true,
    //     message: "photo",
    //   });
    // }

    const uniqueId = uuid();

    let ddb = new AWS.DynamoDB({
      apiVersion: "2012-08-10",
      region: "eu-west-1",
      accessKeyId: AWS.config.credentials.accessKeyId,
      secretAccessKey: AWS.config.credentials.secretAccessKey,
    });

    let params = {
      TableName: "GdMeta-db",
      Item: {
        uuid: { S: uniqueId },
        name: { S: req.files["file\n"].name },
      },
    };

    // body-parser

    ddb.putItem(params, function (err, data) {
      if (err) {
        console.log("Error", err);
        res.send(err);
      } else {
        console.log("Success", data);
        res.send(data);
      }
    });

    var upload = new AWS.S3.ManagedUpload({
      params: {
        Bucket: bucketName,
        Key: req.files["file\n"].name,
        // Key: req.body.name,
        Body: req.files["file\n"].data,
        // ACL: "public-read",
      },
    });

    var promise = upload.promise();

    promise.then(
      function (data) {
        console.log("Successfully uploaded photo.", data);
        // viewAlbum(albumName);
        return data;
      },
      function (err) {
        console.log("There was an error uploading your photo: ", err.message);
        return err.message;
      }
    );
  });

  //get a mod
  api.post("/getMod", async (req, res) => {
    console.log("req.body.mod", req.body.mod);
    let ddb = new AWS.DynamoDB({
      apiVersion: "2012-08-10",
      region: "eu-west-1",
      accessKeyId: AWS.config.credentials.accessKeyId,
      secretAccessKey: AWS.config.credentials.secretAccessKey,
    });

    let params = {
      TableName: "GdMeta-db",
      Key: {
        uuid: { N: "123" },
        name: { S: req.body.mod },
      },
    };

    ddb.getItem(params, function (err, data) {
      if (err) {
        console.log("Error", err);
        res.send(err);
      } else {
        console.log("Success", data);
        res.send(data);
      }
    });
  });

  //delete mod
  api.post("/deleteMod", async (req, res) => {
    let ddb = new AWS.DynamoDB({
      apiVersion: "2012-08-10",
      region: "eu-west-1",
      accessKeyId: AWS.config.credentials.accessKeyId,
      secretAccessKey: AWS.config.credentials.secretAccessKey,
    });

    let params = {
      TableName: "GdMeta-db",
      Key: {
        uuid: { N: "123" },
        name: { S: req.body.mod },
      },
    };

    ddb.deleteItem(params, function (err, data) {
      if (err) {
        console.log("Error", err);
        res.send(err);
      } else {
        console.log("Success", data);
        res.send(data);
      }
    });
  });

  //edit mod
  // api.post("/EditMod", async (req, res) => {
  //   let ddb = new AWS.DynamoDB({
  //     apiVersion: "2012-08-10",
  //     region: "eu-west-1",
  //     accessKeyId: AWS.config.credentials.accessKeyId,
  //     secretAccessKey: AWS.config.credentials.secretAccessKey,
  //   });

  //   let params = {
  //     TableName: "GdMeta-db",
  //     Key: {
  //       uuid: { N: "123" },
  //       name: { S: JSON.parse(req.body.mod) },
  //     },
  //   };

  //   const addMod = ddb.deleteItem(params, function (err, data) {
  //     if (err) {
  //       console.log("Error", err);
  //     } else {
  //       console.log("Success", data);
  //     }
  //   });
  //   return res.send(addMod);
  // });

  //create packs

  return api;
};
