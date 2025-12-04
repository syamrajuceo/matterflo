export interface IUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  companyId: string | null;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IAuthResponse {
  token: string;
  user: IUser;
}

