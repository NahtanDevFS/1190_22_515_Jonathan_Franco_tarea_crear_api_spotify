import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { env } from "../config/env";
import { openapi } from "./openapi";

// Documentación interactiva en /api-docs (se desactiva en producción)
export function montarDocumentacion(app: Express) {
  if (env.NODE_ENV === "production") return;
  app.get("/api-docs.yaml", (_req, res) => {
    res.type("application/yaml").send(YAML.stringify(openapi));
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, { customSiteTitle: "MusicAPI" }),
  );
}
