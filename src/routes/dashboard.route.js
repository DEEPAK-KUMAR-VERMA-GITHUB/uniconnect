export const dashboardRoutes = async (fastify) => {
    fastify.get(
      "/faculty",
      {
        preHandler: [
          fastify.authenticate,
          async (request, reply) => {
            if (request.user.role !== 'faculty') {
              reply.code(403).send({
                success: false,
                message: "Access denied"
              });
            }
          }
        ]
      },
      getFacultyDashboard
    );
  
    fastify.get(
      "/student",
      {
        preHandler: [
          fastify.authenticate,
          async (request, reply) => {
            if (request.user.role !== 'student') {
              reply.code(403).send({
                success: false,
                message: "Access denied"
              });
            }
          }
        ]
      },
      getStudentDashboard
    );
  };