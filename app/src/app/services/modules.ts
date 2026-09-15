import { api, toApiError } from './api';
import {
  JobDetailSchema,
  JobsListSchema,
  LoginResponseSchema,
  AuthMeSchema,
  ApplyResponseSchema,
  FavoriteResponseSchema,
  ApplicationsListSchema,
  FavoritesListSchema,
  type Job,
  type Pagination,
  type SortOption,
} from '../types/api';

export type JobsQuery = {
  q?: string;
  city?: string;
  salary_min?: number;
  salary_max?: number;
  sort?: SortOption;
  page?: number;
  limit?: number;
};

export type JobsResult = {
  items: Job[];
  pagination: Pagination;
};

export const jobsService = {
  async list(query: JobsQuery = {}): Promise<JobsResult> {
    try {
      const res = await api.get('/jobs', { params: query });
      const parsed = JobsListSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid /jobs response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async getById(id: string): Promise<Job> {
    try {
      const res = await api.get(`/jobs/${encodeURIComponent(id)}`);
      const parsed = JobDetailSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid /jobs/:id response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },
};

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    try {
      const res = await api.post('/auth/login', { email, password });
      const parsed = LoginResponseSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid /auth/login response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      throw toApiError(err);
    }
  },

  async me(): Promise<{ id: string; email: string; name: string }> {
    try {
      const res = await api.get('/auth/me');
      const parsed = AuthMeSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid /auth/me response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },
};

export const actionsService = {
  async apply(jobId: string): Promise<{ jobId: string; applied: boolean }> {
    try {
      const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/apply`);
      const parsed = ApplyResponseSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid apply response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async unapply(jobId: string): Promise<{ jobId: string; applied: boolean }> {
    try {
      const res = await api.delete(`/jobs/${encodeURIComponent(jobId)}/apply`);
      const parsed = ApplyResponseSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid unapply response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async favorite(jobId: string): Promise<{ jobId: string; favorited: boolean }> {
    try {
      const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/favorite`);
      const parsed = FavoriteResponseSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid favorite response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async unfavorite(jobId: string): Promise<{ jobId: string; favorited: boolean }> {
    try {
      const res = await api.delete(`/jobs/${encodeURIComponent(jobId)}/favorite`);
      const parsed = FavoriteResponseSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid unfavorite response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async applications(): Promise<{ items: Job[]; total: number }> {
    try {
      const res = await api.get('/applications');
      const parsed = ApplicationsListSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid applications response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },

  async favorites(): Promise<{ items: Job[]; total: number }> {
    try {
      const res = await api.get('/favorites');
      const parsed = FavoritesListSchema.safeParse(res.data);
      if (!parsed.success) throw toApiError(new Error('Invalid favorites response'));
      return parsed.data.data;
    } catch (err) {
      throw toApiError(err);
    }
  },
};
