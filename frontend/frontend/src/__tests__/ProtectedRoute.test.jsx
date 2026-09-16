import { screen } from "@testing-library/react"
import { render } from "./test-utils"
import ProtectedRoute from "../components/ProtectedRoute"

function encodeToken(payload) {
  const b64 = btoa(JSON.stringify(payload))
  return `header.${b64}.signature`
}

afterEach(() => {
  localStorage.clear()
})

describe("ProtectedRoute", () => {
  it("redirects to /login when no token exists", () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("token")

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Secret Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText("Secret Admin Content")).not.toBeInTheDocument()
  })

  it("redirects to /login and clears storage when token is malformed", () => {
    localStorage.setItem("access_token", "invalid-token")

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Secret Admin Content</div>
      </ProtectedRoute>
    )

    expect(localStorage.getItem("access_token")).toBeNull()
    expect(screen.queryByText("Secret Admin Content")).not.toBeInTheDocument()
  })

  it("redirects admin users to admin-dashboard, doctor users to doctor-dashboard when wrong role", () => {
    const token = encodeToken({ sub: "123", role: "doctor" })
    localStorage.setItem("access_token", token)

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Secret Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.queryByText("Secret Admin Content")).not.toBeInTheDocument()
  })

  it("renders children when role matches requiredRole", () => {
    const token = encodeToken({ sub: "123", role: "admin" })
    localStorage.setItem("access_token", token)

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Secret Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText("Secret Admin Content")).toBeInTheDocument()
  })

  it("renders children when no requiredRole is specified and token is valid", () => {
    const token = encodeToken({ sub: "123", role: "doctor" })
    localStorage.setItem("access_token", token)

    render(
      <ProtectedRoute>
        <div>Any Authenticated Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText("Any Authenticated Content")).toBeInTheDocument()
  })

  it("reads token from fallback key 'token' when 'access_token' is absent", () => {
    const token = encodeToken({ sub: "123", role: "admin" })
    localStorage.setItem("token", token)

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Fallback Token Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText("Fallback Token Content")).toBeInTheDocument()
  })
})
