import { describe, expect, it } from 'vitest';
import { annotationSchema, createLyricSchema } from '../schemas/lyrics';

describe('annotationSchema', () => {
  it('accepts valid payloads', () => {
    const payload = {
      start: 2,
      end: 5,
      tag: 'vibrato',
      comment: 'Smooth',
      props: {
        intensity: 'medium'
      }
    };
    expect(() => annotationSchema.parse(payload)).not.toThrow();
  });

  it('rejects invalid ranges', () => {
    const payload = {
      start: 10,
      end: 3,
      tag: 'vibrato'
    };
    expect(() => annotationSchema.parse(payload)).toThrow();
  });
});

describe('createLyricSchema', () => {
  it('requires title and text', () => {
    expect(() => createLyricSchema.parse({ title: '', text: '' })).toThrow();
  });
});
