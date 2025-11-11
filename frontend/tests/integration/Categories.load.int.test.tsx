import { render, screen, waitFor } from '@testing-library/react'
import Categories from '../../src/components/Categories'
import { server, apiGet, json } from '../setup'

describe('carga de lista', () => {
  it('renderiza categorias retornadas pela API', async () => {
    server.use(
      apiGet('/categories', (_req) =>
        json({
          data: [
            {
              id: '1',
              name: 'Casa',
              description: 'Limpar o quarto',
              createdAt: new Date().toISOString(),
              tasks: []
            }
          ]
        })
      )
    )

    render(<Categories />)

    await waitFor(() => {
      expect(screen.getByText('Casa')).toBeInTheDocument()
      expect(screen.getByText(/Adicionar Categoria/i)).toBeInTheDocument()
    })
  })
})