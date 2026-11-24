import { Link } from "@tanstack/solid-router";
import type { JSX } from "@solidjs/web";
import { For, Show, createSignal } from "solid-js";
import { ActionButton } from "../components/base";
import { Icon } from "../components/icons";
import {
  answerLetters,
  questions,
  type AnswerLetter,
  type QuizQuestion,
} from "./questions-content";

const QuestionCard = (props: {
  readonly question: QuizQuestion;
  readonly selected: AnswerLetter | undefined;
  readonly submitted: boolean;
  readonly onSelect: (choice: AnswerLetter) => void;
}): JSX.Element => {
  const resultFor = (choice: AnswerLetter) => {
    if (!props.submitted) return undefined;

    if (choice === props.question.answer) return "correct";

    return choice === props.selected ? "incorrect" : undefined;
  };

  return (
    <fieldset class="m-0 min-w-0 border-0 p-0" disabled={props.submitted}>
      <legend class="w-full">
        <span class="mb-1 block text-xs font-semibold tabular-nums text-electric">
          Câu {props.question.number}
        </span>
        <span class="block text-base leading-relaxed font-semibold text-ink">
          {props.question.prompt}
        </span>
      </legend>
      <div class="mt-4 grid gap-2">
        <For each={answerLetters}>
          {(choice) => (
            <label
              data-result={resultFor(choice)}
              class="grid min-h-11 cursor-pointer grid-cols-[1rem_1.25rem_minmax(0,1fr)] items-start gap-2 rounded-control border border-line bg-bg px-3 py-2.5 text-sm leading-6 text-ink-soft hover:border-line-strong focus-within:border-electric has-checked:border-electric/60 has-checked:bg-electric/10 has-disabled:cursor-default data-[result=correct]:border-green/60 data-[result=correct]:bg-green/10 data-[result=incorrect]:border-rose/60 data-[result=incorrect]:bg-rose/10"
            >
              <input
                type="radio"
                name={`answer-${props.question.number}`}
                value={choice}
                checked={props.selected === choice}
                required={choice === "A"}
                onChange={() => props.onSelect(choice)}
                class="mt-1 size-4 accent-electric"
              />
              <span class="font-semibold text-ink">{choice}.</span>
              <span>{props.question.choices[choice]}</span>
            </label>
          )}
        </For>
      </div>
      <Show when={props.submitted}>
        <div class="mt-4 border-t border-line pt-4">
          <p class="text-sm font-semibold text-ink">
            {props.selected === props.question.answer ? "Trả lời đúng" : "Đáp án đúng"}
            {" · "}
            {props.question.answer}
          </p>
          <p class="mt-1 text-sm leading-6 text-ink-soft">{props.question.explanation}</p>
        </div>
      </Show>
    </fieldset>
  );
};

export const QuestionsScreen = (): JSX.Element => {
  const [answers, setAnswers] = createSignal<Readonly<Partial<Record<number, AnswerLetter>>>>({});
  const [submitted, setSubmitted] = createSignal(false);
  const answered = () => Object.keys(answers()).length;

  const score = () =>
    questions.filter((question) => answers()[question.number] === question.answer).length;

  let form: HTMLFormElement | undefined;
  let scoreRef: HTMLParagraphElement | undefined;

  const restart = (): void => {
    setAnswers({});
    setSubmitted(false);
    requestAnimationFrame(() => form?.querySelector("input")?.focus());
  };

  const submit = (): void => {
    setSubmitted(true);
    requestAnimationFrame(() => scoreRef?.focus());
  };

  return (
    <main class="mx-auto min-h-dvh w-full max-w-[1120px] px-4 pt-4 pb-12 sm:px-8 sm:pt-6 lg:pb-16">
      <nav
        class="flex items-center justify-between gap-3 border-b border-line pb-3"
        aria-label="Điều hướng"
      >
        <Link
          to="/"
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          <span class="inline-flex rotate-180" aria-hidden="true">
            <Icon icon="lucide:chevron-right" size={16} />
          </span>
          Về trò chơi
        </Link>
        <span class="max-w-[14rem] text-right text-xs font-semibold text-ink-soft">
          Điều Hành Lưới Điện Quốc Gia
        </span>
      </nav>
      <header class="pt-8 pb-6 sm:pt-10 sm:pb-8">
        <h1 class="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Câu hỏi trắc nghiệm
        </h1>
        <p class="mt-3 max-w-[65ch] text-base leading-relaxed text-ink-soft">
          Độc quyền trong ngành điện – Tập đoàn Điện lực Việt Nam (EVN)
        </p>
        <p class="mt-3 text-sm text-ink-faint lg:hidden">
          {questions.length} câu · Chọn một đáp án cho mỗi câu.
        </p>
      </header>
      <form
        ref={(element) => {
          form = element;
        }}
        class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <ol class="grid min-w-0 gap-4">
          <For each={questions}>
            {(question) => (
              <li class="min-w-0 rounded-panel border border-line bg-panel p-4 sm:p-6">
                <QuestionCard
                  question={question}
                  selected={answers()[question.number]}
                  submitted={submitted()}
                  onSelect={(choice) =>
                    setAnswers((current) => ({ ...current, [question.number]: choice }))
                  }
                />
              </li>
            )}
          </For>
        </ol>
        <aside class="rounded-panel border border-line bg-panel p-5 lg:sticky lg:top-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-ink">Đã trả lời</h2>
            <span class="text-sm font-semibold tabular-nums text-ink-soft">
              {answered()}/{questions.length}
            </span>
          </div>
          <progress
            class="mt-2 block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-panel-3 [&::-moz-progress-bar]:bg-electric [&::-webkit-progress-bar]:bg-panel-3 [&::-webkit-progress-value]:bg-electric"
            max={questions.length}
            value={answered()}
            aria-label="Tiến độ trả lời"
          />
          <div aria-live="polite" class="mt-4">
            <Show
              when={submitted()}
              fallback={
                <p class="text-sm leading-6 text-ink-soft">
                  Chọn một đáp án cho mỗi câu. Nộp bài để xem điểm và giải thích.
                </p>
              }
            >
              <p
                ref={(element) => {
                  scoreRef = element;
                }}
                tabindex="-1"
                class="text-base font-semibold text-ink"
              >
                Kết quả · {score()}/{questions.length} câu đúng
              </p>
            </Show>
          </div>
          <Show
            when={submitted()}
            fallback={
              <ActionButton type="submit" variant="primary" class="mt-4 w-full">
                Nộp bài
              </ActionButton>
            }
          >
            <ActionButton
              variant="secondary"
              icon="lucide:rotate-ccw"
              class="mt-4 w-full"
              onClick={restart}
            >
              Làm lại
            </ActionButton>
          </Show>
        </aside>
      </form>
    </main>
  );
};
