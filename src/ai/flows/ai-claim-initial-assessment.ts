'use server';
/**
 * @fileOverview This file implements a Genkit flow for initial AI assessment of golf course insurance claims.
 *
 * - aiClaimInitialAssessment - A function that handles the initial AI assessment of a claim.
 * - AiClaimInitialAssessmentInput - The input type for the aiClaimInitialAssessment function.
 * - AiClaimInitialAssessmentOutput - The return type for the aiClaimInitialAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiClaimInitialAssessmentInputSchema = z.object({
  photos: z
    .array(
      z
        .string()
        .describe(
          "A photo related to the claim, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
    )
    .min(1, 'At least one photo is required.')
    .describe('An array of photos related to the claim.'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters.')
    .describe('A free-text description of the claim, maximum 1000 characters.'),
});
export type AiClaimInitialAssessmentInput = z.infer<
  typeof AiClaimInitialAssessmentInputSchema
>;

const ClaimCategorySchema = z.enum([
  'RC',
  'meteorològic',
  'maquinària',
  'accident personal',
  'ciberincident',
  'altres',
]);

const AiClaimInitialAssessmentOutputSchema = z.object({
  damageSummary: z
    .string()
    .describe(
      'A concise summary of the damage indicators identified from the photos and description.'
    ),
  keyEntities: z
    .array(z.string())
    .describe(
      'A list of key entities or objects mentioned in the description or visible in the photos that are relevant to the claim (e.g., "golf cart", "fallen tree", "damaged green").'
    ),
  suggestedClaimCategory: ClaimCategorySchema.describe(
    'The most suitable claim category based on the analysis of the provided information. Choose from: RC, meteorològic, maquinària, accident personal, ciberincident, altres.'
  ),
});
export type AiClaimInitialAssessmentOutput = z.infer<
  typeof AiClaimInitialAssessmentOutputSchema
>;

export async function aiClaimInitialAssessment(
  input: AiClaimInitialAssessmentInput
): Promise<AiClaimInitialAssessmentOutput> {
  return aiClaimInitialAssessmentFlow(input);
}

const aiClaimInitialAssessmentPrompt = ai.definePrompt({
  name: 'aiClaimInitialAssessmentPrompt',
  input: {schema: AiClaimInitialAssessmentInputSchema},
  output: {schema: AiClaimInitialAssessmentOutputSchema},
  prompt: `You are an expert AI assistant for Green Cover, specializing in initial assessment of golf course insurance claims.
Your task is to analyze the provided photos and description to generate an initial summary of damage indicators, extract key entities, and suggest the most appropriate claim category.

Follow these steps:
1.  **Damage Summary**: Provide a concise summary of the damage visible in the photos and described in the text. Highlight the main types of damage and affected areas.
2.  **Key Entities**: Identify and list key objects, elements, or persons involved in the claim from the description and photos.
3.  **Suggested Claim Category**: Based on your analysis, suggest one of the following claim categories: 'RC', 'meteorològic', 'maquinària', 'accident personal', 'ciberincident', 'altres'.

---
Claim Description: {{{description}}}

Photos:
{{#each photos}}
  {{media url=this}}
{{/each}}
---

Your response must be a JSON object conforming to the following schema, including the 'damageSummary', 'keyEntities', and 'suggestedClaimCategory' fields.
`,
});

const aiClaimInitialAssessmentFlow = ai.defineFlow(
  {
    name: 'aiClaimInitialAssessmentFlow',
    inputSchema: AiClaimInitialAssessmentInputSchema,
    outputSchema: AiClaimInitialAssessmentOutputSchema,
  },
  async input => {
    const {output} = await aiClaimInitialAssessmentPrompt(input);
    return output!;
  }
);
