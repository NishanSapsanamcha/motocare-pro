export const up = async ({ sequelize }) => {
  await sequelize.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
  `);

  try {
    await sequelize.query(`ALTER TYPE "enum_invoices_status" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING';`);
  } catch {
    // ignore if enum does not exist or DB doesn't support enums in this way
  }
};
