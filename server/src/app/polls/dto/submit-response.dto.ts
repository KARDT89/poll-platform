import { z } from 'zod';
import BaseDto from '../../dto/base.dto.js';

const SubmitResponseSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      optionId: z.string(),
    })
  ).min(1),
});

export class SubmitResponseDto extends BaseDto {
  static schema = SubmitResponseSchema;
}

export type SubmitResponseInput = z.infer<typeof SubmitResponseSchema>;