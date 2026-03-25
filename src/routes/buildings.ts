import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 获取所有楼栋
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM buildings ORDER BY name'
  ).all()
  return c.json({ data: results })
})

// 获取单个楼栋
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM buildings WHERE id = ?'
  ).bind(id).first()
  if (!result) return c.json({ error: '楼栋不存在' }, 404)
  return c.json({ data: result })
})

// 创建楼栋
app.post('/', async (c) => {
  const body = await c.req.json()
  const { name, address, floors, units_per_floor } = body
  if (!name) return c.json({ error: '楼栋名称不能为空' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO buildings (name, address, floors, units_per_floor) VALUES (?, ?, ?, ?)'
  ).bind(name, address || '', floors || 1, units_per_floor || 4).run()

  return c.json({ data: { id: result.meta.last_row_id, ...body } }, 201)
})

// 更新楼栋
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, address, floors, units_per_floor } = body

  await c.env.DB.prepare(
    'UPDATE buildings SET name = ?, address = ?, floors = ?, units_per_floor = ? WHERE id = ?'
  ).bind(name, address, floors, units_per_floor, id).run()

  return c.json({ data: { id: Number(id), ...body } })
})

// 删除楼栋
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM buildings WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

export default app
