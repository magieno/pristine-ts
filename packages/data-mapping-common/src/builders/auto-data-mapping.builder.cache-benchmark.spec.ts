/**
 * Benchmark for AutoDataMappingBuilder's schema cache.
 *
 * The cache saves only the time it takes to walk the destination class's metadata and
 * construct the DataMappingBuilder tree. It does NOT speed up the actual mapping work
 * (walking the tree, plainToInstance, running normalizers). So how much the cache helps
 * end-to-end depends on the build-cost / map-cost ratio.
 *
 * This file measures three things so we can make an informed call:
 *
 *   1. Schema-BUILD only: the raw upper bound the cache can give (build once vs N times).
 *   2. Full autoMap on a REALISTIC shape (~typical REST body — one level of nesting, ~10
 *      fields). This is the hot path that motivates the cache (BodyMappingRequestInterceptor).
 *   3. Full autoMap on a DEEP+WIDE shape (6 levels, ~10 fields each, arrays at every level).
 *      Map cost dominates here, so the cache shouldn't matter much — this confirms whether
 *      we're shipping a memory regression for negligible gain on heavy schemas.
 *
 * Numbers are logged. The only hard assertion is on test #1 (schema-build) because that's
 * deterministically large. Tests #2 and #3 only log, since end-to-end speedup is workload-
 * dependent and we want the numbers visible without flaking CI.
 */
import "reflect-metadata";
import {classMetadata, property} from "@pristine-ts/metadata";
import {AutoDataMappingBuilder} from "./auto-data-mapping.builder";
import {DataMapper} from "../mappers/data.mapper";
import {StringNormalizer} from "../normalizers/string.normalizer";
import {NumberNormalizer} from "../normalizers/number.normalizer";
import {BooleanNormalizer} from "../normalizers/boolean.normalizer";
import {DateNormalizer} from "../normalizers/date.normalizer";
import {array} from "../decorators/array.decorator";
import {AutoDataMappingBuilderOptions} from "../options/auto-data-mapping-builder.options";

// ── Realistic shape: typical REST API body ────────────────────────────────────────────────

@classMetadata()
class RealisticAddress {
  @property() street: string;
  @property() city: string;
  @property() postalCode: string;
  @property() country: string;
}

@classMetadata()
class RealisticBody {
  @property() id: string;
  @property() firstName: string;
  @property() lastName: string;
  @property() email: string;
  @property() age: number;
  @property() active: boolean;
  @property() createdAt: Date;
  @property() address: RealisticAddress;
  @array(String) tags: string[] = [];
}

const realisticSource = () => ({
  id: "u-1",
  firstName: "Etienne",
  lastName: "Noel",
  email: "e@example.com",
  age: 37,
  active: true,
  createdAt: "2025-01-01T00:00:00Z",
  address: {street: "1 rue", city: "MTL", postalCode: "H1H 1H1", country: "CA"},
  tags: ["a", "b", "c"],
});

// ── Deep + wide shape (stress test) ───────────────────────────────────────────────────────

@classMetadata()
class L5 { @property() s1: string; @property() s2: string; @property() n1: number; @property() n2: number; @property() b1: boolean; @property() d1: Date; @array(String) tags: string[] = []; @array(Number) scores: number[] = []; }
@classMetadata()
class L4 { @property() s1: string; @property() s2: string; @property() n1: number; @property() n2: number; @property() b1: boolean; @property() d1: Date; @property() child: L5; @array(L5) children: L5[] = []; @array(String) tags: string[] = []; }
@classMetadata()
class L3 { @property() s1: string; @property() s2: string; @property() n1: number; @property() n2: number; @property() b1: boolean; @property() d1: Date; @property() child: L4; @array(L4) children: L4[] = []; @array(String) tags: string[] = []; }
@classMetadata()
class L2 { @property() s1: string; @property() s2: string; @property() n1: number; @property() n2: number; @property() b1: boolean; @property() d1: Date; @property() child: L3; @array(L3) children: L3[] = []; @array(String) tags: string[] = []; }
@classMetadata()
class L1 { @property() s1: string; @property() s2: string; @property() n1: number; @property() n2: number; @property() b1: boolean; @property() d1: Date; @property() child: L2; @array(L2) children: L2[] = []; @array(String) tags: string[] = []; }
@classMetadata()
class DeepRoot { @property() s1: string; @property() s2: string; @property() n1: number; @property() n2: number; @property() b1: boolean; @property() d1: Date; @property() child: L1; @array(L1) children: L1[] = []; @array(String) tags: string[] = []; }

