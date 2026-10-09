/**
 * @moments/no-select-star (KAN-96)
 *
 * In Drizzle, `db.select()` with no arguments generates `SELECT *`. Selecting
 * all columns from the hot `moments` table is banned — callers must list the
 * columns they need.
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow zero-argument db.select() (i.e. SELECT *) when querying the moments table; pass an explicit column list.",
    },
    schema: [],
    messages: {
      selectStar:
        "SELECT * on the moments table is not allowed — pass an explicit column list to select(), e.g. db.select({ id: moments.id }).from(moments).",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression") return;
        const prop = node.callee.property;
        if (prop.type !== "Identifier" || prop.name !== "select") return;
        if (node.arguments.length > 0) return;

        // Walk up the call chain to the nearest .from(<table>) and check the table.
        let current = node.parent;
        while (current) {
          if (
            current.type === "CallExpression" &&
            current.callee.type === "MemberExpression" &&
            current.callee.property.type === "Identifier" &&
            current.callee.property.name === "from"
          ) {
            const table = current.arguments[0];
            if (table && table.type === "Identifier" && table.name === "moments") {
              context.report({ node, messageId: "selectStar" });
            }
            return;
          }
          current = current.parent;
        }
      },
    };
  },
};

module.exports = {
  rules: {
    "no-select-star": rule,
    "no-hardcoded-hex": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Ban hardcoded hex colours outside the design-token source files (epic KAN-5: no hardcoded hex outside packages/ui tokens). Reference tokens via NativeWind classes or @moments/ui instead.",
        },
        schema: [
          {
            type: "object",
            properties: {
              allow: { type: "array", items: { type: "string" } },
            },
            additionalProperties: false,
          },
        ],
        messages: {
          hardcodedHex:
            "Hardcoded hex colour {{hex}} is not allowed outside the token source — use a design token (NativeWind class or @moments/ui).",
        },
      },
      create(context) {
        const allow = (context.options[0]?.allow ?? []) .map((p) => new RegExp(p));
        const re = /^#[0-9a-fA-F]{3,8}$/;
        return {
          Literal(node) {
            if (typeof node.value !== "string" || !re.test(node.value)) return;
            const filename = context.filename ?? context.getFilename();
            if (allow.some((p) => p.test(filename))) return;
            context.report({ node, messageId: "hardcodedHex", data: { hex: node.value } });
          },
          TemplateElement(node) {
            if (!re.test(node.value.raw)) return;
            const filename = context.filename ?? context.getFilename();
            if (allow.some((p) => p.test(filename))) return;
            context.report({ node, messageId: "hardcodedHex", data: { hex: node.value.raw } });
          },
        };
      },
    },
  },
};
