import { describe, it, expect } from "vitest";
import {
  UuidSchema,
  EmailSchema,
  HexColorSchema,
  FlagKeySchema,
  FlagTypeSchema,
  MemberRoleSchema,
  SignInSchema,
  SignUpSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
  CreateFlagSchema,
  UpdateFlagDetailsSchema,
  UpdateFlagConfigSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateEnvironmentSchema,
  UpdateEnvironmentSchema,
  UpdateOrgSchema,
  InviteMemberSchema,
  ListAuditLogsSchema,
  FlagAuditLogsSchema,
} from "@/lib/validations";

// ── Helpers ─────────────────────────────────────────────────────────

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const VALID_EMAIL = "test@example.com";

function expectSuccess(result: { success: boolean }) {
  expect(result.success).toBe(true);
}

function expectFailure(result: { success: boolean }) {
  expect(result.success).toBe(false);
}

// ── UuidSchema ──────────────────────────────────────────────────────

describe("UuidSchema", () => {
  it("accepts a valid v4 UUID", () => {
    expectSuccess(UuidSchema.safeParse(VALID_UUID));
  });

  it("accepts another valid UUID", () => {
    expectSuccess(UuidSchema.safeParse(VALID_UUID_2));
  });

  it("rejects an empty string", () => {
    expectFailure(UuidSchema.safeParse(""));
  });

  it("rejects a non-UUID string", () => {
    expectFailure(UuidSchema.safeParse("not-a-uuid"));
  });

  it("rejects a UUID missing one character", () => {
    expectFailure(UuidSchema.safeParse("550e8400-e29b-41d4-a716-44665544000"));
  });

  it("rejects a number", () => {
    expectFailure(UuidSchema.safeParse(12345));
  });

  it("rejects null", () => {
    expectFailure(UuidSchema.safeParse(null));
  });

  it("rejects undefined", () => {
    expectFailure(UuidSchema.safeParse(undefined));
  });
});

// ── EmailSchema ─────────────────────────────────────────────────────

describe("EmailSchema", () => {
  it("accepts a standard email", () => {
    expectSuccess(EmailSchema.safeParse("user@example.com"));
  });

  it("accepts email with subdomain", () => {
    expectSuccess(EmailSchema.safeParse("user@mail.example.co.jp"));
  });

  it("accepts email with + alias", () => {
    expectSuccess(EmailSchema.safeParse("user+tag@example.com"));
  });

  it("rejects an empty string", () => {
    expectFailure(EmailSchema.safeParse(""));
  });

  it("rejects a string without @", () => {
    expectFailure(EmailSchema.safeParse("userexample.com"));
  });

  it("rejects a string with @ but no domain", () => {
    expectFailure(EmailSchema.safeParse("user@"));
  });

  it("returns Japanese error message", () => {
    const result = EmailSchema.safeParse("invalid");
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toBe("有効なメールアドレスを入力してください");
    }
  });
});

// ── HexColorSchema ──────────────────────────────────────────────────

describe("HexColorSchema", () => {
  it("accepts #000000", () => {
    expectSuccess(HexColorSchema.safeParse("#000000"));
  });

  it("accepts #FFFFFF (uppercase)", () => {
    expectSuccess(HexColorSchema.safeParse("#FFFFFF"));
  });

  it("accepts #6366f1 (mixed case)", () => {
    expectSuccess(HexColorSchema.safeParse("#6366f1"));
  });

  it("rejects 3-char shorthand #FFF", () => {
    expectFailure(HexColorSchema.safeParse("#FFF"));
  });

  it("rejects missing # prefix", () => {
    expectFailure(HexColorSchema.safeParse("FF0000"));
  });

  it("rejects 8-char hex (with alpha)", () => {
    expectFailure(HexColorSchema.safeParse("#FF000080"));
  });

  it("rejects non-hex characters", () => {
    expectFailure(HexColorSchema.safeParse("#GGGGGG"));
  });

  it("returns Japanese error message", () => {
    const result = HexColorSchema.safeParse("bad");
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("不正なカラーコードです");
    }
  });
});

// ── FlagKeySchema ───────────────────────────────────────────────────

