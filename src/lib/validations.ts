import { z } from "zod";

// ── Shared Primitives ──────────────────────────────────────────────

export const UuidSchema = z.string().uuid("不正なIDです");

export const EmailSchema = z
  .string()
  .email("有効なメールアドレスを入力してください");

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "不正なカラーコードです");

export const FlagKeySchema = z
  .string()
  .min(1, "フラグキーは必須です")
  .regex(
    /^[a-z0-9-_]+$/,
    "小文字英数字・ハイフン・アンダースコアのみ使用可能"
  );

export const FlagTypeSchema = z.enum(["boolean", "string", "number", "json"]);

export const MemberRoleSchema = z.enum(["admin", "editor", "viewer"]);

// ── Auth Schemas ───────────────────────────────────────────────────

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "パスワードは必須です"),
});

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, "パスワードは8文字以上必要です"),
  full_name: z.string().min(1, "名前は必須です").max(100),
  org_name: z.string().min(1, "組織名は必須です").max(100),
});

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, "パスワードは8文字以上必要です"),
});

// ── Flag Schemas ───────────────────────────────────────────────────

export const CreateFlagSchema = z.object({
  project_id: z.string().uuid("不正なプロジェクトIDです"),
  key: FlagKeySchema,
  name: z.string().min(1, "表示名は必須です").max(200),
  description: z.string().max(1000).optional().default(""),
  flag_type: FlagTypeSchema,
  tags: z.string().optional().default(""),
});

export const UpdateFlagDetailsSchema = z.object({
  name: z.string().min(1, "表示名は必須です").max(200),
  description: z.string().max(1000).optional().default(""),
  tags: z.string().optional().default(""),
});

export const UpdateFlagConfigSchema = z.object({
  enabled: z.boolean().optional(),
  default_value: z.any().optional(),
  rollout_percent: z.number().min(0).max(100).nullable().optional(),
  rules: z.any().optional(),
});

// ── Organization / Project / Environment Schemas ───────────────────

export const CreateProjectSchema = z.object({
  organization_id: z.string().uuid("不正な組織IDです"),
  name: z.string().min(1, "プロジェクト名は必須です").max(100),
  description: z.string().max(500).optional().default(""),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").max(100),
  description: z.string().max(500).optional().default(""),
});

export const CreateEnvironmentSchema = z.object({
  project_id: z.string().uuid("不正なプロジェクトIDです"),
  name: z.string().min(1, "環境名は必須です").max(50),
  color: HexColorSchema.default("#6366f1"),
});

export const UpdateEnvironmentSchema = z.object({
  name: z.string().min(1, "環境名は必須です").max(50).optional(),
  color: HexColorSchema.optional(),
});

export const UpdateOrgSchema = z.object({
  name: z.string().min(1, "組織名は必須です").max(100),
});

export const InviteMemberSchema = z.object({
  organization_id: z.string().uuid(),
  email: EmailSchema,
  role: MemberRoleSchema,
});

// ── Audit Schemas ──────────────────────────────────────────────────

export const ListAuditLogsSchema = z.object({
  projectId: z.string().uuid("不正なプロジェクトIDです"),
  environmentId: z.string().uuid().optional(),
  flagId: z.string().uuid().optional(),
  action: z.string().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

export const FlagAuditLogsSchema = z.object({
  flagId: z.string().uuid("不正なフラグIDです"),
  limit: z.number().min(1).max(100).default(20),
});