function buildDeepSource(): any {
  const leaf = () => ({s1: "a", s2: "b", n1: 1, n2: 2, b1: true, d1: "2025-01-01", tags: ["t1"], scores: [1]});
  const nest = (child: () => any) => ({
    s1: "a", s2: "b", n1: 1, n2: 2, b1: true, d1: "2025-01-01",
    child: child(),
    children: [child(), child()],  // 2 elements (down from 3) to keep tree explosion in check
    tags: ["t1"],
  });
  // 6 levels — but cap fan-out at 2 to keep this tractable.
  const l5 = leaf;
  const l4 = () => nest(l5);
  const l3 = () => nest(l4);
  const l2 = () => nest(l3);
  const l1 = () => nest(l2);
  return nest(l1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────────────────

function makeMapper(autoBuilder: AutoDataMappingBuilder): DataMapper {
  return new DataMapper(
    autoBuilder,
    [new StringNormalizer(), new NumberNormalizer(), new BooleanNormalizer(), new DateNormalizer()],
    [],
  );
}

function median(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/* eslint-disable no-console */
function logResult(label: string, noCacheMs: number, cachedMs: number, iters: number) {
  const speedup = noCacheMs / cachedMs;
  console.log(`\n  ${label}`);
  console.log(`    no-cache median: ${noCacheMs.toFixed(4)} ms/op`);
  console.log(`    cached   median: ${cachedMs.toFixed(4)} ms/op`);
  console.log(`    speed-up       : ${speedup.toFixed(2)}x   (over ${iters} iterations)`);
}
/* eslint-enable no-console */

describe("AutoDataMappingBuilder cache — benchmark", () => {
  const BUILD_ITERS = 2000;   // schema build is fast — large N for stable numbers
  const MAP_ITERS = 200;       // full autoMap is heavy — smaller N

  it(`(1) schema-BUILD only — upper-bound cache gain on the realistic shape`, () => {
    // Warm-up
    const warm = new AutoDataMappingBuilder();
    for (let i = 0; i < 100; i++) warm.build(realisticSource(), RealisticBody, new AutoDataMappingBuilderOptions({disableCache: true}));

    // No cache
    const noCacheBuilder = new AutoDataMappingBuilder();
    const noCacheSamples: number[] = [];
    for (let i = 0; i < BUILD_ITERS; i++) {
      const t = process.hrtime.bigint();
      noCacheBuilder.build(realisticSource(), RealisticBody, new AutoDataMappingBuilderOptions({disableCache: true}));
      noCacheSamples.push(Number(process.hrtime.bigint() - t) / 1_000_000);
    }

    // Cache (after the first call, all hits)
    const cachedBuilder = new AutoDataMappingBuilder();
    cachedBuilder.build(realisticSource(), RealisticBody);
    const cachedSamples: number[] = [];
    for (let i = 0; i < BUILD_ITERS; i++) {
      const t = process.hrtime.bigint();
      cachedBuilder.build(realisticSource(), RealisticBody);
      cachedSamples.push(Number(process.hrtime.bigint() - t) / 1_000_000);
    }

    const noCacheMedian = median(noCacheSamples);
    const cachedMedian = median(cachedSamples);

    /* eslint-disable no-console */
    console.log("\n=== (1) Schema-BUILD only (realistic shape) ===");
    /* eslint-enable no-console */
    logResult(`one autoDataMappingBuilder.build() call`, noCacheMedian, cachedMedian, BUILD_ITERS);

    // The cache MUST be a clear win for the isolated build step. Conservative threshold.
    expect(noCacheMedian / cachedMedian).toBeGreaterThan(5);
  });

  it(`(2) full autoMap — REALISTIC shape (~typical REST body)`, async () => {
    const source = realisticSource();

    // Warm-up
    const warmAuto = new AutoDataMappingBuilder();
    const warmMapper = makeMapper(warmAuto);
    for (let i = 0; i < 50; i++) {
      await warmMapper.autoMap(source, RealisticBody);
      await warmMapper.autoMap(source, RealisticBody, new AutoDataMappingBuilderOptions({disableCache: true}));
    }

    const noCacheAuto = new AutoDataMappingBuilder();
    const noCacheMapper = makeMapper(noCacheAuto);
    const noCacheSamples: number[] = [];
    for (let i = 0; i < MAP_ITERS; i++) {
      const t = process.hrtime.bigint();
      await noCacheMapper.autoMap(source, RealisticBody, new AutoDataMappingBuilderOptions({disableCache: true}));
      noCacheSamples.push(Number(process.hrtime.bigint() - t) / 1_000_000);
    }

    const cachedAuto = new AutoDataMappingBuilder();
    const cachedMapper = makeMapper(cachedAuto);
    await cachedMapper.autoMap(source, RealisticBody);   // prime the cache
    const cachedSamples: number[] = [];
    for (let i = 0; i < MAP_ITERS; i++) {
      const t = process.hrtime.bigint();
      await cachedMapper.autoMap(source, RealisticBody);
      cachedSamples.push(Number(process.hrtime.bigint() - t) / 1_000_000);
    }

    /* eslint-disable no-console */
    console.log("\n=== (2) Full autoMap — realistic shape ===");
    /* eslint-enable no-console */
    logResult(`one autoMap(realistic-body, RealisticBody) call`, median(noCacheSamples), median(cachedSamples), MAP_ITERS);
  });

  it(`(3) full autoMap — DEEP+WIDE stress shape`, async () => {
    const source = buildDeepSource();

    // Warm-up
    const warmAuto = new AutoDataMappingBuilder();
    const warmMapper = makeMapper(warmAuto);
    for (let i = 0; i < 5; i++) {
      await warmMapper.autoMap(source, DeepRoot);
      await warmMapper.autoMap(source, DeepRoot, new AutoDataMappingBuilderOptions({disableCache: true}));
    }

    const ITERS = 50;
    const noCacheAuto = new AutoDataMappingBuilder();
    const noCacheMapper = makeMapper(noCacheAuto);
    const noCacheSamples: number[] = [];
    for (let i = 0; i < ITERS; i++) {
      const t = process.hrtime.bigint();
      await noCacheMapper.autoMap(source, DeepRoot, new AutoDataMappingBuilderOptions({disableCache: true}));
      noCacheSamples.push(Number(process.hrtime.bigint() - t) / 1_000_000);
    }

    const cachedAuto = new AutoDataMappingBuilder();
    const cachedMapper = makeMapper(cachedAuto);
    await cachedMapper.autoMap(source, DeepRoot);
    const cachedSamples: number[] = [];
    for (let i = 0; i < ITERS; i++) {
      const t = process.hrtime.bigint();
      await cachedMapper.autoMap(source, DeepRoot);
      cachedSamples.push(Number(process.hrtime.bigint() - t) / 1_000_000);
    }

    /* eslint-disable no-console */
    console.log("\n=== (3) Full autoMap — deep+wide stress shape ===");
    /* eslint-enable no-console */
    logResult(`one autoMap(deep-source, DeepRoot) call`, median(noCacheSamples), median(cachedSamples), ITERS);
  });

  it("(4) memory cost — heap delta after caching 100 distinct destination classes", async () => {
    const CLASSES = 100;
    const subclasses: any[] = [];
    for (let i = 0; i < CLASSES; i++) {
      const Sub = class extends RealisticBody {};
      Object.defineProperty(Sub, "name", {value: `RealisticBody_${i}`});
      subclasses.push(Sub);
    }

    const source = realisticSource();
    const autoBuilder = new AutoDataMappingBuilder();
    const mapper = makeMapper(autoBuilder);

    if ((global as any).gc) (global as any).gc();
    const memBefore = process.memoryUsage().heapUsed;

    for (const Sub of subclasses) {
      await mapper.autoMap(source, Sub);
    }

    if ((global as any).gc) (global as any).gc();
    const memAfter = process.memoryUsage().heapUsed;
    const deltaBytes = memAfter - memBefore;
    const perClass = deltaBytes / CLASSES;

    /* eslint-disable no-console */
    console.log("\n=== (4) Memory cost — cache with 100 cached classes ===");
    console.log(`  heap delta       : ${(deltaBytes / 1024).toFixed(1)} KB`);
    console.log(`  per cache entry  : ~${(perClass / 1024).toFixed(2)} KB`);
    if (!(global as any).gc) {
      console.log(`  note: numbers noisy without --expose-gc; rerun with NODE_OPTIONS="--expose-gc"`);
    }
    /* eslint-enable no-console */

    // No assertion — heap delta can be negative when GC runs during the loop without
    // `--expose-gc`. The test exists to print the number so it shows up in CI logs.
    expect(typeof deltaBytes).toBe("number");
  });
});
