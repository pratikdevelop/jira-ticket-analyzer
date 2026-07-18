import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import { initSocket } from "./socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Wrap the Express app in a raw HTTP server so Socket.IO can share the
// same port for real-time (WebSocket) connections.
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready on the same port`);
});
