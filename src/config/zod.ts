import { z } from "zod";

// Mensajes de validación en español para todos los esquemas Zod.
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message:
          issue.received === "undefined"
            ? "Campo obligatorio"
            : `Tipo inválido, se esperaba ${issue.expected}`,
      };
    case z.ZodIssueCode.too_small:
      if (issue.type === "string")
        return { message: `Debe tener al menos ${issue.minimum} caracteres` };
      if (issue.type === "number")
        return { message: `Debe ser mayor o igual a ${issue.minimum}` };
      return { message: `Debe tener al menos ${issue.minimum} elementos` };
    case z.ZodIssueCode.too_big:
      if (issue.type === "string")
        return {
          message: `Debe tener como máximo ${issue.maximum} caracteres`,
        };
      if (issue.type === "number")
        return { message: `Debe ser menor o igual a ${issue.maximum}` };
      return { message: `Debe tener como máximo ${issue.maximum} elementos` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email")
        return { message: "Correo electrónico inválido" };
      if (issue.validation === "uuid")
        return { message: "Identificador inválido" };
      return { message: "Formato inválido" };
    case z.ZodIssueCode.invalid_enum_value:
      return {
        message: `Valor no permitido. Opciones: ${issue.options.join(", ")}`,
      };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campos no permitidos: ${issue.keys.join(", ")}` };
    default:
      return { message: ctx.defaultError };
  }
});
