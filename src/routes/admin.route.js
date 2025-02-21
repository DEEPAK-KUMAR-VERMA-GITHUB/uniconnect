const adminLoginSchema = {
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" }
      }
    }
  };
  
  const updateUserStatusSchema = {
    body: {
      type: "object",
      required: ["userId", "userType", "isActive"],
      properties: {
        userId: { type: "string" },
        userType: { type: "string", enum: ["student", "faculty"] },
        isActive: { type: "boolean" }
      }
    }
  };
  
  export const adminRoutes = async (fastify) => {
    // Middleware to verify admin role
    const verifyAdmin = async (request, reply) => {
      if (request.user.role !== "admin") {
        reply.code(403).send({
          success: false,
          message: "Admin access required"
        });
      }
    };
  
    fastify.post(
      "/login",
      { schema: adminLoginSchema },
      adminLogin
    );
  
    fastify.put(
      "/user-status",
      {
        preHandler: [fastify.authenticate, verifyAdmin],
        schema: updateUserStatusSchema
      },
      updateUserStatus
    );
  
    fastify.get(
      "/pending-verifications",
      {
        preHandler: [fastify.authenticate, verifyAdmin]
      },
      getPendingVerifications
    );
  
    fastify.get(
      "/user/:userType/:userId",
      {
        preHandler: [fastify.authenticate, verifyAdmin]
      },
      getUserDetails
    );
  };