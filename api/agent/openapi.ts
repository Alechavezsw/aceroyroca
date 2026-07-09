export default function handler(req: any, res: any) {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // OpenAPI Specification (Swagger)
  const openapiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Acero & Roca Agent API",
      version: "1.0.0",
      description: "API para que el agente IA gestione notas, tareas y eventos en Acero & Roca."
    },
    servers: [
      {
        url: `https://${req.headers.host}`,
        description: "Current environment"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer"
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ],
    paths: {
      "/api/agent/notes": {
        get: {
          summary: "List all notes",
          operationId: "getNotes",
          responses: {
            "200": {
              description: "A list of notes"
            }
          }
        },
        post: {
          summary: "Create a note",
          operationId: "createNote",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    status: { type: "string", enum: ["draft", "review", "published"] }
                  },
                  required: ["title"]
                }
              }
            }
          },
          responses: {
            "201": { description: "Created note" }
          }
        },
        put: {
          summary: "Update a note",
          operationId: "updateNote",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    content: { type: "string" },
                    status: { type: "string", enum: ["draft", "review", "published"] }
                  },
                  required: ["id"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Updated note" }
          }
        }
      },
      "/api/agent/tasks": {
        get: {
          summary: "List all tasks",
          operationId: "getTasks",
          responses: {
            "200": { description: "A list of tasks" }
          }
        },
        post: {
          summary: "Create a task",
          operationId: "createTask",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string", enum: ["ideas", "research", "drafting", "review", "published"] },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    due_date: { type: "string", format: "date" },
                    note_id: { type: "string" }
                  },
                  required: ["title"]
                }
              }
            }
          },
          responses: {
            "201": { description: "Created task" }
          }
        },
        put: {
          summary: "Update a task",
          operationId: "updateTask",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string" },
                    priority: { type: "string" },
                    due_date: { type: "string", format: "date" },
                    note_id: { type: "string" }
                  },
                  required: ["id"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Updated task" }
          }
        }
      },
      "/api/agent/events": {
        get: {
          summary: "List all events",
          operationId: "getEvents",
          responses: {
            "200": { description: "A list of events" }
          }
        },
        post: {
          summary: "Create an event",
          operationId: "createEvent",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    start_date: { type: "string", format: "date-time" },
                    end_date: { type: "string", format: "date-time" },
                    type: { type: "string" }
                  },
                  required: ["title", "start_date", "end_date"]
                }
              }
            }
          },
          responses: {
            "201": { description: "Created event" }
          }
        },
        put: {
          summary: "Update an event",
          operationId: "updateEvent",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    start_date: { type: "string", format: "date-time" },
                    end_date: { type: "string", format: "date-time" },
                    type: { type: "string" }
                  },
                  required: ["id"]
                }
              }
            }
          },
          responses: {
            "200": { description: "Updated event" }
          }
        }
      }
    }
  };

  res.status(200).json(openapiSpec);
}
