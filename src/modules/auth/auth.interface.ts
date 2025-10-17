export interface ILoginResponse {
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    organizationId?: string;
    isOrganizationOwner: boolean;
    isOrganizationAdmin: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshTokenResponse {
  accessToken: string;
}
