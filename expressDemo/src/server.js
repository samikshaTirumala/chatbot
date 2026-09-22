import app from "./app.js";

const port = 3000;

const server = app.listen(port, () => {
  console.log(`BSNKing Chat API listening on http://localhost:${port}`);
  console.log("Server listening:", server.listening);
});

server.on("close", () => {
  console.log("SERVER CLOSED");
});

server.on("error", (error) => {
  console.error("SERVER ERROR:", error);
});

setInterval(() => {
  console.log("Server is still running...");
}, 5000);