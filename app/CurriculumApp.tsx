"use client";

import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Facebook,
  GraduationCap,
  Home,
  Layers3,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Medal,
  Play,
  RotateCcw,
  Save,
  School,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  allLessons,
  buildLessonQuestions,
  buildUnitBank,
  getLesson,
  getUnit,
  type Question,
  type Unit,
  units,
} from "./curriculum-data";

type Screen = "welcome" | "home" | "unit" | "lesson" | "quiz" | "result";
type QuizMode = "lesson" | "unit";

type Student = {
  name: string;
  className: string;
  school: string;
};

type ResumeQuiz = {
  mode: QuizMode;
  targetId: string;
  index: number;
  answers: Record<number, string>;
};

type SavedProgress = {
  student: Student;
  completedLessons: string[];
  completedUnits: string[];
  lessonScores: Record<string, number>;
  unitScores: Record<string, number>;
  lastLessonId?: string;
  lastQuestion?: ResumeQuiz;
};

type ActiveQuiz = ResumeQuiz & {
  questions: Question[];
};

const STORAGE_KEY = "arabic-journey-mohamed-saeed-v1";
const emptyProgress: SavedProgress = {
  student: { name: "", className: "", school: "" },
  completedLessons: [],
  completedUnits: [],
  lessonScores: {},
  unitScores: {},
};

const passMark = 70;

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2a9.6 9.6 0 0 0-8.28 14.46L2.4 21.6l5.28-1.28A9.61 9.61 0 1 0 12 2Zm0 17.45a7.8 7.8 0 0 1-3.98-1.1l-.28-.16-3.12.76.78-3.03-.18-.3A7.84 7.84 0 1 1 12 19.45Z" />
      <path fill="currentColor" d="M16.34 13.86c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueAdd(items: string[], value: string) {
  return items.includes(value) ? items : [...items, value];
}

function questionSet(mode: QuizMode, targetId: string) {
  if (mode === "lesson") {
    const target = getLesson(targetId);
    return target ? buildLessonQuestions(target) : [];
  }
  const target = getUnit(targetId);
  return target ? buildUnitBank(target) : [];
}

