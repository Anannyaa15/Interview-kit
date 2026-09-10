import { Kit } from '../models/Kit.js';
import { crawlCompany } from './research/crawler.service.js';
import { searchPublicInterviewDiscussion } from './research/publicResearch.service.js';
import { extractRoleRequirements } from './ai/extraction.service.js';
import {
  generateCompanyBrief,
  generateFlashcards,
  generateQuestions,
} from './ai/generation.service.js';
import { findCoverageGaps } from './coverage.service.js';
import { allocateSchedule } from './schedule.service.js';
import { validateKitStructure } from './structure.service.js';

export type Progress = {
  step: string;
  label: string;
  done: boolean;
  error?: string;
};

export const generationSteps = [
  ['extract', 'Extracting job requirements'],
  ['crawl', 'Researching company website'],
  ['discussion', 'Looking for public interview discussion'],
  ['brief', 'Building company brief'],
  ['questions', 'Generating targeted questions'],
  ['coverage', 'Checking question coverage'],
  ['flashcards', 'Creating flashcards'],
  ['schedule', 'Building study schedule'],
  ['validate', 'Validating kit'],
] as const;

async function saveProgress(
  id: string,
  step: string,
  label: string,
  done = false,
  error?: string,
) {
  await Kit.updateOne(
    { _id: id },
    {
      $set: {
        'generation.step': step,
        'generation.label': label,
        'generation.done': done,
        'generation.error': error ?? null,
      },
    },
  );
}

