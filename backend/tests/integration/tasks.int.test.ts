import { describe, it, afterAll, beforeEach, expect } from 'vitest'
import request from 'supertest'
import app, { prisma as appPrisma } from '../../src/index'
import { resetDb } from './testDb'

describe('Tasks API', () => {
  afterAll(async () => {
    await appPrisma.$disconnect()
  })

  beforeEach(async () => {
    await resetDb()
  })

  async function setupEntities() {
    const userRes = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: `test-${Date.now()}@example.com` })
    expect([200, 201]).toContain(userRes.status)

    const catRes = await request(app)
      .post('/api/categories')
      .send({ name: `Test Category ${Date.now()}` })
    expect([200, 201]).toContain(catRes.status)

    return { userId: userRes.body.data.id, categoryId: catRes.body.data.id }
  }

  it('POST /api/tasks cria tarefa válida', async () => {
    const { userId, categoryId } = await setupEntities()
    const payload = {
      title: 'Tarefa 1',
      description: 'Descrição',
      userId,
      categoryId,
      status: 'PENDING',
      priority: 'MEDIUM'
    }
    const res = await request(app).post('/api/tasks').send(payload)

    if (![200, 201].includes(res.status)) {
      console.error('POST /api/tasks ->', res.status, res.body)
    }
    expect([200, 201]).toContain(res.status)
    expect(res.body.data).toMatchObject({
      title: 'Tarefa 1',
      userId,
      categoryId,
      status: 'PENDING',
      priority: 'MEDIUM'
    })
  })

  it('GET /api/tasks lista todas as tarefas', async () => {
    const { userId, categoryId } = await setupEntities()
    await request(app).post('/api/tasks').send({ title: 'Tarefa 1', description: 'Desc 1', userId, categoryId })

    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.some((t: any) => t.title === 'Tarefa 1')).toBe(true)
  })

  it('GET /api/tasks/:id retorna tarefa por ID', async () => {
    const { userId, categoryId } = await setupEntities()
    const created = await request(app).post('/api/tasks').send({ title: 'Tarefa 2', description: 'Desc 2', userId, categoryId })
    expect([200, 201]).toContain(created.status)
    const id = created.body.data.id

    const res = await request(app).get(`/api/tasks/${id}`)
    expect([200, 304]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.data).toMatchObject({ id, title: 'Tarefa 2' })
    }
  })

  it('PUT /api/tasks/:id atualiza tarefa (total)', async () => {
    const { userId, categoryId } = await setupEntities()
    const created = await request(app).post('/api/tasks').send({ title: 'Tarefa 3', description: 'Desc 3', userId, categoryId })
    expect([200, 201]).toContain(created.status)
    const id = created.body.data.id

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .send({
        title: 'Tarefa 3 Atualizada',
        description: 'Desc atualizada',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        userId,
        categoryId
      })

    expect([200, 204]).toContain(res.status)

    const check = await request(app).get(`/api/tasks/${id}`)
    expect([200, 304]).toContain(check.status)
    if (check.status === 200) {
      expect(check.body.data.title).toBe('Tarefa 3 Atualizada')
      expect(check.body.data.description).toBe('Desc atualizada')
      expect(check.body.data.status).toBe('IN_PROGRESS')
      expect(check.body.data.priority).toBe('HIGH')
    }
  })

  it('PATCH /api/tasks/:id atualiza parcialmente', async () => {
    const { userId, categoryId } = await setupEntities()
    const created = await request(app).post('/api/tasks').send({ title: 'Tarefa 3b', description: 'Desc 3b', userId, categoryId })
    expect([200, 201]).toContain(created.status)
    const id = created.body.data.id

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ description: 'Parcial alterada', status: 'COMPLETED', priority: 'LOW' })

    expect([200, 204]).toContain(res.status)

    const check = await request(app).get(`/api/tasks/${id}`)
    expect([200, 304]).toContain(check.status)
    if (check.status === 200) {
      expect(check.body.data.description).toBe('Parcial alterada')
      expect(check.body.data.status).toBe('COMPLETED')
      expect(check.body.data.priority).toBe('LOW')
    }
  })

  it('DELETE /api/tasks/:id exclui tarefa', async () => {
    const { userId, categoryId } = await setupEntities()
    const created = await request(app).post('/api/tasks').send({ title: 'Tarefa 4', description: 'Desc 4', userId, categoryId })
    expect([200, 201]).toContain(created.status)
    const id = created.body.data.id

    const del = await request(app).delete(`/api/tasks/${id}`)
    expect([200, 204]).toContain(del.status)

    const after = await request(app).get(`/api/tasks/${id}`)
    expect([404, 400]).toContain(after.status)
  })

  it('GET /api/tasks/:id retorna 404/400 para ID inexistente', async () => {
    await setupEntities()
    const res = await request(app).get('/api/tasks/ck_deadbeef_deadbeef_deadbeef')
    expect([404, 400]).toContain(res.status)
  })

  it('POST /api/tasks falha quando title ausente', async () => {
    const { userId, categoryId } = await setupEntities()
    const res = await request(app).post('/api/tasks').send({ description: 'Sem título', userId, categoryId })
    expect([400, 422]).toContain(res.status)
  })

  it('POST /api/tasks rejeita enums inválidos', async () => {
    const { userId, categoryId } = await setupEntities()
    const res = await request(app).post('/api/tasks').send({
      title: 'Enum inválido',
      status: 'NOT_A_STATUS',
      priority: 'NOT_A_PRIORITY',
      userId,
      categoryId
    })
    expect([400, 422]).toContain(res.status)
  })
})