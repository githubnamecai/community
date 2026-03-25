import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

// 获取公告列表
app.get('/', async (c) => {
  const status = c.req.query('status')
  const category = c.req.query('category')

  let sql = 'SELECT * FROM notices WHERE 1=1'
  const params: any[] = []

  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (category) { sql += ' AND category = ?'; params.push(category) }
  sql += ' ORDER BY is_top DESC, publish_date DESC'

  const stmt = params.length > 0 
    ? c.env.DB.prepare(sql).bind(...params)
    : c.env.DB.prepare(sql)
  const { results } = await stmt.all()
  return c.json({ data: results })
})

// 获取单个公告
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM notices WHERE id = ?'
  ).bind(id).first()
  if (!result) return c.json({ error: '公告不存在' }, 404)
  return c.json({ data: result })
})

// 创建公告
app.post('/', async (c) => {
  const body = await c.req.json()
  const { title, content, category, is_top, status, publish_date } = body
  if (!title || !content) return c.json({ error: '标题和内容不能为空' }, 400)

  const result = await c.env.DB.prepare(
    'INSERT INTO notices (title, content, category, is_top, status, publish_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(title, content, category || '通知', is_top || 0, status || '已发布', publish_date || new Date().toISOString().slice(0, 10)).run()

  return c.json({ data: { id: result.meta.last_row_id, ...body } }, 201)
})

// 更新公告
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { title, content, category, is_top, status, publish_date } = body

  await c.env.DB.prepare(
    'UPDATE notices SET title = ?, content = ?, category = ?, is_top = ?, status = ?, publish_date = ? WHERE id = ?'
  ).bind(title, content, category, is_top, status, publish_date, id).run()

  return c.json({ data: { id: Number(id), ...body } })
})

// 删除公告
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run()
  return c.json({ message: '删除成功' })
})

export default app
