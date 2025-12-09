import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { FSProvider } from "./fs.provider";
import { createTestDB } from "../db";
import { users, type User } from "../models/user.model";
import { hashPassword } from "../utils/auth";
import fs from "node:fs";
import { files as FileModel } from "../models/file.model";
import { directories as DirectoryModel } from "../models/directory.model";
import { eq } from "drizzle-orm";

const mockValues: { db?: ReturnType<typeof createTestDB>; users: User[] } = {
  db: undefined,
  users: [],
};

const mockUserValues = [
  {
    name: "test user 1",
    email: "test1@example.com",
    passwordHash: await hashPassword("12345678"),
  },
  {
    name: "test user 2",
    email: "test2@example.com",
    passwordHash: await hashPassword("abcdefgh"),
  },
];

beforeEach(async () => {
  mockValues.db = createTestDB();

  mock.module("../db/index.ts", () => ({ db: mockValues.db }));
  for (const user of mockUserValues) {
    mockValues.users.push(
      ...(await mockValues.db.insert(users).values(user).returning())
    );
  }
  try {
    fs.mkdirSync("./test-files", { recursive: true });
  } catch (err) {
    console.log("mkdir error", err);
  }
});
afterEach(() => {
  mockValues.db?.$client.close();
  delete mockValues.db;
  mockValues.users = [];
  try {
    fs.rmSync("./test-files", { recursive: true });
  } catch (err) {
    console.log("rmdir error", err);
  }
});

