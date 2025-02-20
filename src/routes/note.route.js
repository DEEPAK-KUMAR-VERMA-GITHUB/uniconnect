import { upload } from '../utils/gridfsStorage.js';
import { uploadSubjectNotes, getNoteFile } from "../controllers/note.controller.js";
import { UserRoles } from "../models/user.model.js";

const uploadNotesSchema = {
  body: {
    type: "object",
    required: ["title", "description", "subjectId", "type"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      subjectId: { type: "string" },
      type: { type: "string" },
    },
  },
};

export const noteRoutes = async (fastify) => {
  // Middleware to verify faculty role
  const verifyFaculty = async (request, reply) => {
    if (request.user.role !== UserRoles.FACULTY) {
      reply.code(403).send({
        success: false,
        message: "Only faculty members can upload notes",
      });
    }
  };

  // Route to upload notes
  fastify.post(
    "/upload",
    {
      preHandler: [
        fastify.authenticate,
        verifyFaculty,
        upload.single("pdf") // 'pdf' is the field name in form-data
      ],
      schema: uploadNotesSchema
    },
    uploadSubjectNotes
  );

  // Route to get/download notes
  fastify.get(
    "/download/:id",
    {
      preHandler: [fastify.authenticate]
    },
    getNoteFile
  );
}; 