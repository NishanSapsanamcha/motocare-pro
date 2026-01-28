import Appointment from "../../models/appointment/Appointment.js";
import { Op, QueryTypes } from "sequelize";
import sequelize from "../../database/db.js";

export const getSales = async (req, res) => {
  try {
    const {
      q = "",
      garageId = "",
      from = "",
      to = "",
      paymentStatus = "",
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { status: "COMPLETED" };
    if (garageId) {
      whereClause.garage_id = garageId;
    }

    if (from || to) {
      whereClause.updated_at = {};
      if (from) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        whereClause.updated_at[Op.gte] = start;
      }
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        whereClause.updated_at[Op.lte] = end;
      }
    }

    if (q) {
      const like = `%${String(q).trim()}%`;
      whereClause[Op.or] = [
        { service_type: { [Op.iLike]: like } },
        { "$user.full_name$": { [Op.iLike]: like } },
        { "$user.email$": { [Op.iLike]: like } },
        { "$user.phone_number$": { [Op.iLike]: like } },
        { "$garage.name$": { [Op.iLike]: like } },
        { "$garage.address$": { [Op.iLike]: like } },
      ];
    }

    const invoiceWhere = {};
    let invoiceRequired = false;
    if (paymentStatus === "PAID") {
      invoiceWhere.status = "PAID";
      invoiceRequired = true;
    } else if (paymentStatus === "UNPAID") {
      invoiceWhere.status = { [Op.in]: ["DRAFT", "ISSUED", "PAYMENT_PENDING"] };
      invoiceRequired = false;
    } else if (paymentStatus === "REFUNDED") {
      invoiceWhere.status = "CANCELLED";
      invoiceRequired = true;
    }

    const order = [];
    if (sort === "amount_desc") {
      order.push([
        sequelize.literal('COALESCE("invoice"."total_amount", "Appointment"."quoted_price", 0)'),
        "DESC",
      ]);
    } else if (sort === "amount_asc") {
      order.push([
        sequelize.literal('COALESCE("invoice"."total_amount", "Appointment"."quoted_price", 0)'),
        "ASC",
      ]);
    } else if (sort === "oldest") {
      order.push(["updated_at", "ASC"]);
    } else {
      order.push(["updated_at", "DESC"]);
    }

    const { count, rows } = await Appointment.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order,
      distinct: true,
      subQuery: false,
      include: [
        { association: "user", attributes: ["id", "full_name", "email", "phone_number"] },
        { association: "garage", attributes: ["id", "name", "address", "phone"] },
        {
          association: "invoice",
          required: invoiceRequired,
          where: Object.keys(invoiceWhere).length ? invoiceWhere : undefined,
          attributes: ["id", "total_amount", "status", "issued_at", "paid_at"],
        },
      ],
    });

    const data = rows.map((appointment) => {
      const invoice = appointment.invoice;
      const totalAmount =
        invoice?.paid_amount ?? invoice?.total_amount ?? appointment.quoted_price ?? 0;
      let normalizedPayment = "UNPAID";
      if (invoice?.status === "PAID") normalizedPayment = "PAID";
      if (invoice?.status === "CANCELLED") normalizedPayment = "REFUNDED";

      const user = appointment.user
        ? {
            id: appointment.user.id,
            full_name: appointment.user.full_name,
            email: appointment.user.email,
            phone: appointment.user.phone_number,
          }
        : null;

      return {
        id: invoice?.id || appointment.id,
        request_id: appointment.id,
        service_type: appointment.service_type,
        total_amount: totalAmount,
        payment_method: null,
        payment_status: normalizedPayment,
        created_at: invoice?.paid_at || appointment.updated_at,
        invoice_url: null,
        user,
        garage: appointment.garage || null,
      };
    });

    return res.status(200).json({
      message: "Sales fetched",
      data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get sales error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getRevenueSummary = async (req, res) => {
  try {
    const { from = "", to = "", garageId = "" } = req.query;
    const params = {};
    const clauses = [
      "(i.status = 'PAID' OR (i.id IS NULL AND a.status = 'COMPLETED'))",
    ];

    if (garageId) {
      clauses.push("a.garage_id = :garageId");
      params.garageId = garageId;
    }

    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      clauses.push("COALESCE(i.paid_at, a.updated_at) >= :from");
      params.from = start;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      clauses.push("COALESCE(i.paid_at, a.updated_at) <= :to");
      params.to = end;
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const totalRevenueRows = await sequelize.query(
      `
      SELECT COALESCE(SUM(COALESCE(i.paid_amount, i.total_amount, a.quoted_price, 0)), 0) as total
      FROM appointments a
      LEFT JOIN invoices i ON i.appointment_id = a.id
      ${whereSql}
      `,
      { replacements: params, type: QueryTypes.SELECT }
    );

    const totalRevenue = Number(totalRevenueRows?.[0]?.total || 0);

    const completedCountRows = await sequelize.query(
      `
      SELECT COUNT(*) as count
      FROM appointments a
      LEFT JOIN invoices i ON i.appointment_id = a.id
      ${whereSql}
      `,
      { replacements: params, type: QueryTypes.SELECT }
    );
    const completedCount = Number(completedCountRows?.[0]?.count || 0);

    const trendRows = await sequelize.query(
      `
      SELECT
        to_char(date_trunc('day', COALESCE(i.paid_at, a.updated_at)), 'YYYY-MM-DD') as label,
        COALESCE(SUM(COALESCE(i.paid_amount, i.total_amount, a.quoted_price, 0)), 0) as total
      FROM appointments a
      LEFT JOIN invoices i ON i.appointment_id = a.id
      ${whereSql}
      GROUP BY date_trunc('day', COALESCE(i.paid_at, a.updated_at))
      ORDER BY date_trunc('day', COALESCE(i.paid_at, a.updated_at)) ASC
      `,
      { replacements: params, type: QueryTypes.SELECT }
    );

    const garageRows = await sequelize.query(
      `
      SELECT g.name as label, COALESCE(SUM(COALESCE(i.paid_amount, i.total_amount, a.quoted_price, 0)), 0) as total
      FROM appointments a
      JOIN garages g ON g.id = a.garage_id
      LEFT JOIN invoices i ON i.appointment_id = a.id
      ${whereSql}
      GROUP BY g.id
      ORDER BY total DESC
      LIMIT 5
      `,
      { replacements: params, type: QueryTypes.SELECT }
    );

    const serviceTypeRows = await sequelize.query(
      `
      SELECT
        COALESCE(NULLIF(TRIM(a.service_type), ''), 'Unknown') as label,
        COALESCE(SUM(COALESCE(i.paid_amount, i.total_amount, a.quoted_price, 0)), 0) as total
      FROM appointments a
      LEFT JOIN invoices i ON i.appointment_id = a.id
      ${whereSql}
      GROUP BY a.service_type
      ORDER BY total DESC
      `,
      { replacements: params, type: QueryTypes.SELECT }
    );

    const today = new Date();
    const startToday = new Date(today);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);

    const todayParams = { ...params, todayFrom: startToday, todayTo: endToday };
    const todayClauses = [
      ...clauses,
      "COALESCE(i.paid_at, a.updated_at) >= :todayFrom",
      "COALESCE(i.paid_at, a.updated_at) <= :todayTo",
    ];
    const todayWhere = `WHERE ${todayClauses.join(" AND ")}`;

    const salesTodayRows = await sequelize.query(
      `
      SELECT COALESCE(SUM(COALESCE(i.paid_amount, i.total_amount, a.quoted_price, 0)), 0) as total
      FROM appointments a
      LEFT JOIN invoices i ON i.appointment_id = a.id
      ${todayWhere}
      `,
      { replacements: todayParams, type: QueryTypes.SELECT }
    );
    const salesToday = Number(salesTodayRows?.[0]?.total || 0);

    const topGarage = garageRows?.[0]
      ? { name: garageRows[0].label, total: Number(garageRows[0].total || 0) }
      : null;

    return res.status(200).json({
      message: "Revenue summary fetched",
      data: {
        totalSales: totalRevenue || 0,
        totalOrders: completedCount,
        salesToday,
        topGarage,
        trend: trendRows || [],
        garageSales: garageRows || [],
        serviceTypeSales: (serviceTypeRows || []).map((row) => ({
          label: row.label || "Unknown",
          total: Number(row.total || 0),
        })),
      },
    });
  } catch (error) {
    console.error("Get revenue summary error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await sequelize.query(
      "SELECT COUNT(*) as count FROM users WHERE role != 'ADMIN' AND is_deleted = false"
    );

    const totalGarages = await sequelize.query(
      "SELECT COUNT(*) as count FROM garages WHERE is_deleted = false"
    );

    const totalServices = await sequelize.query(
      "SELECT COUNT(*) as count FROM service_requests WHERE is_deleted = false"
    );

    const pendingServices = await sequelize.query(
      "SELECT COUNT(*) as count FROM service_requests WHERE status = 'PENDING' AND is_deleted = false"
    );

    const totalRevenueRows = await sequelize.query(
      `
      SELECT COALESCE(SUM(COALESCE(i.paid_amount, i.total_amount, a.quoted_price, 0)), 0) as total
      FROM appointments a
      LEFT JOIN invoices i ON i.appointment_id = a.id
      WHERE a.status = 'COMPLETED'
      `,
      { type: QueryTypes.SELECT }
    );
    const totalRevenue = Number(totalRevenueRows?.[0]?.total || 0);

    return res.status(200).json({
      message: "Dashboard stats fetched",
      data: {
        totalUsers: totalUsers[0][0].count,
        totalGarages: totalGarages[0][0].count,
        totalServices: totalServices[0][0].count,
        pendingServices: pendingServices[0][0].count,
        totalRevenue: totalRevenue || 0,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
