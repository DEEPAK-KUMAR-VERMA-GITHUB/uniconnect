// imports
import Fastify from "fastify";
import "dotenv/config";
import { connectDB } from "./src/utils/databaseConnect.js";
import { errorMiddleware } from "./src/middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "./src/middlewares/catchAsyncErrors.js";
import multipart from "@fastify/multipart";
import { noteRoutes } from "./src/routes/note.route.js";

// function to start app
const startServer = catchAsyncErrors(async () => {
  await connectDB();
  const app = Fastify({
    logger: true,
  });

  // Register multipart plugin
  app.register(multipart, {
    limits: {
      fileSize: 5000000, // 5MB limit
      files: 1, // Max 1 file per request
    },
  });

  // Register the note routes
  app.register(noteRoutes, { prefix: "/api/notes" });

  // Register error middleware
  app.setErrorHandler(errorMiddleware);
  try {
    app.listen({
      port: process.env.PORT || 3000,
      host: process.env.HOST || "0.0.0.0",
    });
    console.log(`Uniconnect-Server listening on ${app.server.address().port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

startServer();
