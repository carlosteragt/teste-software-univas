import { test, expect } from '@playwright/test'
test.describe('Usuários', () => {

    test('navega para Usuários e lista itens do backend', async ({ page }) => {
        await page.goto('/') // Dashboard
        await page.getByRole('link', { name: 'Usuários' }).click()
        // Título da seção
        await expect(page.getByRole('heading', { name: /Usuários/i })).toBeVisible()
        // Emails semeados (seed do backend)
        await expect(page.getByText(/john.doe@example.com/i)).toBeVisible()
        await expect(page.getByText(/jane.smith@example.com/i)).toBeVisible()
    });
    test('cria usuário e aparece na lista', async ({ page }) => {
        await page.goto('/users')
        await page.getByRole('button', { name: /Adicionar Usuário/i }).click()
        const uniqueEmail = `aluno.${Date.now()}@ex.com`
        await page.getByLabel('Nome:').fill('Aluno E2E')
        await page.getByLabel('Email:').fill(uniqueEmail)
        await page.getByRole('button', { name: /Criar/i }).click()
        // Aguarda recarga da lista
        await expect(page.getByText(uniqueEmail)).toBeVisible()
    });
    test('exclui usuário criado e não aparece mais na lista', async ({ page }) => {
        await page.goto('/users')

        await page.getByRole('button', { name: /Adicionar Usuário/i }).click()
        const emailToDelete = `del.${Date.now()}@ex.com`
        await page.getByLabel('Nome:').fill('Excluir E2E')
        await page.getByLabel('Email:').fill(emailToDelete)
        await page.getByRole('button', { name: /Criar/i }).click()
        await expect(page.getByText(emailToDelete)).toBeVisible()

        page.on('dialog', dialog => dialog.accept())

        const createdRow = page.locator('tr', { hasText: emailToDelete })
        await createdRow.getByRole('button', { name: /Excluir/i }).click()

        await expect(page.getByText(emailToDelete)).not.toBeVisible()
    })

});
