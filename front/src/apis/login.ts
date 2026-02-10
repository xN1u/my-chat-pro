import type { UserInfo, UserLoginBasic } from "@/types/User"
import http from "@/utils/http"

export const registerApi = (data: UserLoginBasic) => {
  return http({
    url: "/auth/register",
    method: "POST",
    data
  }) as Promise<UserInfo>
}

export const loginApi = (data: UserLoginBasic) => {
  return http({
    url: "/auth/login",
    method: "POST",
    data
  }) as Promise<UserInfo>
}