describe("FlagKeySchema", () => {
  it("accepts lowercase alphabets", () => {
    expectSuccess(FlagKeySchema.safeParse("feature"));
  });

  it("accepts lowercase with hyphens", () => {
    expectSuccess(FlagKeySchema.safeParse("new-feature"));
  });

  it("accepts lowercase with underscores", () => {
    expectSuccess(FlagKeySchema.safeParse("new_feature"));
  });

  it("accepts digits", () => {
    expectSuccess(FlagKeySchema.safeParse("feature123"));
  });

  it("accepts complex key with all allowed chars", () => {
    expectSuccess(FlagKeySchema.safeParse("my-feature_v2-beta"));
  });

  it("rejects empty string", () => {
    const result = FlagKeySchema.safeParse("");
    expectFailure(result);
  });

  it("rejects uppercase letters", () => {
    expectFailure(FlagKeySchema.safeParse("MyFeature"));
  });

  it("rejects spaces", () => {
    expectFailure(FlagKeySchema.safeParse("my feature"));
  });

  it("rejects dots", () => {
    expectFailure(FlagKeySchema.safeParse("my.feature"));
  });

  it("rejects special characters", () => {
    expectFailure(FlagKeySchema.safeParse("feat@ure!"));
  });

  it("returns correct error for empty key", () => {
    const result = FlagKeySchema.safeParse("");
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("フラグキーは必須です");
    }
  });

  it("returns correct error for invalid chars", () => {
    const result = FlagKeySchema.safeParse("UPPER");
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "小文字英数字・ハイフン・アンダースコアのみ使用可能"
      );
    }
  });
});

// ── FlagTypeSchema ──────────────────────────────────────────────────

describe("FlagTypeSchema", () => {
  it.each(["boolean", "string", "number", "json"] as const)(
    'accepts "%s"',
    (val) => {
      expectSuccess(FlagTypeSchema.safeParse(val));
    }
  );

  it("rejects unknown type", () => {
    expectFailure(FlagTypeSchema.safeParse("array"));
  });

  it("rejects empty string", () => {
    expectFailure(FlagTypeSchema.safeParse(""));
  });
});

// ── MemberRoleSchema ────────────────────────────────────────────────

describe("MemberRoleSchema", () => {
  it.each(["admin", "editor", "viewer"] as const)(
    'accepts "%s"',
    (val) => {
      expectSuccess(MemberRoleSchema.safeParse(val));
    }
  );

  it("rejects owner (not in enum)", () => {
    expectFailure(MemberRoleSchema.safeParse("owner"));
  });

  it("rejects empty string", () => {
    expectFailure(MemberRoleSchema.safeParse(""));
  });
});

// ── SignInSchema ────────────────────────────────────────────────────

describe("SignInSchema", () => {
  it("accepts valid email and password", () => {
    expectSuccess(
      SignInSchema.safeParse({ email: VALID_EMAIL, password: "pass" })
    );
  });

  it("rejects missing email", () => {
    expectFailure(SignInSchema.safeParse({ password: "pass" }));
  });

  it("rejects missing password", () => {
    expectFailure(SignInSchema.safeParse({ email: VALID_EMAIL }));
  });

  it("rejects empty password", () => {
    expectFailure(
      SignInSchema.safeParse({ email: VALID_EMAIL, password: "" })
    );
  });

  it("rejects invalid email format", () => {
    expectFailure(
      SignInSchema.safeParse({ email: "notanemail", password: "pass" })
    );
  });

  it("accepts password of 1 character (no min-length for sign-in)", () => {
    expectSuccess(
      SignInSchema.safeParse({ email: VALID_EMAIL, password: "x" })
    );
  });
});

// ── SignUpSchema ────────────────────────────────────────────────────

describe("SignUpSchema", () => {
  const valid = {
    email: VALID_EMAIL,
    password: "securepassword",
    full_name: "Taro Yamada",
    org_name: "Acme Corp",
  };

  it("accepts all valid fields", () => {
    expectSuccess(SignUpSchema.safeParse(valid));
  });

  it("rejects password shorter than 8 chars", () => {
    expectFailure(SignUpSchema.safeParse({ ...valid, password: "short" }));
  });

  it("accepts password of exactly 8 chars", () => {
    expectSuccess(
      SignUpSchema.safeParse({ ...valid, password: "12345678" })
    );
  });

  it("rejects empty full_name", () => {
    expectFailure(SignUpSchema.safeParse({ ...valid, full_name: "" }));
  });

  it("rejects full_name over 100 chars", () => {
    expectFailure(
      SignUpSchema.safeParse({ ...valid, full_name: "a".repeat(101) })
    );
  });

  it("accepts full_name of exactly 100 chars", () => {
    expectSuccess(
      SignUpSchema.safeParse({ ...valid, full_name: "a".repeat(100) })
    );
  });

  it("rejects empty org_name", () => {
    expectFailure(SignUpSchema.safeParse({ ...valid, org_name: "" }));
  });

  it("rejects org_name over 100 chars", () => {
    expectFailure(
      SignUpSchema.safeParse({ ...valid, org_name: "a".repeat(101) })
    );
  });

  it("accepts org_name of exactly 100 chars", () => {
    expectSuccess(
      SignUpSchema.safeParse({ ...valid, org_name: "a".repeat(100) })
    );
  });

  it("rejects missing email", () => {
    const { email, ...rest } = valid;
    expectFailure(SignUpSchema.safeParse(rest));
  });

  it("returns Japanese error for short password", () => {
    const result = SignUpSchema.safeParse({ ...valid, password: "short" });
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "パスワードは8文字以上必要です"
      );
    }
  });
});

