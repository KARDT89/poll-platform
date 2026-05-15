import axios from "axios"
import { tokenStore } from "./tokenStore"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    // prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = res.data.accessToken

        sessionStorage.setItem("accessToken", newAccessToken)

        // update failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        // retry original request
        return api(originalRequest)
      } catch (refreshError) {
        sessionStorage.removeItem("accessToken")

        // redirect to login
        window.location.href = "/login"

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
