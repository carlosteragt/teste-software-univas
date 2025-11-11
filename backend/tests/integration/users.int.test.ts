import { describe, it, beforeEach, afterAll, expect } from 'vitest'
import request from 'supertest'
import app, { prisma as appPrisma } from '../../src/index'
import { prisma, resetDb } from './testDb'

describe('Users API', () => {
    afterAll(async () => {
        await prisma.$disconnect()
        await appPrisma.$disconnect()
    })
    beforeEach(async () => {
        await resetDb()
    })

    it('POST /api/users cria usuário válido', async () => {
        const res = await request(app)
            .post('/api/users')
            .send({ name: 'Ana', email: 'ana@ex.com' })
        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({ name: 'Ana', email: 'ana@ex.com' })
    })

    it('GET /api/users lista usuários', async () => {
        await prisma.user.create({ data: { name: 'Ana', email: 'ana@ex.com' } })
        const res = await request(app).get('/api/users')
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.data)).toBe(true)
        expect(res.body.data.some((u: any) => u.email === 'ana@ex.com')).toBe(true)
    })

    it('PUT /api/users/:id atualiza usuário', async () => {
        const user = await prisma.user.create({ data: { name: 'Carlos', email: 'carlos@ex.com' } })
        const res = await request(app)
            .put(`/api/users/${user.id}`)
            .send({ name: 'Carlos Silva' })
        if (!([200, 204].includes(res.status))) {
            console.error('PUT /api/users resposta inesperada:', res.status, res.body)
        }
        expect([200, 204]).toContain(res.status)
        if (res.body && res.body.data) {
            expect(res.body.data).toMatchObject({ id: user.id, name: 'Carlos Silva', email: 'carlos@ex.com' })
        } else {
            const updated = await prisma.user.findUnique({ where: { id: user.id } })
            expect(updated?.name).toBe('Carlos Silva')
        }
    })

    it('DELETE /api/users/:id exclui usuário', async () => {
        const user = await prisma.user.create({ data: { name: 'João', email: 'joao@ex.com' } })
        const res = await request(app).delete(`/api/users/${user.id}`)
        expect([200, 204]).toContain(res.status)
        const found = await prisma.user.findUnique({ where: { id: user.id } })
        expect(found).toBeNull()
    })
})