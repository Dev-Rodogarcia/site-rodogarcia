import { z } from "zod";
import { HttpError } from "../utils/http.js";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize.js";

const profile = z.enum(["site_user", "employee"]);
const status = z.enum(["pending", "completed", "archived"]);

function createImprovementSchema(requireEmployeeBranch = true) {
  return z.object({
  profile,
  name: z.unknown().transform((value) => sanitizeText(value, 100)).refine(Boolean, "Informe seu nome."),
  email: z.unknown().transform(sanitizeEmail).refine(Boolean, "Informe um e-mail válido."),
  phone: z.unknown().optional().transform((value) => String(value ?? "").replace(/\D/g, "")).refine((value) => !value || value.length === 10 || value.length === 11, "Informe um telefone brasileiro válido."),
  category: z.unknown().transform((value) => sanitizeText(value, 60)).refine(Boolean, "Escolha um tipo de melhoria."),
  message: z.unknown().transform((value) => sanitizeText(value, 2000)).refine((value) => value.length >= 10, "Descreva a melhoria com mais detalhes."),
  page: z.unknown().optional().transform((value) => sanitizeText(value, 180)),
  branch: z.unknown().optional().transform((value) => sanitizeText(value, 100)),
  area: z.unknown().optional().transform((value) => sanitizeText(value, 100)),
  expectedResult: z.unknown().optional().transform((value) => sanitizeText(value, 800)),
  applicationPlace: z.unknown().optional().transform((value) => sanitizeText(value, 180)),
  }).superRefine((value, context) => {
  if (value.profile === "site_user" && !["site_suggestion", "site_problem", "site_accessibility", "site_content"].includes(value.category)) {
    context.addIssue({ code: "custom", path: ["category"], message: "Escolha uma categoria relacionada ao site." });
  }
  if (requireEmployeeBranch && value.profile === "employee" && !value.branch) {
    context.addIssue({ code: "custom", path: ["branch"], message: "Informe a filial em que trabalha." });
  }
  });
}

export type ImprovementInput = z.infer<ReturnType<typeof createImprovementSchema>>;

export function parseImprovement(value: unknown): ImprovementInput {
  const result = createImprovementSchema().safeParse(value);
  if (result.success) return result.data;
  throw new HttpError(422, result.error.issues[0]?.message ?? "Dados da melhoria inválidos.");
}

/** O formulário interno é exclusivo para administradores e não exige telefone ou filial. */
export function parseAdminImprovement(value: unknown): ImprovementInput {
  const result = createImprovementSchema(false).safeParse(value);
  if (!result.success) throw new HttpError(422, result.error.issues[0]?.message ?? "Dados da melhoria inválidos.");
  if (result.data.profile !== "employee") throw new HttpError(422, "O CMS aceita somente sugestões de colaboradores.");
  return result.data;
}

export function parseImprovementStatus(value: unknown) {
  const result = status.safeParse(value);
  if (result.success) return result.data;
  throw new HttpError(422, "Status de melhoria inválido.");
}
