## File System Web App

To run this app you will need either bun or npm installed on your machine. In addition to that, if you don't have docker-compose, you might need other prerequisites on your machine to run this app.

#### setup

To install dependencies run `bun i` or `npm i`

To create the database run `bun run migrate` or `npm run migrate`

#### dev

To start the dev server, if you have docker you can run:
`bun run docker:dev` or `npm run docker:dev`.

If you don't have docker you can just run `bun run dev`.

#### prod

To start the prod server with docker run `bun run docker:prod` or `npm run docker:prod`.

Without docker just run `bun run prod` or `npm run prod`.

This will compile the source code into build files inside `/build` folder, copy the existing data files there and run the server. You will need to have created the database already from the setup.

#### tests

Every public method of `FSProvider` has unit tests.

To run them with docker run `bnn run docker:test` or `npm run docker:test`.

Without docker run `bun run test` or `npm run test`

#### database

sqlite is used for the database located at `/data/sqlite.db`

#### files

data files are stored inside `/data/files` folder or alternatively in an s3 bucket

#### env

If you wish to use s3 bucket instead of local files add `.env` file and use these fields:
``
FS_SERVICE: "local" | "s3";
// S3 credentials
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_REGION
S3_ENDPOINT
S3_BUCKET
S3_SESSION_TOKEN
``

These should support all types of s3 credentials.
