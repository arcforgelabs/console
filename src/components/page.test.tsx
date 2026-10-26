import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { ApiError } from '@/lib/api'
import { QueryView } from './page'

const base = { data: undefined, isPending: false, error: null }

describe('QueryView', () => {
  it('says a page is not connected yet on 404', async () => {
    const { getByText } = await render(
      <QueryView query={{ ...base, error: new ApiError(404) }} what='Usage'>
        {() => 'never'}
      </QueryView>
    )
    await expect
      .element(getByText('Usage is not connected yet.', { exact: false }))
      .toBeInTheDocument()
  })

  it('shows an alert on other errors', async () => {
    const { getByRole } = await render(
      <QueryView query={{ ...base, error: new ApiError(500) }} what='Usage'>
        {() => 'never'}
      </QueryView>
    )
    await expect.element(getByRole('alert')).toHaveTextContent('did not load')
  })

  it('renders the data', async () => {
    const { getByText } = await render(
      <QueryView query={{ ...base, data: 3 }} what='Usage'>
        {(n) => `count ${n}`}
      </QueryView>
    )
    await expect.element(getByText('count 3')).toBeInTheDocument()
  })
})
