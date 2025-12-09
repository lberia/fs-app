import {
  createDirectory,
  deleteDirectory,
  listDirectory,
  moveDirectory,
  copyDirectory,
} from "../controllers/directory.controller";
import {
  deleteFile,
  uploadFile,
  moveFile,
  copyFile,
  viewFile,
} from "../controllers/file.controller";
import {
  identifyUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller";

type APIRoutes =
  | "/api/*"
  | "/api/auth/register"
  | "/api/auth/login"
  | "/api/auth/logout"
  | "/api/auth/identify"
  | "/api/directory"
  | "/api/directory/list"
  | "/api/directory/copy"
  | "/api/directory/move"
  | "/api/file"
  | "/api/file/copy"
  | "/api/file/move"
  | "/api/file/:id";

export const apiRoutes: Bun.Serve.Routes<unknown, APIRoutes> = {
  "/api/*": Response.json({ version: "1.0.0", env: process.env.NODE_ENV }),
  "/api/auth/register": { POST: registerUser },
  "/api/auth/login": { POST: loginUser },
  "/api/auth/logout": { POST: logoutUser },
  "/api/auth/identify": { POST: identifyUser },
  "/api/directory": { POST: createDirectory, DELETE: deleteDirectory },
  "/api/directory/list": { POST: listDirectory },
  "/api/directory/move": { POST: moveDirectory },
  "/api/directory/copy": { POST: copyDirectory },
  "/api/file": { POST: uploadFile, DELETE: deleteFile },
  "/api/file/move": { POST: moveFile },
  "/api/file/copy": { POST: copyFile },
  "/api/file/:id": { GET: viewFile },
};
