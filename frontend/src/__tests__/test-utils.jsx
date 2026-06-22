import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { ToastProvider } from "../components/Toast"

function AllProviders({ children, initialEntries }) {
  return (
    <MemoryRouter initialEntries={initialEntries || ["/"]}>
      <ToastProvider>{children}</ToastProvider>
    </MemoryRouter>
  )
}

function customRender(ui, options = {}) {
  const { initialEntries, ...renderOptions } = options
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>{children}</AllProviders>
    ),
    ...renderOptions,
  })
}

export * from "@testing-library/react"
export { customRender as render }
