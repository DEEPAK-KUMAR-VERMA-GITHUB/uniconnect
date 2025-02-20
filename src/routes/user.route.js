// Fastify schema for student registration
const studentSchema = {
  body: {
    type: "object",
    required: [
      "name",
      "email",
      "password",
      "mobileNumber",
      "rollNumber",
      "course",
      "session",
      "semester",
    ],
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      mobileNumber: { type: "number" },
      rollNumber: { type: "string" },
      course: { type: "string" },
      session: { type: "string" },
      semester: { type: "number", minimum: 1 },
    },
  },
};

// faculty schema
const facultySchema = {
  body: {
    type: "object",
    required: [
      "name",
      "email",
      "password",
      "mobileNumber",
      "facultyId",
      "department",
      "designation",
      "course",
    ],
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      mobileNumber: { type: "number" },
      facultyId: { type: "string" },
      department: { type: "string" },
      designation: { type: "string" },
      course: { type: "string" },
    },
  },
};

// Login schema
const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};

// Export route handlers
export const userRoutes = async (fastify) => {
  fastify.post("/register-student", { schema: studentSchema }, registerStudent);
  fastify.post("/register-faculty", { schema: facultySchema }, registerFaculty);
  fastify.post("/login", { schema: loginSchema }, loginUser);
};
