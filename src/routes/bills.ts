import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 获取费用类型列表
app.get('/fee-types', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM fee_types ORDER BY id').all()
  return c.json({ data: results })
})

// 获取账单列表
app.get('/', async (c) => {
  const status = c.req.query('status')
  const month = c.req.query('month')
  const unit_id = c.req.query('unit_id')

  let sql = `SELECT bi.*, u.unit_number, b.name as building_name, o.name as owner_name, ft.name as fee_type_name
             FROM bills bi
             LEFT JOIN units u ON bi.unit_id = u.id
             LEFT JOIN buildings b ON u.building_id = b.id
             LEFT JOIN owners o ON bi.owner_id = o.id
             LEFT JOIN fee_types ft ON bi.fee_type_id = ft.id
             WHERE 1=1`
  const params: any[] = []

  if (status) { sql += ' AND bi.status = ?'; params.push(status) }
  if (month) { sql += ' AND bi.bill_month = ?'; params.push(month) }
  if (unit_id) { sql += ' AND bi.unit_id = ?'; params.push(unit_id) }
  sql += ' ORDER BY bi.created_at DESC'

  const stmt = params.length > 0 
    ? c.env.DB.prepare(sql).bind(...params)
    : c.env.DB.prepare(sql)
  const { results } = await stmt.all()
  return c.json({ data: results })
})

// 获取账单统计
app.get('/stats', async (c) => {
  const month = c.req.query('month') || new Date().toISOString().slice(0, 7)
  
  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ?'
  ).bind(month).first()

  const paid = await c.env.DB.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ? AND status = '已缴'`
  ).bind(month).first()

  const unpaid = await c.env.DB.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ? AND status = '未缴'`
  ).bind(month).first()

  const overdue = await c.env.DB.prepare(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills WHERE bill_month = ? AND status = '逾期'`
  ).bind(month).first()

  return c.json({ data: { month, total, paid, unpaid, overdue } })
})

// 创建账单
app.post('/', async (c) => {
  const body = await c.req.json()
  const { unit_id, owner_id, fee_type_id, amount, bill_month, status } = body
  if (!unit_id || !fee_type_id || !amount || !bill_month) {
    return c.json({ error: '必填字段不完整' }, 400)
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO bills (unit_id, owner_id, fee_type_id, amount, bill_month, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(unit_id, owner_id || null, fee_type_id, amount, bill_month, status || '未缴').run()

  return c.json({ data: { id: result.meta.last_row_id, ...body } }, 201)
})

// 缴费
app.post('/:id/pay', async (c) => {
  const id = c.req.param('id')
  const now = new Date().toISOString()
  
  await c.env.DB.prepare(
    `UPDATE bills SET status = '已缴', paid_at = ? WHERE id = ?`
  ).bind(now, id).run()

  return c.json({ message: '缴费成功' })
})

// 更新账单
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { unit_id, owner_id, fee_type_id, amount, bill_month, status } = body

  await c.env.DB.prepare(
    'UPDATE bills SET unit_id = ?, owner_id = ?, fee_type_id = ?, amount = ?, bill_month = ?, status = ? WHERE id = ?'
  ).bind(unit_id, owner_id, fee_type_id, amount, bill_month, status, id).run()

  return c.json({ data: { id: Number(id), ...body } })
})

// 删除账单
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM bills WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

export default app