// ── ResetPasswordSchema ─────────────────────────────────────────────

describe("ResetPasswordSchema", () => {
  it("accepts valid email", () => {
    expectSuccess(ResetPasswordSchema.safeParse({ email: VALID_EMAIL }));
  });

  it("rejects invalid email", () => {
    expectFailure(ResetPasswordSchema.safeParse({ email: "bad" }));
  });

  it("rejects missing email", () => {
    expectFailure(ResetPasswordSchema.safeParse({}));
  });
});

// ── UpdatePasswordSchema ────────────────────────────────────────────

describe("UpdatePasswordSchema", () => {
  it("accepts password of 8+ chars", () => {
    expectSuccess(
      UpdatePasswordSchema.safeParse({ password: "newpassword123" })
    );
  });

  it("rejects password shorter than 8 chars", () => {
    expectFailure(
      UpdatePasswordSchema.safeParse({ password: "short" })
    );
  });

  it("accepts exactly 8 chars", () => {
    expectSuccess(
      UpdatePasswordSchema.safeParse({ password: "12345678" })
    );
  });

  it("rejects 7 chars", () => {
    expectFailure(
      UpdatePasswordSchema.safeParse({ password: "1234567" })
    );
  });
});

// ── CreateFlagSchema ────────────────────────────────────────────────

describe("CreateFlagSchema", () => {
  const valid = {
    project_id: VALID_UUID,
    key: "my-feature",
    name: "My Feature",
    flag_type: "boolean" as const,
  };

  it("accepts valid input with defaults", () => {
    const result = CreateFlagSchema.safeParse(valid);
    expectSuccess(result);
    if (result.success) {
      expect(result.data.description).toBe("");
      expect(result.data.tags).toBe("");
    }
  });

  it("accepts input with all fields", () => {
    expectSuccess(
      CreateFlagSchema.safeParse({
        ...valid,
        description: "A feature flag",
        tags: "frontend,beta",
      })
    );
  });

  it("rejects invalid project_id", () => {
    expectFailure(
      CreateFlagSchema.safeParse({ ...valid, project_id: "bad" })
    );
  });

  it("rejects uppercase flag key", () => {
    expectFailure(
      CreateFlagSchema.safeParse({ ...valid, key: "MyFeature" })
    );
  });

  it("rejects empty name", () => {
    expectFailure(CreateFlagSchema.safeParse({ ...valid, name: "" }));
  });

  it("rejects name over 200 chars", () => {
    expectFailure(
      CreateFlagSchema.safeParse({ ...valid, name: "x".repeat(201) })
    );
  });

  it("accepts name of exactly 200 chars", () => {
    expectSuccess(
      CreateFlagSchema.safeParse({ ...valid, name: "x".repeat(200) })
    );
  });

  it("rejects description over 1000 chars", () => {
    expectFailure(
      CreateFlagSchema.safeParse({
        ...valid,
        description: "x".repeat(1001),
      })
    );
  });

  it("accepts description of exactly 1000 chars", () => {
    expectSuccess(
      CreateFlagSchema.safeParse({
        ...valid,
        description: "x".repeat(1000),
      })
    );
  });

  it("rejects invalid flag_type", () => {
    expectFailure(
      CreateFlagSchema.safeParse({ ...valid, flag_type: "array" })
    );
  });

  it.each(["boolean", "string", "number", "json"] as const)(
    'accepts flag_type "%s"',
    (ft) => {
      expectSuccess(
        CreateFlagSchema.safeParse({ ...valid, flag_type: ft })
      );
    }
  );
});

// ── UpdateFlagDetailsSchema ─────────────────────────────────────────