export async function generateKit(kitId: string) {
  const kit = await Kit.findById(kitId);

  if (!kit) {
    throw new Error('Kit not found.');
  }

  /*
   * Mongoose allows these fields to be nullable in the generated
   * TypeScript types. They are initialized when a kit is created,
   * so use local application-level references after loading the kit.
   */
  const source = kit.source as any;
  const scheduleData = kit.schedule as any;

  if (!source || !source.company_url) {
    throw new Error('Kit is missing a valid company URL.');
  }

  if (!scheduleData || !scheduleData.days_available) {
    throw new Error('Kit is missing the number of available study days.');
  }

  const jd = kit.input_jd;

  try {
    /*
     * ---------------------------------------------------------
     * 1. Extract job requirements
     * ---------------------------------------------------------
     */
    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          status: 'generating',
          'generation.startedAt': new Date(),
        },
      },
    );

    await saveProgress(
      kitId,
      'extract',
      'Extracting job requirements',
    );

    const role = await extractRoleRequirements(jd);

    /*
     * Treat the extracted role as the application-level role shape.
     * This avoids Mongoose's widened string types conflicting with
     * the stricter Requirement types used by the generation services.
     */
    const normalizedRole = role as any;

    const companyName = new URL(
      String(source.company_url),
    )
      .hostname
      .replace(/^www\./, '')
      .split('.')[0];

    normalizedRole.title =
      normalizedRole.title || '';

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          'source.company': companyName,
        },
      },
    );

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          role: normalizedRole,
          'source.role': normalizedRole.title,
          'source.location': normalizedRole.location,
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 2. Crawl company website
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'crawl',
      'Researching company website',
    );

    const crawl = await crawlCompany(
      String(source.company_url),
    );

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          'generation.researchErrors': crawl.errors,
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 3. Public interview discussion
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'discussion',
      'Looking for public interview discussion',
    );

    const company = new URL(
      String(source.company_url),
    )
      .hostname
      .replace(/^www\./, '');

    const publicResearch =
      await searchPublicInterviewDiscussion(company);

    /*
     * ---------------------------------------------------------
     * 4. Company brief
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'brief',
      'Building company brief',
    );

    const brief = await generateCompanyBrief(
      String(source.company_url),
      crawl.pages,
      [publicResearch],
    );

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          company_brief: brief,
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 5. Generate questions by category
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'questions',
      'Generating targeted questions',
    );

    const categories = [
      'technical',
      'behavioural',
      'system-design',
      'company-fit',
    ] as const;

    const generatedByCategory: any[][] = [];

    /*
     * Generate categories sequentially rather than firing all
     * LLM requests at once. This is friendlier to free-tier
     * rate limits.
     */
    for (const category of categories) {
      const questions = await generateQuestions(
        normalizedRole.requirements as any,
        category,
        String(brief.summary ?? ''),
        crawl.hiringPage
          ? crawl.pages.find(
              (p) => p.url === crawl.hiringPage,
            )?.text
          : '',
      );

      generatedByCategory.push(questions);
    }

    let questions: any[] =
      generatedByCategory.flat();

    /*
     * Application-owned question IDs.
     */
    questions = questions.map((q, i) => ({
      ...q,
      id: `q${i + 1}`,
    }));

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          questions,
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 6. Coverage check + second pass
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'coverage',
      'Checking question coverage',
    );

    let gaps = findCoverageGaps(
      normalizedRole.requirements as any,
      questions,
    );

    let passes = 1;

    /*
     * If any requirements are uncovered, generate an additional
     * targeted set of questions for those requirements.
     */
    if (gaps.length) {
      const missingReqs =
        normalizedRole.requirements.filter(
          (r: any) => gaps.includes(r.id),
        );

      const additions =
        await generateQuestions(
          missingReqs as any,
          'technical',
          String(brief.summary ?? ''),
          crawl.hiringPage
            ? crawl.pages.find(
                (p) => p.url === crawl.hiringPage,
              )?.text
            : '',
        );

      const startingIndex = questions.length;

      questions.push(
        ...additions.map((q, i) => ({
          ...q,
          id: `q${startingIndex + i + 1}`,
        })),
      );

      /*
       * Check coverage again after the second pass.
       */
      gaps = findCoverageGaps(
        normalizedRole.requirements as any,
        questions,
      );

      passes = 2;
    }

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          questions,
          'coverage.uncovered_requirement_ids': gaps,
          'coverage.passes': passes,
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 7. Flashcards
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'flashcards',
      'Creating flashcards',
    );

    const flashcards =
      await generateFlashcards(
        normalizedRole.requirements as any,
        questions,
      );

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          flashcards: flashcards.map(
            (f, i) => ({
              ...f,
              id: `f${i + 1}`,
            }),
          ),
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 8. Deterministic study schedule
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'schedule',
      'Building study schedule',
    );

    const schedule =
      allocateSchedule(
        questions,
        normalizedRole.requirements as any,
        Number(scheduleData.days_available ?? 1),
      );

    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          schedule,
        },
      },
    );

    /*
     * ---------------------------------------------------------
     * 9. Final validation
     * ---------------------------------------------------------
     */
    await saveProgress(
      kitId,
      'validate',
      'Validating kit',
    );

    const final =
      await Kit.findById(kitId).lean();

    if (!final) {
      throw new Error(
        'Kit disappeared during generation.',
      );
    }

    const output = toKitOutput(final);

    const validation =
      validateKitStructure(output);

    if (
      !validation.valid ||
      output.coverage.uncovered_requirement_ids.length
    ) {
      throw new Error(
        `Generated kit validation failed: ${
          validation.errors.join('; ') ||
          'must-have requirements remain uncovered.'
        }`,
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. Mark ready
     * ---------------------------------------------------------
     */
    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          status: 'ready',
          'generation.done': true,
          'generation.label': 'Kit ready',
          'generation.error': null,
          'source.researched_at':
            new Date().toISOString(),
          'source.pages_used':
            crawl.pagesUsed,
        },
      },
    );
  } catch (error) {
    await Kit.updateOne(
      { _id: kitId },
      {
        $set: {
          status: 'failed',
          'generation.done': true,
          'generation.error': String(error),
        },
      },
    );

    throw error;
  }
}

/*
 * Convert the MongoDB document into the Appendix-A style
 * interview kit output used by the frontend and evaluator.
 */
export function toKitOutput(doc: any) {
  return {
    source: doc.source,
    company_brief: doc.company_brief,
    role: doc.role,
    questions: doc.questions,
    flashcards: doc.flashcards,
    schedule: doc.schedule,
    coverage: doc.coverage,
    practice: doc.practice ?? [],
  };
}