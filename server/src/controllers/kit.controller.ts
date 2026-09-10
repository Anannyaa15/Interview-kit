import type { Response } from 'express';
import { z } from 'zod';
import { Kit } from '../models/Kit.js';
import type { AuthRequest } from '../types/auth.js';
import { generateKit, toKitOutput } from '../services/generation.pipeline.js';
import crypto from 'node:crypto';
import {
  generateCompanyBrief,
  generateQuestions,
} from '../services/ai/generation.service.js';
import { crawlCompany } from '../services/research/crawler.service.js';
import { searchPublicInterviewDiscussion } from '../services/research/publicResearch.service.js';
import { allocateSchedule } from '../services/schedule.service.js';

const createSchema = z.object({
  jd: z.string().min(2).max(100000),
  company_url: z.string().url(),
  days: z.number().int().min(1).max(60),
});

export async function listKits(req: AuthRequest, res: Response) {
  const kits = await Kit.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .select('source status generation createdAt schedule.days_available');

  return res.json({ kits });
}

export async function createKit(req: AuthRequest, res: Response) {
  const p = createSchema.safeParse(req.body);

  if (!p.success) {
    return res.status(400).json({
      message:
        'Provide a job description, valid company URL, and 1–60 days.',
    });
  }

  const input_hash = crypto
    .createHash('sha256')
    .update(
      `${p.data.jd.trim()}|${p.data.company_url
        .trim()
        .replace(/\/$/, '')}|${p.data.days}`,
    )
    .digest('hex');

  const existing = await Kit.findOne({
    userId: req.userId,
    input_hash,
    status: { $in: ['generating', 'ready'] },
  }).select('_id status');

  if (existing) {
    return res.status(200).json({
      kitId: existing.id,
      status: existing.status,
      duplicate: true,
    });
  }

  const kit = await Kit.create({
    userId: req.userId,
    input_jd: p.data.jd,
    input_hash,
    status: 'draft',

    source: {
      company_url: p.data.company_url,
      jd_chars: p.data.jd.length,
    },

    schedule: {
      days_available: p.data.days,
      days: [],
    },

    questions: [],
    flashcards: [],

    coverage: {
      uncovered_requirement_ids: [],
      passes: 0,
    },

    company_brief: {
      summary: '',
      what_they_do: '',
      sources: [],
    },

    role: {
      title: '',
      seniority: '',
      responsibilities: [],
      requirements: [],
    },

    generation: {
      step: 'queued',
      label: 'Queued',
      done: false,
      error: null,
    },
  });

  void generateKit(String(kit._id)).catch((error) =>
    console.error('generation failed', error),
  );

  return res.status(201).json({
    kitId: kit.id,
    status: 'generating',
  });
}

export async function getKit(req: AuthRequest, res: Response) {
  const kit = await Kit.findOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!kit) {
    return res.status(404).json({
      message: 'Kit not found.',
    });
  }

  return res.json({
    kit: toKitOutput(kit.toObject()),
    status: kit.status,
    generation: kit.generation,
  });
}

export async function getKitStatus(req: AuthRequest, res: Response) {
  const kit = await Kit.findOne({
    _id: req.params.id,
    userId: req.userId,
  }).select('status generation');

  if (!kit) {
    return res.status(404).json({
      message: 'Kit not found.',
    });
  }

  return res.json({
    status: kit.status,
    generation: kit.generation,
  });
}

const regenerateSchema = z.object({
  section: z.enum([
    'company_brief',
    'technical',
    'behavioural',
    'system-design',
    'company-fit',
    'schedule',
  ]),
});

