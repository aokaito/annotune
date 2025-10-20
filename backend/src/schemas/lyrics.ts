import { z } from 'zod';

export const annotationPropsSchema = z
  .object({
    intensity: z.enum(['low', 'medium', 'high']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional()
  })
  .catchall(z.unknown())
  .optional();

export const createLyricSchema = z.object({
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(20000)
});

export const updateLyricSchema = z.object({
  title: z.string().min(1).max(200),
  text: z.string().min(1).max(20000),
  version: z.number().int().positive()
});

export const annotationSchema = z
  .object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive(),
    tag: z.string().min(1).max(50),
    comment: z.string().max(500).optional(),
    props: annotationPropsSchema
  })
  .refine((data) => data.end > data.start, {
    message: 'end must be greater than start',
    path: ['end']
  });

export const shareSchema = z.object({
  isPublicView: z.boolean()
});