describe("UpdateFlagDetailsSchema", () => {
  it("accepts valid name only", () => {
    const result = UpdateFlagDetailsSchema.safeParse({ name: "Feature" });
    expectSuccess(result);
    if (result.success) {
      expect(result.data.description).toBe("");
      expect(result.data.tags).toBe("");
    }
  });

  it("accepts all fields", () => {
    expectSuccess(
      UpdateFlagDetailsSchema.safeParse({
        name: "Feature",
        description: "desc",
        tags: "a,b",
      })
    );
  });

  it("rejects empty name", () => {
    expectFailure(UpdateFlagDetailsSchema.safeParse({ name: "" }));
  });

  it("rejects name over 200 chars", () => {
    expectFailure(
      UpdateFlagDetailsSchema.safeParse({ name: "x".repeat(201) })
    );
  });

  it("rejects description over 1000 chars", () => {
    expectFailure(
      UpdateFlagDetailsSchema.safeParse({
        name: "ok",
        description: "x".repeat(1001),
      })
    );
  });
});

// ── UpdateFlagConfigSchema ──────────────────────────────────────────

describe("UpdateFlagConfigSchema", () => {
  it("accepts empty object (all optional)", () => {
    expectSuccess(UpdateFlagConfigSchema.safeParse({}));
  });

  it("accepts enabled true", () => {
    expectSuccess(UpdateFlagConfigSchema.safeParse({ enabled: true }));
  });

  it("accepts enabled false", () => {
    expectSuccess(UpdateFlagConfigSchema.safeParse({ enabled: false }));
  });

  it("accepts rollout_percent 0", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ rollout_percent: 0 })
    );
  });

  it("accepts rollout_percent 100", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ rollout_percent: 100 })
    );
  });

  it("accepts rollout_percent 50.5 (decimal)", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ rollout_percent: 50.5 })
    );
  });

  it("rejects rollout_percent -1", () => {
    expectFailure(
      UpdateFlagConfigSchema.safeParse({ rollout_percent: -1 })
    );
  });

  it("rejects rollout_percent 101", () => {
    expectFailure(
      UpdateFlagConfigSchema.safeParse({ rollout_percent: 101 })
    );
  });

  it("accepts rollout_percent null", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ rollout_percent: null })
    );
  });

  it("accepts default_value as string", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ default_value: "hello" })
    );
  });

  it("accepts default_value as number", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ default_value: 42 })
    );
  });

  it("accepts default_value as object", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({ default_value: { key: "val" } })
    );
  });

  it("accepts rules as array", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({
        rules: [{ attribute: "country", operator: "eq", value: "JP" }],
      })
    );
  });

  it("accepts all fields at once", () => {
    expectSuccess(
      UpdateFlagConfigSchema.safeParse({
        enabled: true,
        default_value: "on",
        rollout_percent: 75,
        rules: [],
      })
    );
  });
});

// ── CreateProjectSchema ─────────────────────────────────────────────