export async function regenerateSection(
  req: AuthRequest,
  res: Response,
) {
  const parsed = regenerateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid regeneration section.',
    });
  }

  const kit = await Kit.findOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!kit) {
    return res.status(404).json({
      message: 'Kit not found.',
    });
  }

  // Mongoose fields may be nullable in the generated TypeScript type.
  // These local references make the required fields explicit.
  const source = kit.source as any;
  const role = kit.role as any;
  const scheduleData = kit.schedule as any;
  const companyBrief = kit.company_brief as any;
  const coverage = kit.coverage as any;

  if (!source || !role || !scheduleData) {
    return res.status(400).json({
      message: 'Kit is missing required generation data.',
    });
  }

  try {
    if (parsed.data.section === 'schedule') {
      const schedule = allocateSchedule(
        kit.questions as any,
        role.requirements as any,
        Number(scheduleData.days_available ?? 1),
      );

      kit.schedule = schedule as any;
    } else {
      const crawl = await crawlCompany(
        String(source.company_url),
      );

      const publicResearch =
        await searchPublicInterviewDiscussion(
          String(source.company || source.company_url),
        );

      if (parsed.data.section === 'company_brief') {
        kit.company_brief = (
          await generateCompanyBrief(
            String(source.company_url),
            crawl.pages,
            [publicResearch],
          )
        ) as any;
      } else {
        if (!companyBrief) {
          return res.status(400).json({
            message: 'Company brief is missing.',
          });
        }

        const category = parsed.data.section;

        const generated = await generateQuestions(
          role.requirements as any,
          category as any,
          String(companyBrief.summary ?? ''),
          crawl.hiringPage
            ? crawl.pages.find(
                (p) => p.url === crawl.hiringPage,
              )?.text
            : '',
        );

        const existing = (
          kit.questions as any[]
        ).filter(
          (q) => q.category === category,
        );

        const start = kit.questions.length + 1;

        const fresh = generated.map((q, i) => ({
          ...q,
          id: `q${start + i}`,
        }));

        // Preserve edited and pinned questions.
        const idsToReplace = new Set(
          existing
            .filter(
              (q) => q.state === 'generated',
            )
            .map((q) => q.id),
        );

        const retained = (
          kit.questions as any[]
        ).filter(
          (q) => !idsToReplace.has(q.id),
        );

        kit.questions = [
          ...retained,
          ...fresh,
        ] as any;

        // Re-check must-have requirement coverage.
        const gaps = role.requirements
          .filter(
            (r: any) =>
              r.priority === 'must' &&
              !(kit.questions as any[]).some(
                (q) =>
                  (q.requirement_ids || [])
                    .includes(r.id),
              ),
          )
          .map((r: any) => r.id);

        kit.coverage = {
          uncovered_requirement_ids: gaps,
          passes:
            Number(coverage?.passes ?? 0) + 1,
        } as any;
      }
    }

    await kit.save();

    return res.json({
      kit: toKitOutput(kit.toObject()),
    });
  } catch (error) {
    return res.status(502).json({
      message:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

const practiceSchema = z.object({
  confidence: z.number().int().min(1).max(5),
});

export async function recordPractice(
  req: AuthRequest,
  res: Response,
) {
  const parsed = practiceSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Confidence must be an integer from 1 to 5.',
    });
  }

  const kit = await Kit.findOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!kit) {
    return res.status(404).json({
      message: 'Kit not found.',
    });
  }

  const card = (kit.flashcards as any[]).find(
    (f) => f.id === req.params.flashcardId,
  );

  if (!card) {
    return res.status(404).json({
      message: 'Flashcard not found.',
    });
  }

  const existing = (kit.practice as any[]).find(
    (p) => p.flashcard_id === card.id,
  );

  if (existing) {
    existing.confidence = parsed.data.confidence;
    existing.last_reviewed_at = new Date();
  } else {
    (kit.practice as any[]).push({
      flashcard_id: card.id,
      confidence: parsed.data.confidence,
      last_reviewed_at: new Date(),
    });
  }

  await kit.save();

  return res.json({
    practice: kit.practice,
  });
}

const editSchema = z.object({
  section: z.enum([
    'company_brief',
    'role',
    'questions',
    'flashcards',
    'schedule',
  ]),
  value: z.unknown(),
});

export async function updateKit(
  req: AuthRequest,
  res: Response,
) {
  const p = editSchema.safeParse(req.body);

  if (!p.success) {
    return res.status(400).json({
      message: 'Invalid kit update.',
    });
  }

  const kit = await Kit.findOne({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!kit) {
    return res.status(404).json({
      message: 'Kit not found.',
    });
  }

  (kit as any)[p.data.section] = p.data.value;

  await kit.save();

  return res.json({
    kit: toKitOutput(kit.toObject()),
  });
}