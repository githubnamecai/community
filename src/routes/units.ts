import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 获取所有房屋（含楼栋信息）
app.get('/', async (c) => {
  const building_id = c.req.query('building_id')
  const status = c.req.query('status')

  let sql = `SELECT u.*, b.name as building_name 
             FROM units u LEFT JOIN buildings b ON u.building_id = b.id WHERE 1=1`
  const params: any[] = []

  if (building_id) { sql += ' AND u.building_id = ?'; params.push(building_id) }
  if (status) { sql += ' AND u.status = ?'; params.push(status) }
  sql += ' ORDER BY u.building_id, u.unit_number'

  const stmt = params.length > 0 
    ? c.env.DB.prepare(sql).bind(...params) 
    : c.env.DB.prepare(sql)
  const { results } = await stmt.all()
  return c.json({ data: results })
})

// 获取单个房屋
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    `SELECT u.*, b.name as building_name 
     FROM units u LEFT JOIN buildings b ON u.building_id = b.id 
     WHERE u.id = ?`
  ).bind(id).first()
  if (!result) return c.json({ error: '房屋不存在' }, 404)
  return c.json({ data: result })
})

// 创建房屋
app.post('/', async (c) => {
  const body = await c.req.json()
  const { building_id, unit_number, floor, area, unit_type, status } = body
  if (!building_id || !unit_number) return c.json({ error: '楼栋和房号不能为空' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO units (building_id, unit_number, floor, area, unit_type, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(building_id, unit_number, floor || 1, area || 0, unit_type || '住宅', status || '空置').run()

  return c.json({ data: { id: result.meta.last_row_id, ...body } }, 201)
})

// 更新房屋
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { building_id, unit_number, floor, area, unit_type, status } = body

  await c.env.DB.prepare(
    'UPDATE units SET building_id = ?, unit_number = ?, floor = ?, area = ?, unit_type = ?, status = ? WHERE id = ?'
  ).bind(building_id, unit_number, floor, area, unit_type, status, id).run()

  return c.json({ data: { id: Number(id), ...body } })
})

// 删除房屋
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM units WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

export default app