describe("CreateProjectSchema", () => {
  const valid = {
    organization_id: VALID_UUID,
    name: "Project Alpha",
  };

  it("accepts valid input with defaults", () => {
    const result = CreateProjectSchema.safeParse(valid);
    expectSuccess(result);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("accepts input with description", () => {
    expectSuccess(
      CreateProjectSchema.safeParse({ ...valid, description: "Some desc" })
    );
  });

  it("rejects invalid organization_id", () => {
    expectFailure(
      CreateProjectSchema.safeParse({ ...valid, organization_id: "bad" })
    );
  });

  it("rejects empty project name", () => {
    expectFailure(
      CreateProjectSchema.safeParse({ ...valid, name: "" })
    );
  });

  it("rejects project name over 100 chars", () => {
    expectFailure(
      CreateProjectSchema.safeParse({ ...valid, name: "x".repeat(101) })
    );
  });

  it("accepts project name of exactly 100 chars", () => {
    expectSuccess(
      CreateProjectSchema.safeParse({ ...valid, name: "x".repeat(100) })
    );
  });

  it("rejects description over 500 chars", () => {
    expectFailure(
      CreateProjectSchema.safeParse({
        ...valid,
        description: "x".repeat(501),
      })
    );
  });

  it("accepts description of exactly 500 chars", () => {
    expectSuccess(
      CreateProjectSchema.safeParse({
        ...valid,
        description: "x".repeat(500),
      })
    );
  });

  it("returns Japanese error for invalid org id", () => {
    const result = CreateProjectSchema.safeParse({
      ...valid,
      organization_id: "not-uuid",
    });
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("不正な組織IDです");
    }
  });
});

// ── UpdateProjectSchema ─────────────────────────────────────────────

describe("UpdateProjectSchema", () => {
  it("accepts valid name", () => {
    expectSuccess(UpdateProjectSchema.safeParse({ name: "Updated" }));
  });

  it("rejects empty name", () => {
    expectFailure(UpdateProjectSchema.safeParse({ name: "" }));
  });

  it("rejects name over 100 chars", () => {
    expectFailure(
      UpdateProjectSchema.safeParse({ name: "x".repeat(101) })
    );
  });

  it("rejects description over 500 chars", () => {
    expectFailure(
      UpdateProjectSchema.safeParse({
        name: "ok",
        description: "x".repeat(501),
      })
    );
  });
});

// ── CreateEnvironmentSchema ─────────────────────────────────────────

describe("CreateEnvironmentSchema", () => {
  const valid = {
    project_id: VALID_UUID,
    name: "Staging",
  };

  it("accepts valid input and applies default color", () => {
    const result = CreateEnvironmentSchema.safeParse(valid);
    expectSuccess(result);
    if (result.success) {
      expect(result.data.color).toBe("#6366f1");
    }
  });

  it("accepts custom color", () => {
    const result = CreateEnvironmentSchema.safeParse({
      ...valid,
      color: "#ff0000",
    });
    expectSuccess(result);
    if (result.success) {
      expect(result.data.color).toBe("#ff0000");
    }
  });

  it("rejects invalid project_id", () => {
    expectFailure(
      CreateEnvironmentSchema.safeParse({ ...valid, project_id: "bad" })
    );
  });

  it("rejects empty name", () => {
    expectFailure(
      CreateEnvironmentSchema.safeParse({ ...valid, name: "" })
    );
  });

  it("rejects name over 50 chars", () => {
    expectFailure(
      CreateEnvironmentSchema.safeParse({
        ...valid,
        name: "x".repeat(51),
      })
    );
  });

  it("accepts name of exactly 50 chars", () => {
    expectSuccess(
      CreateEnvironmentSchema.safeParse({
        ...valid,
        name: "x".repeat(50),
      })
    );
  });

  it("rejects invalid color format", () => {
    expectFailure(
      CreateEnvironmentSchema.safeParse({ ...valid, color: "red" })
    );
  });
});

// ── UpdateEnvironmentSchema ─────────────────────────────────────────

describe("UpdateEnvironmentSchema", () => {
  it("accepts name only", () => {
    expectSuccess(
      UpdateEnvironmentSchema.safeParse({ name: "Production" })
    );
  });

  it("accepts color only", () => {
    expectSuccess(
      UpdateEnvironmentSchema.safeParse({ color: "#abcdef" })
    );
  });

  it("accepts both fields", () => {
    expectSuccess(
      UpdateEnvironmentSchema.safeParse({
        name: "Production",
        color: "#abcdef",
      })
    );
  });

  it("accepts empty object (all optional)", () => {
    expectSuccess(UpdateEnvironmentSchema.safeParse({}));
  });

  it("rejects name over 50 chars", () => {
    expectFailure(
      UpdateEnvironmentSchema.safeParse({ name: "x".repeat(51) })
    );
  });

  it("rejects invalid color", () => {
    expectFailure(
      UpdateEnvironmentSchema.safeParse({ color: "#GGG" })
    );
  });
});

// ── UpdateOrgSchema ─────────────────────────────────────────────────

describe("UpdateOrgSchema", () => {
  it("accepts valid name", () => {
    expectSuccess(UpdateOrgSchema.safeParse({ name: "New Org" }));
  });

  it("rejects empty name", () => {
    expectFailure(UpdateOrgSchema.safeParse({ name: "" }));
  });

  it("rejects name over 100 chars", () => {
    expectFailure(
      UpdateOrgSchema.safeParse({ name: "x".repeat(101) })
    );
  });

  it("accepts name of exactly 100 chars", () => {
    expectSuccess(
      UpdateOrgSchema.safeParse({ name: "x".repeat(100) })
    );
  });

  it("returns Japanese error for empty name", () => {
    const result = UpdateOrgSchema.safeParse({ name: "" });
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("組織名は必須です");
    }
  });
});

// ── InviteMemberSchema ──────────────────────────────────────────────

