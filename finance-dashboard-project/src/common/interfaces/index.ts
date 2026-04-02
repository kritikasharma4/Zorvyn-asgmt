export interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
