import type { Request, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

// Valida body/query/params con Zod: validate({ body: schema })
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query)
        req.query = schemas.query.parse(req.query) as Request["query"];
      if (schemas.params)
        req.params = schemas.params.parse(req.params) as Request["params"];
      next();
    } catch (err) {
      next(err);
    }
  };
