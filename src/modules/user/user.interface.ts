export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Director';
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserWithoutPassword = Omit<IUser, 'password'>;

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserCreate {
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Director';
}

export interface IUserUpdate {
  name?: string;
  role?: 'Admin' | 'Manager' | 'Director';
  isActive?: boolean;
}
