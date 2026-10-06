import type { Request, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Esquemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

// Valida body/query/params con Zod: validar({ body: esquema })
export const validar =
  (esquemas: Esquemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (esquemas.body) req.body = esquemas.body.parse(req.body);
      if (esquemas.query)
        req.query = esquemas.query.parse(req.query) as Request["query"];
      if (esquemas.params)
        req.params = esquemas.params.parse(req.params) as Request["params"];
      next();
    } catch (err) {
      next(err);
    }
  };
