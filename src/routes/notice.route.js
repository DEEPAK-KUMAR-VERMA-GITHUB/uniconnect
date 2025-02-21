const createNoticeSchema = {
    body: {
      type: 'object',
      required: ['title', 'content', 'targetAudience', 'priority', 'expiresAt'],
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        targetAudience: { 
          type: 'string', // JSON string of array
          description: 'Array of {course, semester} objects'
        },
        priority: { 
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        },
        expiresAt: { 
          type: 'string',
          format: 'date-time'
        }
      }
    }
  };
  
  export const noticeRoutes = async (fastify) => {
    // Middleware to verify faculty/admin
    const verifyAuthorized = async (request, reply) => {
      if (!['faculty', 'admin'].includes(request.user.role)) {
        reply.code(403).send({
          success: false,
          message: "Not authorized to manage notices"
        });
      }
    };
  
    fastify.post(
      "/create",
      {
        preHandler: [
          fastify.authenticate,
          verifyAuthorized,
          upload.single('attachment')
        ],
        schema: createNoticeSchema
      },
      createNotice
    );
  
    fastify.get(
      "/",
      {
        preHandler: [fastify.authenticate],
        schema: {
          querystring: {
            type: 'object',
            properties: {
              page: { type: 'number', minimum: 1 },
              limit: { type: 'number', minimum: 1, maximum: 50 }
            }
          }
        }
      },
      getNotices
    );
  
    fastify.delete(
      "/:id",
      {
        preHandler: [fastify.authenticate, verifyAuthorized]
      },
      deleteNotice
    );
  };