export default function CurriculumApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [progress, setProgress] = useState<SavedProgress>(emptyProgress);
  const [activeUnitId, setActiveUnitId] = useState("unit-1");
  const [activeLessonId, setActiveLessonId] = useState("lesson-1-1");
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [result, setResult] = useState<{ score: number; passed: boolean; mode: QuizMode; targetId: string } | null>(null);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress({ ...emptyProgress, ...JSON.parse(saved) });
      const sound = window.localStorage.getItem(`${STORAGE_KEY}-sound`);
      if (sound !== null) setSoundOn(sound === "true");
    } catch {
      // The app remains usable when browser storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeUnit = getUnit(activeUnitId) ?? units[0];
  const activeLesson = getLesson(activeLessonId) ?? allLessons[0];
  const completedCount = progress.completedLessons.length;
  const overall = Math.round((completedCount / allLessons.length) * 100);

  const unitUnlocked = (unit: Unit) => {
    if (unit.order === 1) return true;
    return progress.completedUnits.includes(units[unit.order - 2].id);
  };

  const lessonUnlocked = (unit: Unit, lessonIndex: number) => {
    if (!unitUnlocked(unit)) return false;
    if (lessonIndex === 0) return true;
    return progress.completedLessons.includes(unit.lessons[lessonIndex - 1].id);
  };

  const unitBankUnlocked = (unit: Unit) =>
    unit.lessons.every((lesson) => progress.completedLessons.includes(lesson.id));

  const showNotice = (message: string) => setNotice(message);

  const playTone = (positive: boolean) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = positive ? 660 : 220;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      // Audio feedback is optional.
    }
  };

  const goHome = () => {
    setScreen("home");
    setActiveQuiz(null);
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openUnit = (unit: Unit) => {
    if (!unitUnlocked(unit)) {
      showNotice("أكمل بنك أسئلة الوحدة السابقة بنسبة 70% لفتح هذه الوحدة.");
      return;
    }
    setActiveUnitId(unit.id);
    setScreen("unit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openLesson = (unit: Unit, lessonId: string, lessonIndex: number) => {
    if (!lessonUnlocked(unit, lessonIndex)) {
      showNotice("أكمل اختبار الدرس السابق بنسبة 70% لفتح هذا الدرس.");
      return;
    }
    setActiveUnitId(unit.id);
    setActiveLessonId(lessonId);
    setProgress((current) => ({ ...current, lastLessonId: lessonId }));
    setScreen("lesson");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startQuiz = (mode: QuizMode, targetId: string, resume?: ResumeQuiz) => {
    const questions = questionSet(mode, targetId);
    if (!questions.length) return;
    const nextQuiz: ActiveQuiz = {
      mode,
      targetId,
      questions,
      index: clamp(resume?.index ?? 0, 0, questions.length - 1),
      answers: resume?.answers ?? {},
    };
    setActiveQuiz(nextQuiz);
    setProgress((current) => ({
      ...current,
      lastQuestion: {
        mode,
        targetId,
        index: nextQuiz.index,
        answers: nextQuiz.answers,
      },
    }));
    setScreen("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectAnswer = (answer: string) => {
    if (!activeQuiz) return;
    const question = activeQuiz.questions[activeQuiz.index];
    const nextAnswers = { ...activeQuiz.answers, [activeQuiz.index]: answer };
    const nextQuiz = { ...activeQuiz, answers: nextAnswers };
    setActiveQuiz(nextQuiz);
    setProgress((current) => ({
      ...current,
      lastQuestion: {
        mode: activeQuiz.mode,
        targetId: activeQuiz.targetId,
        index: activeQuiz.index,
        answers: nextAnswers,
      },
    }));
    playTone(answer === question.answer);
  };

  const finishQuiz = () => {
    if (!activeQuiz) return;
    const correct = activeQuiz.questions.reduce(
      (total, question, index) => total + (activeQuiz.answers[index] === question.answer ? 1 : 0),
      0,
    );
    const score = Math.round((correct / activeQuiz.questions.length) * 100);
    const passed = score >= passMark;
    setProgress((current) => {
      if (activeQuiz.mode === "lesson") {
        return {
          ...current,
          completedLessons: passed
            ? uniqueAdd(current.completedLessons, activeQuiz.targetId)
            : current.completedLessons,
          lessonScores: {
            ...current.lessonScores,
            [activeQuiz.targetId]: Math.max(current.lessonScores[activeQuiz.targetId] ?? 0, score),
          },
          lastQuestion: undefined,
        };
      }
      return {
        ...current,
        completedUnits: passed
          ? uniqueAdd(current.completedUnits, activeQuiz.targetId)
          : current.completedUnits,
        unitScores: {
          ...current.unitScores,
          [activeQuiz.targetId]: Math.max(current.unitScores[activeQuiz.targetId] ?? 0, score),
        },
        lastQuestion: undefined,
      };
    });
    setResult({ score, passed, mode: activeQuiz.mode, targetId: activeQuiz.targetId });
    setScreen("result");
    playTone(passed);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextQuestion = () => {
    if (!activeQuiz || !activeQuiz.answers[activeQuiz.index]) return;
    if (activeQuiz.index === activeQuiz.questions.length - 1) {
      finishQuiz();
      return;
    }
    const nextIndex = activeQuiz.index + 1;
    const nextQuiz = { ...activeQuiz, index: nextIndex };
    setActiveQuiz(nextQuiz);
    setProgress((current) => ({
      ...current,
      lastQuestion: {
        mode: activeQuiz.mode,
        targetId: activeQuiz.targetId,
        index: nextIndex,
        answers: activeQuiz.answers,
      },
    }));
  };

  const previousQuestion = () => {
    if (!activeQuiz || activeQuiz.index === 0) return;
    const nextIndex = activeQuiz.index - 1;
    setActiveQuiz({ ...activeQuiz, index: nextIndex });
  };

  const saveStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      showNotice("اكتب اسم الطالب أولًا.");
      return;
    }
    setProgress((current) => ({
      ...current,
      student: {
        name,
        className: String(form.get("className") ?? "").trim(),
        school: String(form.get("school") ?? "").trim(),
      },
    }));
    setScreen("home");
  };

  const resumeLastLesson = () => {
    if (!progress.lastLessonId) {
      showNotice("ابدأ الدرس الأول ليظهر آخر درس هنا.");
      return;
    }
    const target = getLesson(progress.lastLessonId);
    if (!target) return;
    setActiveLessonId(target.id);
    setActiveUnitId(target.unitId);
    setScreen("lesson");
  };

  const resumeLastQuestion = () => {
    if (!progress.lastQuestion) {
      showNotice("لا يوجد سؤال غير مكتمل حاليًا.");
      return;
    }
    startQuiz(progress.lastQuestion.mode, progress.lastQuestion.targetId, progress.lastQuestion);
  };

  const studentFirstName = progress.student.name.split(" ")[0] || "بطل العربية";

  const shellTitle = useMemo(() => {
    if (screen === "unit") return activeUnit.title;
    if (screen === "lesson") return activeLesson.title;
    if (screen === "quiz") return activeQuiz?.mode === "unit" ? "بنك أسئلة الوحدة" : "تحدي الدرس";
    return "رحلة العربية";
  }, [screen, activeUnit.title, activeLesson.title, activeQuiz?.mode]);

  return (
    <div className={`app-shell screen-${screen}`} dir="rtl">
      {screen !== "welcome" && (
        <header className="topbar glass-bar">
          <button className="brand-button" onClick={goHome} aria-label="الصفحة الرئيسية">
            <span className="brand-mark"><BookOpen size={22} /></span>
            <span><b>{shellTitle}</b><small>مع الأستاذ محمد سعيد جعباص</small></span>
          </button>
          <div className="topbar-actions">
            <div className="mini-progress" aria-label={`نسبة التقدم ${overall}%`}>
              <span style={{ width: `${overall}%` }} />
            </div>
            <strong>{overall}%</strong>
            <button className="icon-button" onClick={() => { setSoundOn(!soundOn); window.localStorage.setItem(`${STORAGE_KEY}-sound`, String(!soundOn)); }} aria-label={soundOn ? "كتم الصوت" : "تشغيل الصوت"}>
              {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button className="teacher-trigger" onClick={() => setTeacherOpen(true)}>
              <UserRound size={19} /> تعرّف على معلمك
            </button>
          </div>
        </header>
      )}

      {screen === "welcome" && (
        <main
          className="welcome-screen"
          onPointerMove={(event) => {
            const x = (event.clientX / window.innerWidth - 0.5) * 14;
            const y = (event.clientY / window.innerHeight - 0.5) * 10;
            setParallax({ x, y });
          }}
        >
          <div className="welcome-bg" style={{ transform: `scale(1.04) translate(${parallax.x}px, ${parallax.y}px)` }} />
          <div className="welcome-vignette" />
          <button className="welcome-teacher teacher-trigger" onClick={() => setTeacherOpen(true)}>
            <UserRound size={19} /> تعرّف على معلمك
          </button>
          <section className="welcome-card liquid-glass">
            <div className="welcome-art" aria-hidden="true"><img src="/images/welcome-card.png" alt="" /></div>
            <div className="eyebrow"><Sparkles size={17} /> الصف الأول الإعدادي · الفصل الدراسي الأول</div>
            <h1>رحلة <span>العربية</span></h1>
            <p className="welcome-subtitle">تعلّم، تدرّب، وافتح الدروس خطوةً بخطوة مع الأستاذ محمد سعيد جعباص.</p>

            {!progress.student.name ? (
              <form className="student-form" onSubmit={saveStudent}>
                <label><User size={18} /><input name="name" placeholder="اسم الطالب" autoComplete="name" /></label>
                <div className="form-row">
                  <label><GraduationCap size={18} /><input name="className" placeholder="الفصل / الشعبة" /></label>
                  <label><School size={18} /><input name="school" placeholder="المدرسة (اختياري)" /></label>
                </div>
                <button className="primary-button large" type="submit"><Play size={20} fill="currentColor" /> ابدأ رحلتك</button>
              </form>
            ) : (
              <div className="returning-student">
                <div className="student-greeting"><span>أهلًا يا</span><strong>{studentFirstName}</strong><small>{progress.student.className || "جاهز لمغامرة جديدة؟"}</small></div>
                <div className="resume-grid">
                  <button onClick={resumeLastLesson} disabled={!progress.lastLessonId}>
                    <BookMarked size={22} /><span><b>استكمال آخر درس</b><small>{progress.lastLessonId ? getLesson(progress.lastLessonId)?.title : "لا يوجد درس محفوظ"}</small></span><ChevronLeft size={20} />
                  </button>
                  <button onClick={resumeLastQuestion} disabled={!progress.lastQuestion}>
                    <CircleHelp size={22} /><span><b>استكمال آخر سؤال</b><small>{progress.lastQuestion ? `السؤال ${progress.lastQuestion.index + 1}` : "لا يوجد اختبار محفوظ"}</small></span><ChevronLeft size={20} />
                  </button>
                </div>
                <button className="primary-button" onClick={goHome}><Home size={19} /> الصفحة الرئيسية</button>
              </div>
            )}
          </section>
        </main>
      )}

      {screen === "home" && (
        <main className="content-page home-page">
          <section className="home-hero">
            <div>
              <span className="eyebrow"><Sparkles size={17} /> صباح المعرفة</span>
              <h1>أهلًا يا {studentFirstName} 👋</h1>
              <p>كل إجابة صحيحة تقرّبك من فتح الدرس التالي. واصل رحلتك بثقة.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => openUnit(units[0])}><Play size={19} fill="currentColor" /> ابدأ التعلّم</button>
                <button className="secondary-button" onClick={resumeLastLesson}><BookMarked size={19} /> آخر درس</button>
              </div>
            </div>
            <div className="progress-orbit">
              <div className="progress-ring" style={{ "--value": `${overall * 3.6}deg` } as React.CSSProperties}>
                <span><b>{overall}%</b><small>من المنهج</small></span>
              </div>
              <div className="orbit-star"><Star size={20} fill="currentColor" /></div>
            </div>
          </section>

          <section className="stats-grid">
            <article><span className="stat-icon teal"><CheckCircle2 /></span><div><b>{completedCount}</b><small>درسًا مكتملًا</small></div></article>
            <article><span className="stat-icon blue"><Trophy /></span><div><b>{progress.completedUnits.length}</b><small>وحدة مكتملة</small></div></article>
            <article><span className="stat-icon gold"><Star /></span><div><b>{Object.values(progress.lessonScores).reduce((sum, value) => sum + value, 0)}</b><small>نقطة معرفة</small></div></article>
          </section>

          <section className="section-block">
            <div className="section-heading"><div><span>خريطة الرحلة</span><h2>الوحدات التعليمية</h2></div><small>تُفتح بالترتيب بعد اجتياز التحديات بنسبة 70%</small></div>
            <div className="unit-grid">
              {units.map((unit) => {
                const unlocked = unitUnlocked(unit);
                const lessonDone = unit.lessons.filter((item) => progress.completedLessons.includes(item.id)).length;
                return (
                  <button key={unit.id} className={`unit-card ${unlocked ? "" : "locked"}`} onClick={() => openUnit(unit)}>
                    <img src={unit.image} alt="" />
                    <span className="card-shade" />
                    {!unlocked && <span className="lock-badge"><LockKeyhole size={20} /></span>}
                    <span className="unit-number">الوحدة {unit.order}</span>
                    <span className="unit-card-content"><b>{unit.title}</b><small>{unit.subtitle}</small><em>{lessonDone} / {unit.lessons.length} دروس</em></span>
                    <span className="card-progress"><i style={{ width: `${(lessonDone / unit.lessons.length) * 100}%`, background: unit.accent }} /></span>
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {screen === "unit" && (
        <main className="content-page">
          <button className="back-link" onClick={goHome}><ArrowLeft size={18} /> العودة للرئيسية</button>
          <section className="unit-banner" style={{ backgroundImage: `url(${activeUnit.image})` }}>
            <div className="unit-banner-shade" />
            <div><span>الوحدة {activeUnit.order}</span><h1>{activeUnit.title}</h1><p>{activeUnit.description}</p></div>
            <div className="unit-banner-score"><Medal size={28} /><b>{progress.unitScores[activeUnit.id] ?? 0}%</b><small>أفضل نتيجة</small></div>
          </section>
          <section className="section-block">
            <div className="section-heading"><div><span>تعلّم بالترتيب</span><h2>دروس الوحدة</h2></div><small>كل درس يحتوي على 30 سؤالًا مباشرًا</small></div>
            <div className="lesson-grid">
              {activeUnit.lessons.map((item, index) => {
                const unlocked = lessonUnlocked(activeUnit, index);
                const completed = progress.completedLessons.includes(item.id);
                return (
                  <button key={item.id} className={`lesson-card ${unlocked ? "" : "locked"}`} onClick={() => openLesson(activeUnit, item.id, index)}>
                    <div className="lesson-image"><img src={item.image} alt="" />{!unlocked && <span><LockKeyhole /></span>}{completed && <i><CheckCircle2 fill="currentColor" /></i>}</div>
                    <div className="lesson-info"><span>الدرس {index + 1} · {item.kind}</span><b>{item.title}</b><small>{item.subtitle}</small><em><Clock3 size={15} /> صفحات {item.pages}<i>{progress.lessonScores[item.id] ?? 0}%</i></em></div>
                  </button>
                );
              })}
            </div>
          </section>
          <section className={`unit-bank-card ${unitBankUnlocked(activeUnit) ? "" : "locked"}`}>
            <div className="bank-icon"><Brain size={34} /></div>
            <div><span>التحدي الختامي</span><h3>بنك أسئلة الوحدة · 50 سؤالًا</h3><p>{unitBankUnlocked(activeUnit) ? "أصبحت جاهزًا لاختبار الوحدة وفتح الوحدة التالية." : "أكمل الدروس الأربعة أولًا لفتح بنك الأسئلة."}</p></div>
            <button className="primary-button" disabled={!unitBankUnlocked(activeUnit)} onClick={() => startQuiz("unit", activeUnit.id)}>{unitBankUnlocked(activeUnit) ? <Play size={18} /> : <LockKeyhole size={18} />} ابدأ البنك</button>
          </section>
        </main>
      )}

      {screen === "lesson" && (
        <main className="content-page lesson-page">
          <button className="back-link" onClick={() => setScreen("unit")}><ArrowLeft size={18} /> العودة للوحدة</button>
          <section className="lesson-hero" style={{ backgroundImage: `url(${activeLesson.image})` }}>
            <div className="lesson-hero-shade" />
            <div><span>{activeLesson.kind} · صفحات {activeLesson.pages}</span><h1>{activeLesson.title}</h1><p>{activeLesson.subtitle}</p></div>
            <div className="lesson-score"><Star size={24} fill="currentColor" /><b>{progress.lessonScores[activeLesson.id] ?? 0}%</b><small>أفضل نتيجة</small></div>
          </section>

          <section className="lesson-layout">
            <div className="lesson-main">
              <article className="summary-card"><span className="section-icon"><BookOpen /></span><div><h2>فكرة الدرس</h2><p>{activeLesson.summary}</p></div></article>
              <div className="objectives-card"><h3><Target size={22} /> أهداف التعلّم</h3><ul>{activeLesson.objectives.map((item) => <li key={item}><CheckCircle2 size={18} />{item}</li>)}</ul></div>
              <div className="lesson-sections">
                {activeLesson.sections.map((section, index) => (
                  <article key={section.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{section.title}</h3><p>{section.text}</p></div></article>
                ))}
              </div>
              <div className="knowledge-cards"><h3><Lightbulb size={22} /> بطاقات مراجعة سريعة</h3><div>{activeLesson.facts.slice(0, 6).map((item) => <article key={item.question}><small>{item.question}</small><b>{item.answer}</b></article>)}</div></div>
            </div>
            <aside className="lesson-aside glass-panel">
              <span className="aside-icon"><ListChecks /></span><h3>تحدي الدرس</h3><strong>30 سؤالًا</strong><p>أسئلة مباشرة من الشرح، مع تصحيح فوري وتفسير مختصر.</p><div className="pass-note"><Trophy size={18} /> نسبة الفتح المطلوبة: 70%</div>
              <button className="primary-button large" onClick={() => startQuiz("lesson", activeLesson.id)}><Play size={19} fill="currentColor" /> ابدأ الأسئلة</button>
              <small><Save size={15} /> يتم حفظ إجابتك بعد كل سؤال.</small>
            </aside>
          </section>
        </main>
      )}

      {screen === "quiz" && activeQuiz && (() => {
        const question = activeQuiz.questions[activeQuiz.index];
        const selected = activeQuiz.answers[activeQuiz.index];
        const isAnswered = Boolean(selected);
        const isCorrect = selected === question.answer;
        const percent = Math.round(((activeQuiz.index + 1) / activeQuiz.questions.length) * 100);
        return (
          <main className="quiz-page">
            <section className="quiz-shell liquid-glass">
              <div className="quiz-head">
                <button className="icon-button" onClick={() => setScreen(activeQuiz.mode === "unit" ? "unit" : "lesson")} aria-label="الخروج من الاختبار"><X /></button>
                <div><span>{activeQuiz.mode === "unit" ? "بنك أسئلة الوحدة" : "تحدي الدرس"}</span><b>السؤال {activeQuiz.index + 1} من {activeQuiz.questions.length}</b></div>
                <span className="quiz-percent">{percent}%</span>
              </div>
              <div className="quiz-progress"><span style={{ width: `${percent}%` }} /></div>
              <div className="question-card">
                <div className="question-type"><Brain size={17} /> {question.type}</div>
                <h1>{question.prompt}</h1>
                <div className="answers-grid">
                  {question.options.map((option, index) => {
                    const chosen = selected === option;
                    const className = !isAnswered ? "" : option === question.answer ? "correct" : chosen ? "wrong" : "dimmed";
                    return <button key={`${question.id}-${option}`} className={className} onClick={() => !isAnswered && selectAnswer(option)}><span>{["أ", "ب", "ج", "د"][index] ?? index + 1}</span><b>{option}</b>{chosen && (isCorrect ? <CheckCircle2 /> : <X />)}</button>;
                  })}
                </div>
                {isAnswered && <div className={`feedback ${isCorrect ? "positive" : "negative"}`}><span>{isCorrect ? <CheckCircle2 /> : <CircleHelp />}</span><div><b>{isCorrect ? "إجابة رائعة!" : `الإجابة الصحيحة: ${question.answer}`}</b><p>{question.explanation}</p></div></div>}
              </div>
              <div className="quiz-footer">
                <button className="secondary-button" onClick={previousQuestion} disabled={activeQuiz.index === 0}><ArrowLeft size={18} /> السابق</button>
                <span><Save size={15} /> محفوظ تلقائيًا</span>
                <button className="primary-button" onClick={nextQuestion} disabled={!isAnswered}>{activeQuiz.index === activeQuiz.questions.length - 1 ? "اعرض النتيجة" : "السؤال التالي"}<ChevronLeft size={18} /></button>
              </div>
            </section>
          </main>
        );
      })()}

      {screen === "result" && result && (
        <main className="result-page">
          {result.passed && <div className="confetti" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div>}
          <section className={`result-card liquid-glass ${result.passed ? "passed" : "retry"}`}>
            <div className="result-medal">{result.passed ? <Trophy /> : <RotateCcw />}</div>
            <span>{result.passed ? "أحسنت يا بطل!" : "محاولة جيدة"}</span>
            <h1>{result.score}%</h1>
            <p>{result.passed ? "اجتزت التحدي وتم فتح المرحلة التالية في رحلتك." : "تحتاج إلى 70% للفتح. راجع الدرس ثم حاول مرة أخرى."}</p>
            <div className="result-actions">
              <button className="primary-button" onClick={() => startQuiz(result.mode, result.targetId)}><RotateCcw size={18} /> إعادة التحدي</button>
              <button className="secondary-button" onClick={result.mode === "unit" ? goHome : () => setScreen("unit")}><Home size={18} /> متابعة الرحلة</button>
            </div>
          </section>
        </main>
      )}

      {teacherOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTeacherOpen(false); }}>
          <section className="teacher-modal liquid-glass" role="dialog" aria-modal="true" aria-labelledby="teacher-title">
            <button className="modal-close" onClick={() => setTeacherOpen(false)} aria-label="إغلاق"><X /></button>
            <div className="teacher-photo-wrap"><span className="photo-glow" /><img src="/images/teacher-mohamed-saeed.jpg" alt="الأستاذ محمد سعيد جعباص" /><div className="photo-ribbon"><Sparkles size={16} /> معلم اللغة العربية</div></div>
            <div className="teacher-content">
              <span className="eyebrow"><UserRound size={17} /> تعرّف على معلمك</span>
              <h2 id="teacher-title">الأستاذ محمد سعيد جعباص</h2>
              <p>معلم بمدارس الأندلس الأهلية في جدة منذ عام 2012، يجمع بين الخبرة الصفية والتعلم التعاوني والتقنيات التعليمية الحديثة.</p>
              <div className="teacher-stats"><article><b>+14</b><small>عام خبرة</small></article><article><b>2011</b><small>ليسانس اللغة العربية</small></article><article><b>2012</b><small>دبلوم عام في التربية</small></article></div>
              <div className="credentials">
                <h3><GraduationCap size={20} /> المؤهلات والخبرات</h3>
                <ul>
                  <li>ليسانس اللغة العربية وآدابها والعلوم الإسلامية – كلية دار العلوم، جامعة القاهرة.</li>
                  <li>الدبلوم العام في التربية، شعبة اللغة العربية والعلوم الإسلامية.</li>
                  <li>الشهادة الدولية لقيادة الحاسب الآلي ICDL من Microsoft.</li>
                  <li>شهادة التعلم التعاوني الدولية من Kagan.</li>
                  <li>دورات إعداد معلمي العربية للناطقين بغيرها ومهارات المعلم المحترف.</li>
                  <li>دورة المعلم الرقمي من شركة ميد.</li>
                  <li>دورة الذكاء الاصطناعي للمعلمين.</li>
                  <li>دبلومات مصغرة في التنمية البشرية والقيم التربوية وإدارة الفصل والتواصل الفعال.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {notice && <div className="toast"><LockKeyhole size={19} />{notice}</div>}

      <footer className={screen === "welcome" ? "welcome-footer" : "site-footer"}>
        <span>مطور التطبيق:</span>
        <a href="https://www.facebook.com/mr.mahmmd" target="_blank" rel="noreferrer"><b>مستر محمد فريد</b><Facebook size={14} fill="currentColor" /></a>
        <i aria-hidden="true">•</i>
        <a className="whatsapp-link" href="https://wa.me/966552019074" target="_blank" rel="noreferrer" aria-label="مراسلة مطور التطبيق عبر واتساب" title="واتساب">
          <WhatsAppIcon size={17} />
        </a>
      </footer>
    </div>
  );
}
