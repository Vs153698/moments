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

module.exports = { rules: { "no-select-star": rule } };
