export interface UserLoginBasic {
  username: string
  password: string
  repassword?: string
  email?: string
  remember?: boolean
}

export interface UserInfo {
  token: string
  user: User
}

export interface User {
    avatar:     string
    created_at: number
    email:      string
    id:         number
    nickname:   string
    username:   string
}