describe("InviteMemberSchema", () => {
  const valid = {
    organization_id: VALID_UUID,
    email: VALID_EMAIL,
    role: "editor" as const,
  };

  it("accepts valid input", () => {
    expectSuccess(InviteMemberSchema.safeParse(valid));
  });

  it("rejects invalid organization_id", () => {
    expectFailure(
      InviteMemberSchema.safeParse({ ...valid, organization_id: "bad" })
    );
  });

  it("rejects invalid email", () => {
    expectFailure(
      InviteMemberSchema.safeParse({ ...valid, email: "notanemail" })
    );
  });

  it("rejects invalid role", () => {
    expectFailure(
      InviteMemberSchema.safeParse({ ...valid, role: "superadmin" })
    );
  });

  it.each(["admin", "editor", "viewer"] as const)(
    'accepts role "%s"',
    (role) => {
      expectSuccess(InviteMemberSchema.safeParse({ ...valid, role }));
    }
  );

  it("rejects missing fields", () => {
    expectFailure(InviteMemberSchema.safeParse({}));
  });
});

// ── ListAuditLogsSchema ─────────────────────────────────────────────

describe("ListAuditLogsSchema", () => {
  const minimal = { projectId: VALID_UUID };

  it("accepts minimal input and applies defaults", () => {
    const result = ListAuditLogsSchema.safeParse(minimal);
    expectSuccess(result);
    if (result.success) {
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(0);
    }
  });

  it("accepts all optional fields", () => {
    expectSuccess(
      ListAuditLogsSchema.safeParse({
        ...minimal,
        environmentId: VALID_UUID_2,
        flagId: VALID_UUID,
        action: "flag.created",
        limit: 50,
        offset: 10,
      })
    );
  });

  it("rejects invalid projectId", () => {
    expectFailure(
      ListAuditLogsSchema.safeParse({ projectId: "bad" })
    );
  });

  it("rejects limit of 0", () => {
    expectFailure(
      ListAuditLogsSchema.safeParse({ ...minimal, limit: 0 })
    );
  });

  it("rejects limit over 500", () => {
    expectFailure(
      ListAuditLogsSchema.safeParse({ ...minimal, limit: 501 })
    );
  });

  it("accepts limit of exactly 1", () => {
    expectSuccess(
      ListAuditLogsSchema.safeParse({ ...minimal, limit: 1 })
    );
  });

  it("accepts limit of exactly 500", () => {
    expectSuccess(
      ListAuditLogsSchema.safeParse({ ...minimal, limit: 500 })
    );
  });

  it("rejects negative offset", () => {
    expectFailure(
      ListAuditLogsSchema.safeParse({ ...minimal, offset: -1 })
    );
  });

  it("accepts offset of 0", () => {
    expectSuccess(
      ListAuditLogsSchema.safeParse({ ...minimal, offset: 0 })
    );
  });

  it("rejects invalid environmentId", () => {
    expectFailure(
      ListAuditLogsSchema.safeParse({
        ...minimal,
        environmentId: "not-a-uuid",
      })
    );
  });
});

// ── FlagAuditLogsSchema ─────────────────────────────────────────────

describe("FlagAuditLogsSchema", () => {
  it("accepts valid flagId with default limit", () => {
    const result = FlagAuditLogsSchema.safeParse({ flagId: VALID_UUID });
    expectSuccess(result);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts custom limit", () => {
    expectSuccess(
      FlagAuditLogsSchema.safeParse({ flagId: VALID_UUID, limit: 50 })
    );
  });

  it("rejects invalid flagId", () => {
    expectFailure(
      FlagAuditLogsSchema.safeParse({ flagId: "bad" })
    );
  });

  it("rejects limit of 0", () => {
    expectFailure(
      FlagAuditLogsSchema.safeParse({ flagId: VALID_UUID, limit: 0 })
    );
  });

  it("rejects limit over 100", () => {
    expectFailure(
      FlagAuditLogsSchema.safeParse({ flagId: VALID_UUID, limit: 101 })
    );
  });

  it("accepts limit of exactly 1", () => {
    expectSuccess(
      FlagAuditLogsSchema.safeParse({ flagId: VALID_UUID, limit: 1 })
    );
  });

  it("accepts limit of exactly 100", () => {
    expectSuccess(
      FlagAuditLogsSchema.safeParse({ flagId: VALID_UUID, limit: 100 })
    );
  });

  it("returns Japanese error for invalid flagId", () => {
    const result = FlagAuditLogsSchema.safeParse({ flagId: "bad" });
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("不正なフラグIDです");
    }
  });
});
