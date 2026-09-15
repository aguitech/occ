import { z } from 'zod';

// Envelope estándar
export const EnvelopeOkSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data });

export const ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const EnvelopeErrSchema = z.object({
  ok: z.literal(false),
  error: ErrorBodySchema,
});

// Schemas de dominio
export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  city: z.string(),
  salary: z.number().int().nullable(),
  description: z.string(),
  publishedAt: z.string(),
  tags: z.array(z.string()),
});
export type Job = z.infer<typeof JobSchema>;

export const PaginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNext: z.boolean(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const JobsListSchema = EnvelopeOkSchema(
  z.object({
    items: z.array(JobSchema),
    pagination: PaginationSchema,
  })
);
export type JobsList = z.infer<typeof JobsListSchema>;

export const JobDetailSchema = EnvelopeOkSchema(JobSchema);
export type JobDetail = z.infer<typeof JobDetailSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const LoginResponseSchema = EnvelopeOkSchema(
  z.object({ token: z.string(), user: UserSchema })
);
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const AuthMeSchema = EnvelopeOkSchema(UserSchema);
export type AuthMe = z.infer<typeof AuthMeSchema>;

export const ApplyResponseSchema = EnvelopeOkSchema(
  z.object({ jobId: z.string(), applied: z.boolean() })
);

export const FavoriteResponseSchema = EnvelopeOkSchema(
  z.object({ jobId: z.string(), favorited: z.boolean() })
);

export const ApplicationsListSchema = EnvelopeOkSchema(
  z.object({ items: z.array(JobSchema), total: z.number() })
);

export const FavoritesListSchema = EnvelopeOkSchema(
  z.object({ items: z.array(JobSchema), total: z.number() })
);

// Sort options
export const SORT_OPTIONS = ['date_desc', 'date_asc', 'salary_desc', 'salary_asc', 'relevance'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// Cities disponibles (extraídas del backend en runtime idealmente)
export const CITIES = [
  'Ciudad de México',
  'Monterrey',
  'Guadalajara',
  'Querétaro',
  'Puebla',
  'Remoto',
] as const;
