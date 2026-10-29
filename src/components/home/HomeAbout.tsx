import type { Messages } from "@/i18n/messages";

const column = "mx-auto w-full max-w-7xl px-4 sm:px-8";
const heading = "font-heading text-2xl font-semibold text-text sm:text-3xl";
const card = "flex flex-col gap-2 rounded-2xl bg-surface-raised p-6 shadow-soft";

/**
 * The text under the hero: how Waylo works, the levels of care and the common questions.
 * It is plain server-rendered HTML, so a search engine reads it without running any script.
 */
export function HomeAbout({ t }: { t: Messages }) {
  const about = t.home.about;
  return (
    <div className={`${column} flex flex-col gap-16 py-16`}>
      <section aria-labelledby="home-steps" className="flex flex-col gap-6">
        <h2 id="home-steps" className={heading}>
          {about.stepsTitle}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {about.steps.map((step, index) => (
            <li key={step.title} className={card}>
              <span className="font-heading text-sm font-semibold text-text-muted">{index + 1}</span>
              <h3 className="font-heading text-lg font-semibold text-text">{step.title}</h3>
              <p className="leading-relaxed text-text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="home-levels" className="flex flex-col gap-6">
        <h2 id="home-levels" className={heading}>
          {about.levelsTitle}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {about.levels.map((level) => (
            <li key={level.title} className={card}>
              <h3 className="font-heading text-lg font-semibold text-text">{level.title}</h3>
              <p className="leading-relaxed text-text-muted">{level.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="home-faq" className="flex flex-col gap-6">
        <h2 id="home-faq" className={heading}>
          {about.faqTitle}
        </h2>
        <dl className="grid gap-4 md:grid-cols-2">
          {about.faqs.map((faq) => (
            <div key={faq.question} className={card}>
              <dt className="font-heading text-lg font-semibold text-text">{faq.question}</dt>
              <dd className="leading-relaxed text-text-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="max-w-3xl text-sm leading-relaxed text-text-muted">{about.disclaimer}</p>
    </div>
  );
}
