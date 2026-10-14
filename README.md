# Programming Assignment 2 & 3 — Projects and Memberships

## Run on Windows / VS Code

1. Install Node.js and configure MongoDB Atlas (or run local MongoDB).
2. Open the root project folder in VS Code.
3. Run `npm install` and `npm run install:all` from the root directory.
4. Create `server/.env`. Add `MONGO_URI` with your connection string; never commit it. `PORT` = 9000
5. Open two terminals, go into server and client directory in respective terminals
6. Run `npm run dev` in the client terminai
7. Run `node server.js` in the server terminal
8. Visit **http://localhost:5173**. Express is at **http://localhost:9000**.


## Database

Uses the same **pa2** database and existing **users** collection as PA2 (MongoDB collection names are case-sensitive). Also creates **Projects** and **ProjectMemberships** collections.