describe("FS Provider", () => {
  describe("constructor", () => {
    describe("with valid params", () => {
      test("should be instance of FSProvider", () => {
        const fsProvider = new FSProvider(0, "/");
        expect(fsProvider).toBeInstanceOf(FSProvider);
      });
      test("should get its working directory set", () => {
        const fsProvider = new FSProvider(0, "/dir");
        expect(fsProvider.getWorkingDirectory()).toBe("/dir");
        expect(fsProvider).toMatchObject({ workingDirectory: "/dir" });
      });
      test("should get its user ID set", () => {
        const fsProvider = new FSProvider(0, "/dir");
        expect(fsProvider).toHaveProperty("userId");
        expect(fsProvider).toMatchObject({ userId: 0 });
      });
    });
    describe("with invalid user ID", () => {
      test("should throw error", () => {
        expect(() => new FSProvider(-1, "/")).toThrowError();
      });
    });
    describe("with no working directory", () => {
      test("should default to /", () => {
        const fsProvider = new FSProvider(0);
        expect(fsProvider.getWorkingDirectory()).toBe("/");
        expect(fsProvider).toMatchObject({ workingDirectory: "/" });
      });
    });
  });
  describe("setWorkingDirectory", () => {
    test("should change the working directory", () => {
      const fsProvider = new FSProvider(0, "/dir");
      fsProvider.setWorkingDirectory("/dir2");
      expect(fsProvider.getWorkingDirectory()).toBe("/dir2");
      expect(fsProvider).toMatchObject({ workingDirectory: "/dir2" });
    });
  });
  describe("getWorkingDirectory", () => {
    test("should return correct working directory before and after changing it", () => {
      const fsProvider = new FSProvider(0, "/dir");
      expect(fsProvider.getWorkingDirectory()).toBe("/dir");
      fsProvider.setWorkingDirectory("/dir2");
      expect(fsProvider.getWorkingDirectory()).toBe("/dir2");
    });
  });
  describe("createDirectory", () => {
    describe("with valid params", () => {
      test("should create a directory", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        const [dir] =
          (await mockValues.db?.select().from(DirectoryModel)) || [];
        expect(dir).toBeObject();
        expect(dir).toHaveProperty("name", "dir");
        expect(dir).toHaveProperty("ownerId", 0);
        expect(dir).toHaveProperty("parentId", null);
      });
      test("should create a nested directory", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        await fsProvider.createDirectory("/dir/dir2");
        const [dir1] =
          (await mockValues.db?.select().from(DirectoryModel)) || [];
        expect(dir1).toBeObject();
        const [dir2] =
          (await mockValues.db
            ?.select()
            .from(DirectoryModel)
            .where(eq(DirectoryModel.name, "dir2"))) || [];
        expect(dir2).toBeObject();
        expect(dir2).toHaveProperty("parentId", dir1!.id);
      });
      test("should create a dir inside working dir", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        fsProvider.setWorkingDirectory("/dir");
        await fsProvider.createDirectory("/dir2");
        const [dir1] =
          (await mockValues.db?.select().from(DirectoryModel)) || [];
        expect(dir1).toBeObject();
        const [dir2] =
          (await mockValues.db
            ?.select()
            .from(DirectoryModel)
            .where(eq(DirectoryModel.name, "dir2"))) || [];
        expect(dir2).toBeObject();
        expect(dir2).toHaveProperty("parentId", dir1!.id);
      });
      test("should create parent dir if it doesn't exist", async () => {
        const fsProvider = new FSProvider(0, "/dir");
        await fsProvider.createDirectory("/dir2");
        const [dir1] =
          (await mockValues.db?.select().from(DirectoryModel)) || [];
        expect(dir1).toBeObject();
        const [dir2] =
          (await mockValues.db
            ?.select()
            .from(DirectoryModel)
            .where(eq(DirectoryModel.name, "dir2"))) || [];
        expect(dir2).toBeObject();
        expect(dir2).toHaveProperty("parentId", dir1!.id);
      });
    });
    describe("should throw error ", () => {
      test("if dir already exists", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        expect(() => fsProvider.createDirectory("/dir")).toThrowError();
      });
    });
  });
  describe("deleteDirectory", () => {
    describe("with valid params", () => {
      test("should delete directory from db", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        await fsProvider.deleteDirectory("/dir");
        const [dir] =
          (await mockValues.db?.select().from(DirectoryModel)) || [];
        expect(dir).toBeUndefined();
      });
      test("should respect workingDirectory", async () => {
        const fsProvider = new FSProvider(0, "/dir");
        await fsProvider.createDirectory("/dir2");
        await fsProvider.deleteDirectory("/dir2");
        const [dir, dir2] =
          (await mockValues.db?.select().from(DirectoryModel)) || [];
        expect(dir2).toBeUndefined();
      });
      test("should delete recursively", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        await fsProvider.createDirectory("/dir/dir2");
        await fsProvider.createDirectory("/dir/dir2/dir3");
        await fsProvider.createDirectory("/dir/dir4");
        await fsProvider.writeFile("/dir/dir2/dir3/script.js", "var x = 5;");
        await fsProvider.deleteDirectory("/dir");
        expect(
          ((await mockValues.db?.select().from(DirectoryModel)) || []).length
        ).toBe(0);
        expect(
          ((await mockValues.db?.select().from(FileModel)) || []).length
        ).toBe(0);
        expect(fs.readdirSync("./test-files").length).toBe(0);
      });
    });
    describe("should throw error", () => {
      test("if directory doesn't exist", async () => {
        const fsProvider = new FSProvider(0, "/");
        expect(() => fsProvider.deleteDirectory("/dir")).toThrowError();
      });
      test("if working directory doesn't exist", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        fsProvider.setWorkingDirectory("/dir2");
        expect(() => fsProvider.deleteDirectory("/dir")).toThrowError();
      });
      test("if parent directory doesn't exist", async () => {
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        expect(() => fsProvider.deleteDirectory("/dir2/dir")).toThrowError();
      });
    });
  });
  describe("copyDirectory", () => {
    describe("with valid params", () => {
      test("should create new identical db entries", async () => {
        const fsProvider = new FSProvider(0);
        await fsProvider.createDirectory("/dir1/dir2/dir3");
        await fsProvider.createDirectory("/dir1/dir4");
        await fsProvider.createDirectory("/dir1/dir5/dir6/dir7");
        await fsProvider.writeFile("/dir1/dir2/script1.js", "var x = 5;");
        await fsProvider.writeFile(
          "/dir1/dir5/dir6/dir7/script2.js",
          "var y = 7;"
        );
        await fsProvider.copyDirectory("/dir1", "/dir1-copy");
        const dirs = (await mockValues.db?.select().from(DirectoryModel)) || [];
        const files = (await mockValues.db?.select().from(FileModel)) || [];
        const dir1Copy = dirs.find((v) => v.name === "dir1-copy");
        expect(dir1Copy).toBeObject();
        expect(dirs.length).toBe(14);
        expect(files.length).toBe(4);
        expect(dirs.filter((v) => v.name === "dir1").length).toBe(1);
        expect(dirs.filter((v) => v.name === "dir2").length).toBe(2);
        expect(dirs.filter((v) => v.name === "dir3").length).toBe(2);
        expect(dirs.filter((v) => v.name === "dir4").length).toBe(2);
        expect(dirs.filter((v) => v.name === "dir5").length).toBe(2);
        expect(dirs.filter((v) => v.name === "dir6").length).toBe(2);
        expect(dirs.filter((v) => v.name === "dir7").length).toBe(2);
        const dir2Copy = dirs.find(
          (v) => v.name === "dir2" && v.parentId === dir1Copy!.id
        );
        expect(dir2Copy).toBeObject();
        expect(
          dirs.find((v) => v.name === "dir3" && v.parentId === dir2Copy!.id)
        ).toBeObject();
        expect(
          files.find(
            (v) => v.name === "script1.js" && v.directoryId === dir2Copy!.id
          )
        ).toBeObject();
      });
      test("should respect working directory", async () => {
        const fsProvider = new FSProvider(0, "/working-dir");
        await fsProvider.createDirectory("/dir1/dir2/dir3");
        await fsProvider.createDirectory("/dir1/dir4");
        await fsProvider.createDirectory("/dir1/dir5/dir6/dir7");
        await fsProvider.writeFile("/dir1/dir2/script1.js", "var x = 5;");
        await fsProvider.writeFile(
          "/dir1/dir5/dir6/dir7/script2.js",
          "var y = 7;"
        );
        await fsProvider.copyDirectory("/dir1", "/dir1-copy");
        const dirs = (await mockValues.db?.select().from(DirectoryModel)) || [];
        const workingDir = dirs.find((v) => v.name === "working-dir");
        const dir1Copy = dirs.find((v) => v.name === "dir1-copy");
        expect(dir1Copy).toHaveProperty("parentId", workingDir?.id);
      });
    });
    describe("should throw error", () => {
      test("if path doesn't exist", async () => {
        const fsProvider = new FSProvider(0);
        expect(() => fsProvider.copyDirectory("/dir", "dir2")).toThrowError();
      });
      test("if new path already exist", async () => {
        const fsProvider = new FSProvider(0);
        fsProvider.createDirectory("/dir");
        fsProvider.createDirectory("/dir2");
        expect(() => fsProvider.copyDirectory("/dir", "dir2")).toThrowError();
      });
    });
  });
  describe("moveDirectory", () => {
    describe("with valid params", () => {
      test("should create new identical db entries", async () => {
        const fsProvider = new FSProvider(0);
        await fsProvider.createDirectory("/dir1/dir2/dir3");
        await fsProvider.createDirectory("/dir1/dir4");
        await fsProvider.createDirectory("/dir1/dir5/dir6/dir7");
        await fsProvider.writeFile("/dir1/dir2/script1.js", "var x = 5;");
        await fsProvider.writeFile(
          "/dir1/dir5/dir6/dir7/script2.js",
          "var y = 7;"
        );
        await fsProvider.moveDirectory("/dir1", "/dir1-renamed");
        const [dir1] =
          (await mockValues.db
            ?.select()
            .from(DirectoryModel)
            .where(eq(DirectoryModel.name, "dir1-renamed"))) || [];
        expect(dir1).toBeObject();
      });
      test("should respect working directory", async () => {
        const fsProvider = new FSProvider(0, "/working-dir");
        await fsProvider.createDirectory("/dir1/dir2/dir3");
        await fsProvider.createDirectory("/dir1/dir4");
        await fsProvider.createDirectory("/dir1/dir5/dir6/dir7");
        await fsProvider.writeFile("/dir1/dir2/script1.js", "var x = 5;");
        await fsProvider.writeFile(
          "/dir1/dir5/dir6/dir7/script2.js",
          "var y = 7;"
        );
        await fsProvider.moveDirectory("/dir1", "/dir1-renamed");
        const dirs = (await mockValues.db?.select().from(DirectoryModel)) || [];
        const workingDir = dirs.find((v) => v.name === "working-dir");
        const dir1 = dirs.find((v) => v.name === "dir1-renamed");
        expect(dir1).toHaveProperty("parentId", workingDir?.id);
      });
    });
    describe("should throw error", () => {
      test("if path doesn't exist", async () => {
        const fsProvider = new FSProvider(0);
        expect(() => fsProvider.moveDirectory("/dir", "dir2")).toThrowError();
      });
      test("if new path already exist", async () => {
        const fsProvider = new FSProvider(0);
        fsProvider.createDirectory("/dir");
        fsProvider.createDirectory("/dir2");
        expect(() => fsProvider.moveDirectory("/dir", "dir2")).toThrowError();
      });
    });
  });
  describe("listDirectory", () => {
    describe("with no params", () => {
      test("should return root directory", async () => {
        const fsProvider = new FSProvider(0);
        expect((await fsProvider.listDirectory()).length).toBe(0);
        await fsProvider.createDirectory("/dir1/dir2");
        await fsProvider.createDirectory("/dir3");
        await fsProvider.writeFile("/script.js", "var x = 5");
        await fsProvider.writeFile("/dir3/script2.js", "var y = 7");
        const list = await fsProvider.listDirectory();
        expect(list.length).toBe(3);
        expect(list.find((v) => v.name === "dir1")).toBeObject();
        expect(list.find((v) => v.name === "dir3")).toBeObject();
        expect(list.find((v) => v.name === "script.js")).toBeObject();
      });
      test("should respect working directory", async () => {
        const fsProvider = new FSProvider(0);
        await fsProvider.createDirectory("/root");
        fsProvider.setWorkingDirectory("/root");
        expect((await fsProvider.listDirectory()).length).toBe(0);
        await fsProvider.createDirectory("/dir1/dir2");
        await fsProvider.createDirectory("/dir3");
        await fsProvider.writeFile("/script.js", "var x = 5");
        await fsProvider.writeFile("/dir3/script2.js", "var y = 7");
        const list = await fsProvider.listDirectory();
        expect(list.length).toBe(3);
        expect(list.find((v) => v.name === "dir1")).toBeObject();
        expect(list.find((v) => v.name === "dir3")).toBeObject();
        expect(list.find((v) => v.name === "script.js")).toBeObject();
      });
    });
    describe("with valid params", () => {
      test("should return root directory", async () => {
        const fsProvider = new FSProvider(0);
        await fsProvider.createDirectory("/dir1/dir2/dir3");
        await fsProvider.createDirectory("/dir1/dir2/dir4");
        await fsProvider.createDirectory("/dir1/dir5");
        await fsProvider.writeFile("/dir1/script.js", "var x = 5");
        await fsProvider.writeFile("/dir1/dir2/script2.js", "var y = 7");
        const list = await fsProvider.listDirectory("/dir1/dir2");
        expect(list.length).toBe(3);
        expect(list.find((v) => v.name === "dir3")).toBeObject();
        expect(list.find((v) => v.name === "dir4")).toBeObject();
        expect(list.find((v) => v.name === "script2.js")).toBeObject();
      });
      test("should respect working directory", async () => {
        const fsProvider = new FSProvider(0, "/root");
        await fsProvider.createDirectory("/dir1/dir2/dir3");
        await fsProvider.createDirectory("/dir1/dir2/dir4");
        await fsProvider.createDirectory("/dir1/dir5");
        await fsProvider.writeFile("/dir1/script.js", "var x = 5");
        await fsProvider.writeFile("/dir1/dir2/script2.js", "var y = 7");
        const list = await fsProvider.listDirectory("/dir1/dir2");
        expect(list.length).toBe(3);
        expect(list.find((v) => v.name === "dir3")).toBeObject();
        expect(list.find((v) => v.name === "dir4")).toBeObject();
        expect(list.find((v) => v.name === "script2.js")).toBeObject();
      });
    });
  });
  describe("getFileById", () => {
    test("with valid id should return file object", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", "var x = 5;");
      const file = await fsProvider.getFileById(1);
      expect(file).toHaveProperty("name", "script.js");
    });
    test("with invalid id should return null", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", "var x = 5;");
      expect(await fsProvider.getFileById(2)).toBeNull();
    });
  });
  describe("writeFile", () => {
    describe("with valid params", () => {
      test("should save content", async () => {
        const content = "var x = 5;";
        const name = "/script.js";
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.writeFile(name, content);
        const blob = await fsProvider.readFile(name);
        expect(blob).toBeInstanceOf(Blob);
        expect(await blob.text()).toBe(content);
      });
      test("should use correct working directory", async () => {
        const content = "var x = 5;";
        const fsProvider = new FSProvider(0, "/");
        await fsProvider.createDirectory("/dir");
        fsProvider.setWorkingDirectory("/dir");
        await fsProvider.writeFile("/script.js", content);
        fsProvider.setWorkingDirectory("/");
        const blob = await fsProvider.readFile("/dir/script.js");
        expect(blob).toBeInstanceOf(Blob);
        expect(await blob.text()).toBe(content);
      });
    });
    describe("should throw an error ", () => {
      test("if name is missing", async () => {
        const fsProvider = new FSProvider(0, "/");
        expect(() => fsProvider.writeFile("/", "content")).toThrowError();
      });
      test("if directory doesn't exist", async () => {
        const fsProvider = new FSProvider(0, "/");
        expect(() =>
          fsProvider.writeFile("/dir/script.js", "content")
        ).toThrowError();
      });
      test("if working directory doesn't exist", async () => {
        const fsProvider = new FSProvider(0, "/dir");
        expect(() =>
          fsProvider.writeFile("/script.js", "content")
        ).toThrowError();
      });
    });
  });
  describe("readFile", () => {
    test("should return file blob if exists", async () => {
      const fsProvider = new FSProvider(0);
      const path = "/dir/script.js";
      const content = "var x = 5;";
      await fsProvider.createDirectory("/dir");
      await fsProvider.writeFile(path, content);
      const blob = await fsProvider.readFile(path);
      expect(blob).toBeInstanceOf(Blob);
      const blobText = await blob.text();
      expect(blobText).toBe(content);
    });
    test("should throw error if file doesn't exist", () => {
      const fsProvider = new FSProvider(0);
      expect(() => fsProvider.readFile("/script.js")).toThrowError();
    });
    test("should respect working directory", async () => {
      const fsProvider = new FSProvider(0);
      const path = "/script.js";
      const content = "var x = 5;";
      await fsProvider.createDirectory("/dir");
      fsProvider.setWorkingDirectory("/dir");
      await fsProvider.writeFile(path, content);
      const blob = await fsProvider.readFile(path);
      expect(blob).toBeInstanceOf(Blob);
      const blobText = await blob.text();
      expect(blobText).toBe(content);
    });
  });
  describe("deleteFile", () => {
    test("should delete entry from db", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", "var x = 5;");
      await fsProvider.deleteFile("/script.js");
      const files = await mockValues.db?.select().from(FileModel);
      expect(files?.length).toBe(0);
    });
    test("should respect working directory", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.createDirectory("/dir");
      await fsProvider.writeFile("/script.js", "var x = 5;");
      await fsProvider.deleteFile("/script.js");
      const files = await mockValues.db?.select().from(FileModel);
      expect(files?.length).toBe(0);
    });
    test("should throw error if file doesn't exist", async () => {
      const fsProvider = new FSProvider(0);
      expect(() => fsProvider.deleteFile("/script.js")).toThrowError();
    });
  });
  describe("copyFile", () => {
    const content = "var x = 5;";
    test("should create new identical db entry", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", content);
      await fsProvider.copyFile("/script.js", "/script2.js");
      const files = (await mockValues.db?.select().from(FileModel)) || [];
      expect(files.length).toBe(2);
      expect(files[0]!.uri).toBe(files[1]!.uri);
    });
    test("should respect working directory", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.createDirectory("/dir");
      fsProvider.setWorkingDirectory("/dir");
      await fsProvider.writeFile("/script.js", "var x = 5;");
      await fsProvider.copyFile("/script.js", "/script2.js");
      const files = (await mockValues.db?.select().from(FileModel)) || [];
      expect(files.length).toBe(2);
      expect(files[0]!.uri).toBe(files[1]!.uri);
    });
    test("should not write additional files, but reuse existing ones", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", "var x = 5;");
      await fsProvider.copyFile("/script.js", "/script2.js");
      expect(fs.readdirSync("./test-files").length).toBe(1);
    });
    describe("should throw error", () => {
      test("if path doesn't exists", () => {
        const fsProvider = new FSProvider(0);
        expect(() =>
          fsProvider.copyFile("/script.js", "/script2.js")
        ).toThrowError();
      });
      test("if new path already exist", async () => {
        const fsProvider = new FSProvider(0);
        await fsProvider.writeFile("/script.js", content);
        await fsProvider.writeFile("/script2.js", content);
        expect(() =>
          fsProvider.copyFile("/script.js", "/script2.js")
        ).toThrowError();
      });
    });
  });
  describe("moveFile", () => {
    const content = "var x = 5;";
    test("should just rename db entry", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", content);
      await fsProvider.moveFile("/script.js", "/script2.js");
      const files = (await mockValues.db?.select().from(FileModel)) || [];
      expect(files.length).toBe(1);
      expect(files[0]!.name).toBe("script2.js");
    });
    test("should respect working directory", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.createDirectory("/dir");
      fsProvider.setWorkingDirectory("/dir");
      await fsProvider.writeFile("/script.js", "var x = 5;");
      await fsProvider.moveFile("/script.js", "/script2.js");
      const files = (await mockValues.db?.select().from(FileModel)) || [];
      const [dir] = (await mockValues.db?.select().from(DirectoryModel)) || [];
      expect(files[0]!.directoryId).toBe(dir!.id);
    });
    test("should not write additional files, but reuse existing ones", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile("/script.js", "var x = 5;");
      await fsProvider.moveFile("/script.js", "/script2.js");
      expect(fs.readdirSync("./test-files").length).toBe(1);
    });
    describe("should throw error", () => {
      test("if path doesn't exists", () => {
        const fsProvider = new FSProvider(0);
        expect(() =>
          fsProvider.moveFile("/script.js", "/script2.js")
        ).toThrowError();
      });
      test("if new path already exist", async () => {
        const fsProvider = new FSProvider(0);
        await fsProvider.writeFile("/script.js", content);
        await fsProvider.writeFile("/script2.js", content);
        expect(() =>
          fsProvider.moveFile("/script.js", "/script2.js")
        ).toThrowError();
      });
    });
  });
  describe("getInfo", () => {
    test("should return info", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.writeFile(
        "/script.js",
        "var x = 5;",
        10,
        "text/javascript"
      );
      const info = await fsProvider.getInfo("/script.js");
      expect(info.id).toBe(1);
      expect(info.type).toBe("file");
      expect(info.name).toBe("script.js");
      expect(info.path).toBe("/");
      expect(info.size).toBe(10);
      expect(info.mimeType).toBe("text/javascript");
    });
    test("should respect working directory", async () => {
      const fsProvider = new FSProvider(0);
      await fsProvider.createDirectory("/dir/dir2");
      fsProvider.setWorkingDirectory("/dir/dir2");
      await fsProvider.writeFile(
        "/script.js",
        "var x = 5;",
        10,
        "text/javascript"
      );
      const info = await fsProvider.getInfo("/script.js");
      expect(info.id).toBe(1);
      expect(info.type).toBe("file");
      expect(info.name).toBe("script.js");
      expect(info.path).toBe("/dir/dir2/");
      expect(info.size).toBe(10);
      expect(info.mimeType).toBe("text/javascript");
    });
  });
});
