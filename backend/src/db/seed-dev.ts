import "dotenv/config";
import { sql, type Kysely } from "kysely";
import type { Database } from "infrastructure/database/types.js";
import {
  initializeDatabase,
  closeConnection,
  db,
} from "infrastructure/database/connection.js";

/**
 * Find concept by name or create it. Returns the ID.
 */
async function findOrCreateConcept(
  database: Kysely<Database>,
  name: string,
): Promise<number> {
  const existing = await database
    .selectFrom("concept")
    .select("id")
    .where("name", "=", name)
    .executeTakeFirst();

  if (existing) return existing.id;

  const result = await database
    .insertInto("concept")
    .values({ name })
    .executeTakeFirstOrThrow();
  return Number(result.insertId);
}

/**
 * Find sentence by content or create it. Returns the ID.
 */
async function findOrCreateSentence(
  database: Kysely<Database>,
  content: string,
): Promise<number> {
  const existing = await database
    .selectFrom("sentence")
    .select("id")
    .where("content", "=", content)
    .executeTakeFirst();

  if (existing) return existing.id;

  const result = await database
    .insertInto("sentence")
    .values({ content })
    .executeTakeFirstOrThrow();
  return Number(result.insertId);
}

/**
 * Find algorithm by name or create it. Returns the ID.
 */
async function findOrCreateAlgorithm(
  database: Kysely<Database>,
  name: string,
): Promise<number> {
  const existing = await database
    .selectFrom("algorithm")
    .select("id")
    .where("name", "=", name)
    .executeTakeFirst();

  if (existing) return existing.id;

  const result = await database
    .insertInto("algorithm")
    .values({ name })
    .executeTakeFirstOrThrow();
  return Number(result.insertId);
}

/**
 * Find step by content or create it. Returns the ID.
 */
async function findOrCreateStep(
  database: Kysely<Database>,
  content: string,
): Promise<number> {
  const existing = await database
    .selectFrom("step")
    .select("id")
    .where("content", "=", content)
    .executeTakeFirst();

  if (existing) return existing.id;

  const result = await database
    .insertInto("step")
    .values({ content, algorithm_id: null })
    .executeTakeFirstOrThrow();
  return Number(result.insertId);
}

/**
 * Inserts development seed data into the database. Idempotent.
 */
