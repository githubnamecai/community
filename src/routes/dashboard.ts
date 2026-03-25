import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 仪表盘统计数据
app.get('/stats', async (c) => {
  const currentMonth = new Date().toISOString().slice(0, 7)

  // 楼栋总数
  const buildingCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM buildings'
  ).first()

  // 房屋统计
  const unitTotal = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM units'
  ).first()
  const unitOccupied = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM units WHERE status = '已入住'`
  ).first()

  // 业主总数
  const ownerCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM owners WHERE status = '在住'`
  ).first()

  // 本月收费统计
  const billTotal = await c.env.DB.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ?'
  ).bind(currentMonth).first()
  const billPaid = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ? AND status = '已缴'`
  ).bind(currentMonth).first()

  // 报修统计
  const repairPending = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM repairs WHERE status = '待处理'`
  ).first()
  const repairProcessing = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM repairs WHERE status = '处理中'`
  ).first()

  // 最近报修
  const recentRepairs = await c.env.DB.prepare(
    `SELECT r.*, u.unit_number, b.name as building_name, o.name as owner_name
     FROM repairs r
     LEFT JOIN units u ON r.unit_id = u.id
     LEFT JOIN buildings b ON u.building_id = b.id
     LEFT JOIN owners o ON r.owner_id = o.id
     ORDER BY r.created_at DESC LIMIT 5`
  ).all()

  // 最近公告
  const recentNotices = await c.env.DB.prepare(
    `SELECT * FROM notices WHERE status = '已发布' ORDER BY is_top DESC, publish_date DESC LIMIT 5`
  ).all()

  // 近6个月收费趋势
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().slice(0, 7))
  }

  const feesTrend = []
  for (const m of months) {
    const total = await c.env.DB.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ?'
    ).bind(m).first()
    const paid = await c.env.DB.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ? AND status = '已缴'`
    ).bind(m).first()
    feesTrend.push({
      month: m,
      total: (total as any)?.total || 0,
      paid: (paid as any)?.total || 0
    })
  }

  return c.json({
    data: {
      buildings: (buildingCount as any)?.count || 0,
      units: {
        total: (unitTotal as any)?.count || 0,
        occupied: (unitOccupied as any)?.count || 0
      },
      owners: (ownerCount as any)?.count || 0,
      bills: {
        total: (billTotal as any)?.total || 0,
        paid: (billPaid as any)?.total || 0,
        collection_rate: (billTotal as any)?.total > 0
          ? (((billPaid as any)?.total / (billTotal as any)?.total) * 100).toFixed(1)
          : '0.0'
      },
      repairs: {
        pending: (repairPending as any)?.count || 0,
        processing: (repairProcessing as any)?.count || 0
      },
      recentRepairs: recentRepairs.results,
      recentNotices: recentNotices.results,
      feesTrend
    }
  })
})

export default app
