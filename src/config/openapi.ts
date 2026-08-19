/**
 * Especificacion OpenAPI 3.0 escrita a mano (sin swagger-jsdoc) para
 * mantenerla explicita y facil de revisar en un solo archivo.
 * Servida en /api/docs via swagger-ui-express.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "DataForge API",
    description:
      "Plataforma de procesamiento de datos: importacion CSV/Excel, deduplicacion y exportacion mediante jobs asincronos.",
    version: "1.0.0",
  },
  servers: [{ url: `/api/v1`, description: "API base path" }],
  tags: [
    { name: "Auth", description: "Registro e inicio de sesion" },
    { name: "Users", description: "Perfil del usuario autenticado" },
    { name: "Files", description: "Subida, listado y descarga de archivos" },
    { name: "Jobs", description: "Jobs de importacion, exportacion y deduplicacion" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token JWT obtenido en /auth/login o /auth/register. Tambien puede pasarse como query param `?token=` (usado por /jobs/:id/events, que es un EventSource y no puede fijar headers).",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "object", nullable: true, description: "Detalle por campo (Zod)" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResult: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      FileRecord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          filename: { type: "string" },
          path: { type: "string", description: "Ruta local o key de S3, segun STORAGE_DRIVER" },
          size: { type: "integer" },
          mimeType: { type: "string" },
          type: { type: "string", enum: ["IMPORT", "EXPORT"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Job: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["IMPORT", "EXPORT", "DEDUP"] },
          status: { type: "string", enum: ["PENDING", "RUNNING", "DONE", "FAILED"] },
          inputFileId: { type: "string", format: "uuid", nullable: true },
          outputFileId: { type: "string", format: "uuid", nullable: true },
          totalRows: { type: "integer" },
          processedRows: { type: "integer" },
          failedRows: { type: "integer" },
          errorLog: { type: "object", nullable: true },
          filters: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          startedAt: { type: "string", format: "date-time", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          inputFile: { $ref: "#/components/schemas/FileRecord" },
          outputFile: { $ref: "#/components/schemas/FileRecord" },
        },
      },
      JobRecord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          jobId: { type: "string", format: "uuid" },
          rowIndex: { type: "integer" },
          data: { type: "object" },
          isValid: { type: "boolean" },
          errorMessage: { type: "string", nullable: true },
          isDuplicate: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    parameters: {
      JobId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      Page: {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1 },
      },
      Limit: {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 20 },
      },
    },
    responses: {
      Unauthorized: {
        description: "Token ausente, invalido o expirado",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Forbidden: {
        description: "El recurso no pertenece al usuario autenticado",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Recurso no encontrado",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ValidationError: {
        description: "Body invalido (Zod)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: [],
        summary: "Health check",
        security: [],
        servers: [{ url: "/" }],
        responses: { "200": { description: "El servicio esta arriba" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar nuevo usuario",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/AuthResult" },
                  },
                },
              },
            },
          },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/AuthResult" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Ver perfil propio",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Actualizar perfil propio",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string", maxLength: 100 } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Perfil actualizado" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/files/upload": {
      post: {
        tags: ["Files"],
        summary: "Subir archivo CSV/Excel",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Archivo guardado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/FileRecord" },
                  },
                },
              },
            },
          },
          "409": { description: "Ya existe un archivo con ese nombre para este usuario" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/files": {
      get: {
        tags: ["Files"],
        summary: "Listar archivos del usuario",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/FileRecord" } },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/files/{id}": {
      get: {
        tags: ["Files"],
        summary: "Ver metadata de un archivo",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "OK" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/files/{id}/download": {
      get: {
        tags: ["Files"],
        summary: "Descargar archivo",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Stream binario del archivo",
            content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/jobs/import": {
      post: {
        tags: ["Jobs"],
        summary: "Crear job de importacion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["fileId"],
                properties: { fileId: { type: "string", format: "uuid" } },
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Job encolado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
          "409": { description: "El archivo ya fue importado (job activo o completado)" },
          "422": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/jobs/export": {
      post: {
        tags: ["Jobs"],
        summary: "Crear job de exportacion",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  format: { type: "string", enum: ["csv", "json"], default: "csv" },
                  filters: {
                    type: "object",
                    properties: {
                      jobId: {
                        type: "string",
                        format: "uuid",
                        description: "Si se omite, exporta todos los records validos del usuario",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Job encolado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/jobs/dedup": {
      post: {
        tags: ["Jobs"],
        summary: "Crear job de deduplicacion sobre un job de importacion existente",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["jobId"],
                properties: {
                  jobId: { type: "string", format: "uuid" },
                  rules: {
                    type: "array",
                    items: { type: "string", enum: ["email", "phone", "fuzzy"] },
                    default: ["email"],
                  },
                },
              },
            },
          },
        },
        responses: {
          "202": {
            description: "Job encolado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Listar jobs del usuario (paginado)",
        parameters: [
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Job" } },
                    meta: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Ver estado y progreso de un job",
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/jobs/{id}/results": {
      get: {
        tags: ["Jobs"],
        summary: "Ver registros procesados de un job (paginado, filtrable)",
        description:
          "Para jobs DEDUP consulta los records del job de origen y muestra solo duplicados por defecto.",
        parameters: [
          { $ref: "#/components/parameters/JobId" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/Limit" },
          {
            name: "isValid",
            in: "query",
            schema: { type: "boolean" },
            description: "Filtra por filas validas/invalidas",
          },
          {
            name: "isDuplicate",
            in: "query",
            schema: { type: "boolean" },
            description: "Filtra por filas marcadas como duplicado",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/JobRecord" } },
                    meta: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/jobs/{id}/retry": {
      post: {
        tags: ["Jobs"],
        summary: "Reintentar un job FAILED",
        description: "Resetea processedRows/failedRows/errorLog y lo reencola.",
        parameters: [{ $ref: "#/components/parameters/JobId" }],
        responses: {
          "200": {
            description: "Job reencolado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
          "400": { description: "El job no esta en estado FAILED" },
          "403": { $ref: "#/components/responses/Forbidden" },
        },
      },
    },
    "/jobs/{id}/events": {
      get: {
        tags: ["Jobs"],
        summary: "Progreso en tiempo real (Server-Sent Events)",
        description:
          "text/event-stream con eventos `connected` y `progress`. Al usar EventSource desde el navegador, pasa el JWT como `?token=` porque no se pueden fijar headers.",
        parameters: [
          { $ref: "#/components/parameters/JobId" },
          { name: "token", in: "query", schema: { type: "string" }, description: "JWT alternativo al header Authorization" },
        ],
        responses: {
          "200": {
            description: "Stream SSE",
            content: { "text/event-stream": { schema: { type: "string" } } },
          },
        },
      },
    },
  },
};
