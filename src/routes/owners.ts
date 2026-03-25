import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 获取所有业主（含房屋信息）
app.get('/', async (c) => {
  const status = c.req.query('status')
  const keyword = c.req.query('keyword')

  let sql = `SELECT o.*, u.unit_number, b.name as building_name 
             FROM owners o 
             LEFT JOIN units u ON o.unit_id = u.id 
             LEFT JOIN buildings b ON u.building_id = b.id 
             WHERE 1=1`
  const params: any[] = []

  if (status) { sql += ' AND o.status = ?'; params.push(status) }
  if (keyword) { sql += ' AND (o.name LIKE ? OR o.phone LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
  sql += ' ORDER BY o.created_at DESC'

  const stmt = params.length > 0 
    ? c.env.DB.prepare(sql).bind(...params) 
    : c.env.DB.prepare(sql)
  const { results } = await stmt.all()
  return c.json({ data: results })
})

// 获取单个业主
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    `SELECT o.*, u.unit_number, b.name as building_name
     FROM owners o 
     LEFT JOIN units u ON o.unit_id = u.id 
     LEFT JOIN buildings b ON u.building_id = b.id 
     WHERE o.id = ?`
  ).bind(id).first()
  if (!result) return c.json({ error: '业主不存在' }, 404)
  return c.json({ data: result })
})

// 创建业主
app.post('/', async (c) => {
  const body = await c.req.json()
  const { name, phone, id_card, unit_id, move_in_date, status } = body
  if (!name) return c.json({ error: '业主姓名不能为空' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO owners (name, phone, id_card, unit_id, move_in_date, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(name, phone || '', id_card || '', unit_id || null, move_in_date || '', status || '在住').run()

  // 如果关联了房屋，更新房屋状态
  if (unit_id) {
    await c.env.DB.prepare('UPDATE units SET status = ? WHERE id = ?').bind('已入住', unit_id).run()
  }

  return c.json({ data: { id: result.meta.last_row_id, ...body } }, 201)
})

// 更新业主
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, phone, id_card, unit_id, move_in_date, status } = body

  await c.env.DB.prepare(
    'UPDATE owners SET name = ?, phone = ?, id_card = ?, unit_id = ?, move_in_date = ?, status = ? WHERE id = ?'
  ).bind(name, phone, id_card, unit_id, move_in_date, status, id).run()

  return c.json({ data: { id: Number(id), ...body } })
})

// 删除业主
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM owners WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

export default app
