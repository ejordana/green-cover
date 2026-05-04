'use server';
/**
 * @fileOverview A Genkit flow for answering natural language questions about an insurance policy.
 *
 * - interactivePolicyCoverageQA - A function that handles the policy coverage QA process.
 * - InteractivePolicyCoverageQAInput - The input type for the interactivePolicyCoverageQA function.
 * - InteractivePolicyCoverageQAOutput - The return type for the interactivePolicyCoverageQA function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InteractivePolicyCoverageQAInputSchema = z.object({
  policyDocumentDataUri: z
    .string()
    .describe(
      "The insurance policy document, as a data URI that must include a MIME type (e.g., application/pdf) and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The natural language question about the insurance policy.'),
});
export type InteractivePolicyCoverageQAInput = z.infer<typeof InteractivePolicyCoverageQAInputSchema>;

const InteractivePolicyCoverageQAOutputSchema = z.object({
  answer: z.string().describe('A clear, concise, and accurate answer to the question based on the provided policy document.'),
});
export type InteractivePolicyCoverageQAOutput = z.infer<typeof InteractivePolicyCoverageQAOutputSchema>;

export async function interactivePolicyCoverageQA(
  input: InteractivePolicyCoverageQAInput
): Promise<InteractivePolicyCoverageQAOutput> {
  return interactivePolicyCoverageQAFlow(input);
}

const policyCoverageQAPrompt = ai.definePrompt({
  name: 'policyCoverageQAPrompt',
  input: { schema: InteractivePolicyCoverageQAInputSchema },
  output: { schema: InteractivePolicyCoverageQAOutputSchema },
  prompt: `You are an expert insurance policy advisor. Your task is to provide clear, concise, and accurate answers to questions based SOLELY on the provided insurance policy document.\n\nCarefully analyze the policy document and the user's question. If the answer cannot be found within the provided document, state that explicitly. Do not invent information or make assumptions.\n\nPolicy Document: {{media url=policyDocumentDataUri}}\nQuestion: {{{question}}}\n\nProvide the answer in the requested JSON format.`,
});

const interactivePolicyCoverageQAFlow = ai.defineFlow(
  {
    name: 'interactivePolicyCoverageQAFlow',
    inputSchema: InteractivePolicyCoverageQAInputSchema,
    outputSchema: InteractivePolicyCoverageQAOutputSchema,
  },
  async (input) => {
    const { output } = await policyCoverageQAPrompt(input);
    return output!;
  }
);