export async function seedDev(database: Kysely<Database>): Promise<void> {
  // === CONCEPTS ===
  console.log("Seeding concepts...");
  const conceptIds = {
    funkcja: await findOrCreateConcept(database, "Funkcja"),
    pochodna: await findOrCreateConcept(database, "Pochodna"),
    calka: await findOrCreateConcept(database, "Całka"),
    rownanieKwadratowe: await findOrCreateConcept(database, "Równanie kwadratowe"),
    macierz: await findOrCreateConcept(database, "Macierz"),
    wektor: await findOrCreateConcept(database, "Wektor"),
    granica: await findOrCreateConcept(database, "Granica"),
  };

  // === CONCEPT GROUPS (composite PK — use INSERT IGNORE) ===
  console.log("Seeding concept groups...");
  const conceptGroups = [
    { parent: conceptIds.funkcja, child: conceptIds.pochodna },
    { parent: conceptIds.funkcja, child: conceptIds.calka },
    { parent: conceptIds.funkcja, child: conceptIds.granica },
  ];
  for (const { parent, child } of conceptGroups) {
    await sql`INSERT IGNORE INTO concept_group (parent_concept_id, child_concept_id) VALUES (${parent}, ${child})`.execute(database);
  }

  // === SENTENCES ===
  console.log("Seeding sentences...");
  const sentenceIds = {
    s1: await findOrCreateSentence(database, "Funkcja przyporządkowuje każdemu argumentowi dokładnie jedną wartość."),
    s2: await findOrCreateSentence(database, "Dziedziną funkcji nazywamy zbiór wszystkich dopuszczalnych argumentów."),
    s3: await findOrCreateSentence(database, "Wykresem funkcji jest zbiór punktów (x, f(x)) w układzie współrzędnych."),
    s4: await findOrCreateSentence(database, "Pochodna opisuje chwilową szybkość zmian funkcji."),
    s5: await findOrCreateSentence(database, "Pochodną funkcji w punkcie można zdefiniować jako granicę ilorazu różnicowego."),
    s6: await findOrCreateSentence(database, "Całka oznaczona opisuje pole pod wykresem funkcji w danym przedziale."),
    s7: await findOrCreateSentence(database, "Całkowanie jest operacją odwrotną do różniczkowania w sensie twierdzenia Newtona–Leibniza."),
    s8: await findOrCreateSentence(database, "Równanie kwadratowe ma postać ax^2 + bx + c = 0, gdzie a ≠ 0."),
    s9: await findOrCreateSentence(database, "Rozwiązania równania kwadratowego można obliczyć ze wzoru kwadratowego."),
    s10: await findOrCreateSentence(database, "Macierz to prostokątna tablica liczb ułożonych w wiersze i kolumny."),
    s11: await findOrCreateSentence(database, "Wyznacznik macierzy 2×2 obliczamy jako ad − bc."),
    s12: await findOrCreateSentence(database, "Wektor w geometrii to obiekt mający kierunek, zwrot i długość."),
    s13: await findOrCreateSentence(database, "Granica funkcji opisuje zachowanie wartości funkcji, gdy argument zbliża się do pewnej liczby."),
  };

  // === SENTENCE-CONCEPT LINKS (composite PK — use INSERT IGNORE) ===
  console.log("Seeding sentence-concept links...");
  const sentenceConceptLinks: { s: number; c: number }[] = [
    { s: sentenceIds.s1, c: conceptIds.funkcja },
    { s: sentenceIds.s2, c: conceptIds.funkcja },
    { s: sentenceIds.s3, c: conceptIds.funkcja },
    { s: sentenceIds.s4, c: conceptIds.pochodna },
    { s: sentenceIds.s5, c: conceptIds.pochodna },
    { s: sentenceIds.s6, c: conceptIds.calka },
    { s: sentenceIds.s7, c: conceptIds.calka },
    { s: sentenceIds.s8, c: conceptIds.rownanieKwadratowe },
    { s: sentenceIds.s9, c: conceptIds.rownanieKwadratowe },
    { s: sentenceIds.s10, c: conceptIds.macierz },
    { s: sentenceIds.s11, c: conceptIds.macierz },
    { s: sentenceIds.s12, c: conceptIds.wektor },
    { s: sentenceIds.s13, c: conceptIds.granica },
  ];
  for (const { s, c } of sentenceConceptLinks) {
    await sql`INSERT IGNORE INTO sentence_concept (sentence_id, concept_id, is_true) VALUES (${s}, ${c}, 1)`.execute(database);
  }

  // === ALGORITHMS ===
  console.log("Seeding algorithms...");
  const algorithmIds = {
    pochodna: await findOrCreateAlgorithm(database, "Oblicz pochodną funkcji"),
    rownanieKwadratowe: await findOrCreateAlgorithm(database, "Rozwiąż równanie kwadratowe"),
    wyznacznik: await findOrCreateAlgorithm(database, "Oblicz wyznacznik macierzy 2x2"),
  };

  // === STEPS ===
  console.log("Seeding steps...");
  const stepIds = {
    st1: await findOrCreateStep(database, "Zidentyfikuj funkcję i jej dziedzinę."),
    st2: await findOrCreateStep(database, "Zastosuj reguły różniczkowania (np. suma, iloczyn, łańcuchowa)."),
    st3: await findOrCreateStep(database, "Uprość wynik i podaj dziedzinę pochodnej."),
    st4: await findOrCreateStep(database, "Odczytaj współczynniki a, b, c."),
    st5: await findOrCreateStep(database, "Oblicz wyróżnik Δ = b^2 − 4ac."),
    st6: await findOrCreateStep(database, "Wyznacz rozwiązania x1, x2 na podstawie Δ."),
    st7: await findOrCreateStep(database, "Dla macierzy [[a, b], [c, d]] oblicz ad − bc."),
  };

  // === ALGORITHM-STEP LINKS (unique on algorithm_id + order_number — use INSERT IGNORE) ===
  console.log("Seeding algorithm-step links...");
  const algorithmStepLinks = [
    { a: algorithmIds.pochodna, s: stepIds.st1, o: 1 },
    { a: algorithmIds.pochodna, s: stepIds.st2, o: 2 },
    { a: algorithmIds.pochodna, s: stepIds.st3, o: 3 },
    { a: algorithmIds.rownanieKwadratowe, s: stepIds.st4, o: 1 },
    { a: algorithmIds.rownanieKwadratowe, s: stepIds.st5, o: 2 },
    { a: algorithmIds.rownanieKwadratowe, s: stepIds.st6, o: 3 },
    { a: algorithmIds.wyznacznik, s: stepIds.st7, o: 1 },
  ];
  for (const { a, s, o } of algorithmStepLinks) {
    await sql`INSERT IGNORE INTO algorithm_step (algorithm_id, step_id, order_number) VALUES (${a}, ${s}, ${o})`.execute(database);
  }
}

async function main(): Promise<void> {
  try {
    console.log("=== Dev Seed ===\n");
    await initializeDatabase();
    await seedDev(db);
    console.log("\nDev seed completed successfully!");
  } catch (error) {
    console.error("Dev seed failed:", error);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

void main();
