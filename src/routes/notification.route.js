export const notificationRoutes = async (fastify) => {
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
      getNotifications
    );
  
    fastify.put(
      "/:id/read",
      {
        preHandler: [fastify.authenticate]
      },
      markNotificationRead
    );
  
    fastify.put(
      "/read-all",
      {
        preHandler: [fastify.authenticate]
      },
      markAllNotificationsRead
    );
  
    fastify.delete(
      "/:id",
      {
        preHandler: [fastify.authenticate]
      },
      deleteNotification
    );
  };