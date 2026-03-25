import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 获取报修列表
app.get('/', async (c) => {
  const status = c.req.query('status')
  const priority = c.req.query('priority')

  let sql = `SELECT r.*, u.unit_number, b.name as building_name, o.name as owner_name
             FROM repairs r
             LEFT JOIN units u ON r.unit_id = u.id
             LEFT JOIN buildings b ON u.building_id = b.id
             LEFT JOIN owners o ON r.owner_id = o.id
             WHERE 1=1`
  const params: any[] = []

  if (status) { sql += ' AND r.status = ?'; params.push(status) }
  if (priority) { sql += ' AND r.priority = ?'; params.push(priority) }
  sql += ' ORDER BY r.created_at DESC'

  const stmt = params.length > 0 
    ? c.env.DB.prepare(sql).bind(...params)
    : c.env.DB.prepare(sql)
  const { results } = await stmt.all()
  return c.json({ data: results })
})

// 获取报修统计
app.get('/stats', async (c) => {
  const pending = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM repairs WHERE status = '待处理'`
  ).first()
  const processing = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM repairs WHERE status = '处理中'`
  ).first()
  const completed = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM repairs WHERE status = '已完成'`
  ).first()
  const urgent = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM repairs WHERE priority = '紧急' AND status != '已完成'`
  ).first()

  return c.json({ data: { pending, processing, completed, urgent } })
})

// 获取单个报修
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    `SELECT r.*, u.unit_number, b.name as building_name, o.name as owner_name, o.phone as owner_phone
     FROM repairs r
     LEFT JOIN units u ON r.unit_id = u.id
     LEFT JOIN buildings b ON u.building_id = b.id
     LEFT JOIN owners o ON r.owner_id = o.id
     WHERE r.id = ?`
  ).bind(id).first()
  if (!result) return c.json({ error: '报修记录不存在' }, 404)
  return c.json({ data: result })
})

// 创建报修
app.post('/', async (c) => {
  const body = await c.req.json()
  const { unit_id, owner_id, title, description, category, priority } = body
  if (!title) return c.json({ error: '报修标题不能为空' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO repairs (unit_id, owner_id, title, description, category, priority) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(unit_id || null, owner_id || null, title, description || '', category || '公共设施', priority || '普通').run()

  return c.json({ data: { id: result.meta.last_row_id, ...body } }, 201)
})

// 更新报修
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { title, description, category, priority, status, assigned_to } = body

  let sql = 'UPDATE repairs SET title = ?, description = ?, category = ?, priority = ?, status = ?, assigned_to = ?'
  const params: any[] = [title, description, category, priority, status, assigned_to]

  if (status === '已完成') {
    sql += ', resolved_at = ?'
    params.push(new Date().toISOString())
  }
  sql += ' WHERE id = ?'
  params.push(id)

  await c.env.DB.prepare(sql).bind(...params).run()
  return c.json({ data: { id: Number(id), ...body } })
})

// 删除报修
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM repairs WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

export default app
