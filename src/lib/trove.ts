import { distractorsById } from "@/lib/distractors";
import type { LessonSession, QuizOption, SessionMode, SourceLink, Topic, Tradition } from "@/lib/types";

type SourceKey =
  | "heschelJts"
  | "alanLewHachette"
  | "morinisInstitute"
  | "gillmanJts"
  | "zoharBritannica"
  | "shekhinahBritannica"
  | "jewishEncyclopediaShekhinah"
  | "sefariaAvot114"
  | "sefariaAvot216"
  | "sefariaMicah68"
  | "michaelsonBody"
  | "everydayZenFischer"
  | "everydayZenAbout"
  | "zmmEightGates"
  | "greenGulch"
  | "sonomaZen"
  | "fourNobleTruths"
  | "satipatthana"
  | "dhammapada"
  | "heartSutra"
  | "avalokiteshvara"
  | "lotusSutra25"
  | "bashoBritannica"
  | "ikkyuEncyclopedia"
  | "hintonWild"
  | "rupaSingh"
  | "buddhistAiMdpi";

type TroveItem = {
  id: string;
  tradition: Tradition;
  title: string;
  summary: string;
  difficulty: Topic["difficulty"];
  visual: Topic["visual"];
  cluster: string;
  figures: string[];
  themes: string[];
  keyLine: string;
  anchor?: {
    text: string;
    attribution: string;
  };
  context: string[];
  deepening: string;
  practice: string;
  takeaway: string;
  reflection: string;
  closingLine: string;
  question: string;
  correctAnswer: string;
  sourceKeys: SourceKey[];
};

const sources: Record<SourceKey, SourceLink> = {
  heschelJts: {
    title: "JTS: Heschel's Life and Work",
    url: "https://heschel.jtsa.edu/life-and-work/",
    note: "Primary institutional timeline for Heschel's works, activism, prophecy, and JTS years.",
  },
  alanLewHachette: {
    title: "Hachette: Alan Lew, This Is Real and You Are Completely Unprepared",
    url: "https://www.hachettebookgroup.com/titles/alan-lew/this-is-real-and-you-are-completely-unprepared/9780759528215/?lens=little-brown",
    note: "Publisher context for Lew's Days of Awe journey and Zen rabbi biography.",
  },
  morinisInstitute: {
    title: "The Mussar Institute: About Alan Morinis",
    url: "https://mussarinstitute.org/about-alan-morinis/",
    note: "Contemporary Mussar revival, Alan Morinis bibliography, and practice context.",
  },
  gillmanJts: {
    title: "JTS: Neil Gillman",
    url: "https://www.jtsa.edu/team/neil-gillman/",
    note: "Gillman's biography, major works, and role in Conservative Jewish theology.",
  },
  zoharBritannica: {
    title: "Britannica: Sefer ha-Zohar",
    url: "https://www.britannica.com/topic/Sefer-ha-zohar",
    note: "Overview of the Zohar, its Aramaic texture, inner Torah reading, and authorship history.",
  },
  shekhinahBritannica: {
    title: "Britannica: Shekhina",
    url: "https://www.britannica.com/topic/Shekhina",
    note: "Concise history of Shekhinah as divine dwelling or presence in Jewish theology.",
  },
  jewishEncyclopediaShekhinah: {
    title: "Jewish Encyclopedia: Shekinah",
    url: "https://www.jewishencyclopedia.com/articles/13537-shekinah",
    note: "Public-domain background on rabbinic uses of Shekhinah and divine presence.",
  },
  sefariaAvot114: {
    title: "Sefaria: Pirkei Avot 1:14",
    url: "https://www.sefaria.org/Pirkei_Avot.1.14?lang=bi",
    note: "Hillel's teaching on self, responsibility, and urgency.",
  },
  sefariaAvot216: {
    title: "Sefaria: Pirkei Avot 2:16",
    url: "https://www.sefaria.org/Pirkei_Avot.2.16?lang=bi",
    note: "Rabbi Tarfon's teaching on unfinished work and faithful participation.",
  },
  sefariaMicah68: {
    title: "Sefaria: Micah 6:8",
    url: "https://www.sefaria.org/Micah.6.8?lang=bi",
    note: "Prophetic triad of justice, kindness, and humility.",
  },
  michaelsonBody: {
    title: "Jay Michaelson: God in Your Body",
    url: "https://www.jaymichaelson.net/books/godinyourbody/",
    note: "Embodied Jewish spirituality, Kabbalah, mindfulness, and daily ritual practice.",
  },
  everydayZenFischer: {
    title: "Everyday Zen: Zoketsu Norman Fischer",
    url: "https://everydayzen.org/about/norman-fischer/",
    note: "Fischer's Zen teaching, Jewish meditation work, Makor Or, poetry, and interreligious practice.",
  },
  everydayZenAbout: {
    title: "Everyday Zen Foundation: About",
    url: "https://everydayzen.org/about/",
    note: "Everyday Zen's mission, Dogen/Suzuki lineage, and everyday-life practice emphasis.",
  },
  zmmEightGates: {
    title: "Zen Mountain Monastery: Eight Gates of Zen",
    url: "https://zmm.org/eight-gates-of-zen/",
    note: "John Daido Loori's matrix for training through meditation, study, art, body, and work.",
  },
  greenGulch: {
    title: "San Francisco Zen Center: Green Gulch Farm",
    url: "https://www.sfzc.org/locations/green-gulch-farm",
    note: "Soto Zen practice center integrating meditation, philosophy, and work practice.",
  },
  sonomaZen: {
    title: "Sonoma Mountain Zen Center: Programs",
    url: "https://www.smzc.org/programs",
    note: "Local zazen and everyday-life practice context in the Shunryu Suzuki lineage.",
  },
  fourNobleTruths: {
    title: "Britannica: Four Noble Truths",
    url: "https://www.britannica.com/topic/Four-Noble-Truths",
    note: "Reliable overview of dukkha, craving, cessation, and the path.",
  },
  satipatthana: {
    title: "Access to Insight: Satipatthana Sutta",
    url: "https://www.accesstoinsight.org/tipitaka/mn/mn.010.nysa.html",
    note: "Four foundations of mindfulness: body, feelings, mind, and mental objects.",
  },
  dhammapada: {
    title: "Project Gutenberg: The Dhammapada",
    url: "https://www.gutenberg.org/files/2017/2017-h/2017-h.htm",
    note: "Public-domain Dhammapada translation useful for concise ethical anchor lines.",
  },
  heartSutra: {
    title: "Sacred Texts: Heart Sutra",
    url: "https://www.sacred-texts.com/bud/tib/hrt.htm",
    note: "Public-domain Heart Sutra translation centered on emptiness and form.",
  },
  avalokiteshvara: {
    title: "Britannica: Avalokiteshvara",
    url: "https://www.britannica.com/topic/Avalokiteshvara",
    note: "Avalokiteshvara, Guanyin, and Kannon as compassion figures across Buddhist cultures.",
  },
  lotusSutra25: {
    title: "Lotus Sutra Chapter 25",
    url: "https://lotus-sutra.xyz/en/chapters/25-universal-gateway/",
    note: "Universal Gateway chapter and the listening compassion of Avalokiteshvara.",
  },
  bashoBritannica: {
    title: "Britannica: Basho",
    url: "https://www.britannica.com/biography/Basho-Japanese-poet",
    note: "Basho's haiku, travel, Zen study, and attention to small things.",
  },
  ikkyuEncyclopedia: {
    title: "Encyclopedia.com: Ikkyu Sojun",
    url: "https://www.encyclopedia.com/environment/encyclopedias-almanacs-transcripts-and-maps/ikkyu-sojun",
    note: "Ikkyu as Zen poet, calligrapher, eccentric, and Rinzai reforming figure.",
  },
  hintonWild: {
    title: "David Hinton: Wild Mind, Wild Earth",
    url: "https://www.davidhinton.net/wild-mind-wild-earth",
    note: "Chan, ancient Chinese thought, ecology, and the kinship of mind and earth.",
  },
  rupaSingh: {
    title: "Rupa Singh: Published Books",
    url: "https://www.rupasingh.org/books",
    note: "AI Ethics with a Buddhist Perspective and applied ethics bridgework.",
  },
  buddhistAiMdpi: {
    title: "Religions: Between No-Self and the Algorithm",
    url: "https://www.mdpi.com/2077-1444/17/3/378",
    note: "Recent open-access work on Buddhist no-self, AI design, non-harm, and moral agency.",
  },
};

const trove: TroveItem[] = [
  {
    id: "heschel-sabbath-time",
    tradition: "judaism",
    title: "Heschel and the Architecture of Sacred Time",
    summary: "Shabbat becomes a disciplined rebellion against reducing life to production.",
    difficulty: "medium",
    visual: "candles",
    cluster: "Jewish prophetic and ethical spirituality",
    figures: ["Abraham Joshua Heschel"],
    themes: ["Shabbat", "awe", "time", "rest", "human dignity"],
    keyLine: "Sacred time asks what kind of person a pause can make.",
    anchor: {
      text: "palace in time",
      attribution: "Abraham Joshua Heschel, The Sabbath",
    },
    context: [
      "Heschel's The Sabbath is not mainly a manual of rules. It is a philosophy of time, asking why human beings need rhythm, delight, restraint, and release.",
      "For Heschel, Judaism trains attention toward holiness in time as much as holiness in place. That makes Shabbat a sanctuary carried by practice rather than architecture.",
      "This topic can be challenging because rest is not passive here. Rest becomes a form of moral resistance against endless usefulness and anxious self-measurement.",
    ],
    deepening:
      "The deeper move is to ask whether a person can stop producing long enough to receive existence as gift.",
    practice:
      "choose one small thing not to optimize for a few minutes: a cup of tea, a candle, a page, a breath, or a conversation.",
    takeaway: "Shabbat can be studied as sacred time, not merely time off.",
    reflection: "Where does your life still know how to stop without becoming empty?",
    closingLine: "Let time be spacious enough to bless you back.",
    question: "What is the deeper challenge in Heschel's view of Shabbat?",
    correctAnswer: "To let rest reshape what we value, not merely recover energy for work.",
    sourceKeys: ["heschelJts"],
  },
  {
    id: "heschel-prophets-moral-audacity",
    tradition: "judaism",
    title: "The Prophet as Moral Nerve Ending",
    summary: "Heschel reads prophecy as the refusal to grow numb to another person's pain.",
    difficulty: "medium",
    visual: "teacher",
    cluster: "Jewish prophetic and ethical spirituality",
    figures: ["Abraham Joshua Heschel"],
    themes: ["prophecy", "justice", "civil rights", "moral urgency"],
    keyLine: "Prophecy is not prediction first; it is sensitivity before power.",
    anchor: {
      text: "moral grandeur and spiritual audacity",
      attribution: "Abraham Joshua Heschel",
    },
    context: [
      "Heschel's work on the prophets grew from his scholarship and from his public life. He studied prophetic consciousness and also marched, wrote, taught, and argued.",
      "The prophet, in this frame, is not a remote fortune-teller. The prophet is a person whose conscience has not been anaesthetized by normal cruelty.",
      "This helps connect Jewish text study with social responsibility without making the tradition merely political. The inner life and the public life answer each other.",
    ],
    deepening:
      "A hard question follows: what suffering has become normal enough that we no longer feel it as an interruption?",
    practice:
      "name one public issue without arguing about it, then ask what concrete act of dignity would be possible today.",
    takeaway: "Prophetic spirituality joins awe, moral perception, and action.",
    reflection: "What do you refuse to become numb to?",
    closingLine: "May conscience stay tender without becoming brittle.",
    question: "In this reflection, what makes prophecy spiritually demanding?",
    correctAnswer: "It joins inward awe with outward responsibility for real people.",
    sourceKeys: ["heschelJts", "sefariaMicah68"],
  },
  {
    id: "alan-lew-teshuvah-unprepared",
    tradition: "judaism",
    title: "Alan Lew and the Work of Returning",
    summary: "Teshuvah is treated as a whole journey through honesty, loss, preparation, and return.",
    difficulty: "medium",
    visual: "river",
    cluster: "Jewish meditation and Zen bridge",
    figures: ["Rabbi Alan Lew"],
    themes: ["teshuvah", "Days of Awe", "preparation", "return", "presence"],
    keyLine: "Return begins when life can no longer be postponed.",
    anchor: {
      text: "This is real",
      attribution: "Alan Lew, book title",
    },
    context: [
      "Lew's Days of Awe writing treats the High Holy Day season as a spiritual itinerary, not only a set of synagogue dates.",
      "The movement from Tisha B'Av through Yom Kippur becomes a way of facing what breaks, what repeats, what must be confessed, and what might be renewed.",
      "His Zen background matters because he brings attention, sitting, and immediacy into Jewish ritual without dissolving Jewish practice into generic mindfulness.",
    ],
    deepening:
      "The demanding part is that teshuvah does not ask for self-hatred. It asks for enough courage to stop evading reality.",
    practice:
      "quietly finish this sentence: one thing I keep circling back to is...",
    takeaway: "Teshuvah is return through honest presence, not spiritual self-punishment.",
    reflection: "What would it mean to return without pretending nothing happened?",
    closingLine: "The gate opens where avoidance softens.",
    question: "What distinguishes Lew's approach to teshuvah here?",
    correctAnswer: "It treats return as a lived journey of attention, honesty, and ritual.",
    sourceKeys: ["alanLewHachette", "everydayZenFischer"],
  },
  {
    id: "morinis-middot-curriculum",
    tradition: "judaism",
    title: "Mussar and the Personal Curriculum",
    summary: "Alan Morinis presents character as something practiced with precision and mercy.",
    difficulty: "medium",
    visual: "seedling",
    cluster: "Jewish prophetic and ethical spirituality",
    figures: ["Alan Morinis", "The Mussar Institute"],
    themes: ["Mussar", "middot", "humility", "patience", "discipline"],
    keyLine: "The soul-trait you avoid may be the lesson waiting at the door.",
    context: [
      "Mussar is a Jewish ethical and spiritual discipline focused on middot, the traits or measures of the soul.",
      "Morinis helped revive Mussar for contemporary seekers, using study, journaling, small practices, and honest self-observation.",
      "The tradition is practical but not shallow. It assumes that character is shaped by repeated attention, small vows, community, and accountability.",
    ],
    deepening:
      "The serious move is to stop asking only what you believe and ask what your habits are training you to become.",
    practice:
      "choose one middah for today, such as patience or humility, and notice one moment when it is tested.",
    takeaway: "Mussar makes inner life concrete through disciplined ethical practice.",
    reflection: "Which trait in you needs strengthening, softening, or balance?",
    closingLine: "A small practice can reveal a whole life curriculum.",
    question: "What is the main aim of Mussar in this lesson?",
    correctAnswer: "To refine character through repeated, concrete ethical practice.",
    sourceKeys: ["morinisInstitute"],
  },
  {
    id: "gillman-sacred-fragments",
    tradition: "judaism",
    title: "Neil Gillman and Sacred Fragments",
    summary: "Modern theology becomes a mature practice of building meaning without pretending certainty is simple.",
    difficulty: "medium",
    visual: "scroll",
    cluster: "Modern Jewish theology",
    figures: ["Rabbi Neil Gillman"],
    themes: ["theology", "belief", "Conservative Judaism", "modernity"],
    keyLine: "A fragment can be sacred without claiming to be the whole.",
    context: [
      "Gillman was a major Conservative Jewish theologian whose work helped modern Jews think honestly about God, revelation, community, and mortality.",
      "His title Sacred Fragments is useful for this app because it honors partial understanding without making partiality a failure.",
      "Rather than treating theology as a list of correct answers, Gillman invites a reflective way of doing Jewish theology from within lived Jewish life.",
    ],
    deepening:
      "The deeper challenge is intellectual humility: belief can be serious even when it is interpretive, evolving, and unfinished.",
    practice:
      "name one belief, doubt, or image of God that has changed over your life and let it be part of the conversation.",
    takeaway: "Modern Jewish theology can be faithful, questioning, and self-aware at once.",
    reflection: "Which sacred fragment still asks for your attention?",
    closingLine: "Not every truth arrives as a completed system.",
    question: "What makes Gillman's approach useful for reflective learning?",
    correctAnswer: "It gives permission to think theologically with honesty and humility.",
    sourceKeys: ["gillmanJts"],
  },
  {
    id: "zohar-radiance-inner-torah",
    tradition: "judaism",
    title: "The Zohar and the Hidden Radiance of Text",
    summary: "Kabbalah reads Torah as layered, symbolic, erotic, cosmic, and alive.",
    difficulty: "medium",
    visual: "gate",
    cluster: "Jewish mysticism and Kabbalah",
    figures: ["The Zohar", "Rabbi Shimon bar Yochai", "Moses de Leon", "Nathan Wolski"],
    themes: ["Zohar", "Kabbalah", "symbol", "hidden meaning", "Torah"],
    keyLine: "The surface of a sacred text may be a door, not a wall.",
    anchor: {
      text: "Come and see",
      attribution: "Recurring Zoharic invitation",
    },
    context: [
      "The Zohar is the classic text of Jewish mysticism, mostly Aramaic, built around symbolic readings of Torah.",
      "Tradition links it to Rabbi Shimon bar Yochai, while modern scholarship places its major composition or publication in medieval Spain around Moses de Leon.",
      "That tension is itself a rich topic: mystical authority can be carried by story, tradition, language, historical emergence, and devotional imagination.",
    ],
    deepening:
      "The demanding question is how to read a text as alive without losing responsibility to history and interpretation.",
    practice:
      "take one familiar sentence and ask what image, emotion, or hidden question is moving beneath it.",
    takeaway: "Zohar study invites layered reading rather than flat certainty.",
    reflection: "What changes when a text asks you to come and see?",
    closingLine: "May the hidden layer deepen the visible one.",
    question: "What is one mature way to approach the Zohar?",
    correctAnswer: "Hold traditional reverence and historical awareness together.",
    sourceKeys: ["zoharBritannica"],
  },
  {
    id: "shekhinah-presence-exile",
    tradition: "judaism",
    title: "Shekhinah as Nearness in Exile",
    summary: "The divine presence is imagined as dwelling with people rather than hovering far away.",
    difficulty: "medium",
    visual: "candles",
    cluster: "Jewish mysticism and Kabbalah",
    figures: ["Shekhinah"],
    themes: ["divine presence", "exile", "indwelling", "Kabbalah", "feminine imagery"],
    keyLine: "Presence can be intimate without being easy to possess.",
    anchor: {
      text: "Dwelling",
      attribution: "Meaning of Shekhinah",
    },
    context: [
      "Shekhinah names divine presence or dwelling in rabbinic, midrashic, and kabbalistic traditions.",
      "In later mystical imagination, Shekhinah can carry feminine-coded imagery, exile, longing, radiance, and intimacy.",
      "This is not simple goddess language pasted onto Judaism. It is a complex Jewish vocabulary for divine nearness, absence, and relationship.",
    ],
    deepening:
      "The subtle question is how presence can be real even when the world feels fractured or the divine feels hidden.",
    practice:
      "notice one place today where nearness appears quietly: a room, a voice, a remembered blessing, a small kindness.",
    takeaway: "Shekhinah offers a Jewish language for divine nearness amid fracture.",
    reflection: "Where do you sense presence without needing to explain it away?",
    closingLine: "May the dwelling place be found in the ordinary room.",
    question: "What does Shekhinah help name in this reflection?",
    correctAnswer: "Divine nearness, dwelling, and presence within lived experience.",
    sourceKeys: ["shekhinahBritannica", "jewishEncyclopediaShekhinah"],
  },
  {
    id: "hillel-self-other-now",
    tradition: "judaism",
    title: "Hillel: Self, Other, Now",
    summary: "A compact teaching refuses both self-erasure and selfishness.",
    difficulty: "medium",
    visual: "teacher",
    cluster: "Jewish ethical wisdom",
    figures: ["Hillel"],
    themes: ["Pirkei Avot", "selfhood", "responsibility", "urgency"],
    keyLine: "The self is responsible, relational, and time-bound.",
    anchor: {
      text: "If not now, when?",
      attribution: "Pirkei Avot 1:14",
    },
    context: [
      "Pirkei Avot preserves Hillel's three-part question about being for oneself, being only for oneself, and acting now.",
      "The teaching is balanced and psychologically sharp. It refuses martyr-like disappearance and refuses isolated ego.",
      "It also refuses endless deferral. Wisdom is not only what one understands later; it is what one is willing to begin now.",
    ],
    deepening:
      "The harder move is to ask which of the three clauses you naturally avoid: self-care, obligation to others, or action now.",
    practice:
      "choose one clause and answer it honestly in a sentence.",
    takeaway: "Jewish ethics can hold selfhood and responsibility together.",
    reflection: "Which part of Hillel's question speaks loudest today?",
    closingLine: "May self and other meet in the present tense.",
    question: "What does Hillel's teaching avoid?",
    correctAnswer: "Both selfish isolation and the erasure of one's own responsibility.",
    sourceKeys: ["sefariaAvot114"],
  },
  {
    id: "tarfon-unfinished-work",
    tradition: "judaism",
    title: "The Work Is Not Yours to Finish",
    summary: "Rabbi Tarfon offers an ethic of effort without grandiosity.",
    difficulty: "medium",
    visual: "seedling",
    cluster: "Jewish ethical wisdom",
    figures: ["Rabbi Tarfon"],
    themes: ["Pirkei Avot", "repair", "limits", "perseverance"],
    keyLine: "Humility is not quitting; it is knowing your place in a longer work.",
    anchor: {
      text: "not free to desist",
      attribution: "Pirkei Avot 2:16",
    },
    context: [
      "Pirkei Avot 2:16 is often used as a spiritual counterweight to despair and perfectionism.",
      "The teaching refuses two temptations: imagining you must fix everything, and imagining your contribution does not matter.",
      "It is especially useful for tikkun olam because repair is usually inherited, partial, intergenerational, and unfinished.",
    ],
    deepening:
      "The mature question is how to act seriously without needing heroic control over outcomes.",
    practice:
      "identify one unfinished good work and one small faithful action that belongs to today.",
    takeaway: "Repair is a shared discipline, not a private burden to complete.",
    reflection: "What part of the work is genuinely yours today?",
    closingLine: "Do the next faithful piece.",
    question: "What balance does this teaching offer?",
    correctAnswer: "It joins humility about limits with responsibility to keep acting.",
    sourceKeys: ["sefariaAvot216"],
  },
  {
    id: "micah-justice-kindness-humility",
    tradition: "judaism",
    title: "Micah's Threefold Demand",
    summary: "Justice, kindness, and humility become a portable map of moral life.",
    difficulty: "medium",
    visual: "scroll",
    cluster: "Jewish prophetic and ethical spirituality",
    figures: ["Micah"],
    themes: ["justice", "kindness", "humility", "prophets", "ethics"],
    keyLine: "A life can be tested by what it does, loves, and walks with.",
    anchor: {
      text: "do justice",
      attribution: "Micah 6:8",
    },
    context: [
      "Micah 6:8 condenses prophetic religion into action, affection, and posture: justice, kindness, and humble walking.",
      "The order matters. Justice is not sentimental, kindness is not passive, and humility is not humiliation.",
      "The verse is beloved because it is memorable, but it remains demanding because each word can expose the evasions of a whole life.",
    ],
    deepening:
      "A challenging reading asks which word you prefer and which word you subtly neglect.",
    practice:
      "choose justice, kindness, or humility as today's lens and let one ordinary interaction be shaped by it.",
    takeaway: "Prophetic ethics can be compact without being simplistic.",
    reflection: "Which of the three asks the most of you right now?",
    closingLine: "Walk humbly, but do not walk away.",
    question: "What makes Micah 6:8 more than a slogan?",
    correctAnswer: "It asks for action, love, and humility in daily life.",
    sourceKeys: ["sefariaMicah68"],
  },
  {
    id: "michaelson-body-as-practice",
    tradition: "judaism",
    title: "Jay Michaelson and the Body as Practice",
    summary: "Embodied Judaism treats eating, standing, breathing, and restraint as spiritual sites.",
    difficulty: "medium",
    visual: "stones",
    cluster: "Jewish mysticism and embodied practice",
    figures: ["Jay Michaelson"],
    themes: ["body", "Kabbalah", "mindfulness", "ritual", "embodiment"],
    keyLine: "The body is not an obstacle to prayer; it is one of prayer's places.",
    context: [
      "God in Your Body brings Kabbalah, mindfulness, and Jewish ritual into conversation around embodiment.",
      "This matters because Jewish practice is full of physical acts: standing, blessing, tasting, refraining, bowing, washing, walking, and resting.",
      "The approach is not anti-intellectual. It asks thought to become lived, located, and sensory.",
    ],
    deepening:
      "The deeper challenge is to stop treating spirituality as an escape from the body and start noticing how the body carries attention.",
    practice:
      "before the next sip or bite, pause long enough to feel the body receiving it.",
    takeaway: "Embodiment can deepen Jewish practice rather than dilute it.",
    reflection: "Which ordinary bodily act could become more awake?",
    closingLine: "Let attention have weight, breath, and hands.",
    question: "What does embodied Jewish practice emphasize here?",
    correctAnswer: "That physical actions can become serious spiritual attention.",
    sourceKeys: ["michaelsonBody"],
  },
  {
    id: "satipatthana-four-foundations",
    tradition: "buddhism",
    title: "The Four Foundations of Mindfulness",
    summary: "Mindfulness becomes a disciplined investigation of body, feeling, mind, and phenomena.",
    difficulty: "medium",
    visual: "stones",
    cluster: "Buddhist practice and training",
    figures: ["Satipatthana Sutta"],
    themes: ["mindfulness", "body", "feeling", "mind", "phenomena"],
    keyLine: "Attention is not vagueness; it has objects, rigor, and freedom.",
    context: [
      "The Satipatthana Sutta is one of the most important early Buddhist texts for mindfulness practice.",
      "It organizes attention around body, feelings, mind, and mental objects, inviting observation without clinging.",
      "This is deeper than relaxation. It is a training in seeing experience arise and pass without building a prison around it.",
    ],
    deepening:
      "The hard move is to watch experience closely without turning every sensation into a personal story.",
    practice:
      "for three breaths, know the body as sitting, breathing, and changing.",
    takeaway: "Mindfulness is careful observation in the service of freedom.",
    reflection: "What is present before you add a story to it?",
    closingLine: "Know the breath as breath.",
    question: "What makes Satipatthana more rigorous than casual calm?",
    correctAnswer: "It investigates specific fields of experience with steady attention.",
    sourceKeys: ["satipatthana"],
  },
  {
    id: "four-noble-truths-diagnosis",
    tradition: "buddhism",
    title: "The Four Noble Truths as Diagnosis",
    summary: "The Buddha's first framework reads suffering as workable rather than meaningless.",
    difficulty: "medium",
    visual: "mountain",
    cluster: "Buddhist foundations",
    figures: ["The Buddha"],
    themes: ["dukkha", "craving", "cessation", "path", "practice"],
    keyLine: "Suffering is not a verdict; it is a condition to understand.",
    context: [
      "The Four Noble Truths name dukkha, its arising, its cessation, and the path of practice.",
      "A mature reading avoids pessimism. The structure is closer to medicine: recognize the wound, understand its cause, know healing is possible, and follow a path.",
      "The truths become challenging when they turn attention from blaming life to studying craving, resistance, and release.",
    ],
    deepening:
      "The deeper question is not whether discomfort exists, but what the mind adds to discomfort through grasping and aversion.",
    practice:
      "notice one small dissatisfaction and ask: what am I wanting reality to do right now?",
    takeaway: "The Four Noble Truths make suffering intelligible and practice possible.",
    reflection: "Where does craving tighten the hand around experience?",
    closingLine: "Understanding is already a beginning of release.",
    question: "Why are the Four Noble Truths not merely pessimistic?",
    correctAnswer: "They diagnose suffering and point toward a path of release.",
    sourceKeys: ["fourNobleTruths"],
  },
  {
    id: "dhammapada-hatred-love",
    tradition: "buddhism",
    title: "The Dhammapada and the End of Hatred",
    summary: "A famous verse asks whether retaliation can ever cure the disease it repeats.",
    difficulty: "medium",
    visual: "lotus",
    cluster: "Buddhist ethics",
    figures: ["Dhammapada"],
    themes: ["hatred", "metta", "non-retaliation", "ethics"],
    keyLine: "The mind cannot be freed by rehearsing the chain that binds it.",
    anchor: {
      text: "hatred does not cease by hatred",
      attribution: "Dhammapada 5",
    },
    context: [
      "The Dhammapada gathers concise verses on the mind, conduct, wisdom, and liberation.",
      "Verse 5 is famous because it refuses the emotional logic of retaliation. Hatred feeds on repetition, memory, and identity.",
      "The teaching is not sentimental. It asks for disciplined non-cooperation with the very pattern that feels most justified.",
    ],
    deepening:
      "The hard question is how to interrupt resentment without denying harm or pretending that accountability does not matter.",
    practice:
      "when a resentment appears, name it gently as resentment before deciding what action is wise.",
    takeaway: "Non-hatred is an active discipline, not passivity.",
    reflection: "What pattern would lose power if you stopped rehearsing it?",
    closingLine: "Let the chain end one link earlier.",
    question: "What is the ethical insight of this Dhammapada verse?",
    correctAnswer: "Returning hatred tends to preserve the very pattern one wants to end.",
    sourceKeys: ["dhammapada"],
  },
  {
    id: "heart-sutra-form-emptiness",
    tradition: "buddhism",
    title: "The Heart Sutra Without Escaping the World",
    summary: "Emptiness means things lack isolated essence, not that life is meaningless.",
    difficulty: "medium",
    visual: "gate",
    cluster: "Mahayana wisdom",
    figures: ["Heart Sutra", "Avalokiteshvara"],
    themes: ["emptiness", "form", "nonduality", "wisdom"],
    keyLine: "Emptiness is not a blank; it is the openness of interdependence.",
    anchor: {
      text: "Form is emptiness",
      attribution: "Heart Sutra",
    },
    context: [
      "The Heart Sutra is brief, dense, and central in many Mahayana contexts.",
      "Its famous language about form and emptiness is not nihilism. It points to the absence of fixed, independent self-nature in phenomena.",
      "The teaching is difficult because it removes the false comfort of solid separateness while returning us to the ordinary world more intimately.",
    ],
    deepening:
      "The deeper question is whether seeing through fixed identity can produce compassion rather than detachment from life.",
    practice:
      "look at one object nearby and consider how many conditions make it possible.",
    takeaway: "Emptiness can intensify care by revealing interdependence.",
    reflection: "What softens when a thing is not sealed inside itself?",
    closingLine: "Open does not mean absent.",
    question: "What does this lesson guard against?",
    correctAnswer: "Mistaking emptiness for meaninglessness or indifference.",
    sourceKeys: ["heartSutra"],
  },
  {
    id: "guanyin-listening-compassion",
    tradition: "buddhism",
    title: "Guanyin and the Discipline of Listening",
    summary: "Avalokiteshvara appears across cultures as compassion that hears the world's cries.",
    difficulty: "medium",
    visual: "lotus",
    cluster: "Compassion and bodhisattva imagination",
    figures: ["Avalokiteshvara", "Guanyin", "Kannon", "Gwaneum", "Quan Am"],
    themes: ["compassion", "mercy", "listening", "bodhisattva", "devotion"],
    keyLine: "Compassion begins by hearing before fixing.",
    context: [
      "Avalokiteshvara is one of Mahayana Buddhism's great compassion figures, known in Chinese as Guanyin and in Japanese as Kannon.",
      "The Lotus Sutra's Universal Gateway chapter is a major textual home for this figure's many forms and responsive compassion.",
      "The cultural movement from Avalokiteshvara to Guanyin, Kannon, Gwaneum, and Quan Am shows compassion translated through language, art, gender, and devotion.",
    ],
    deepening:
      "The demanding question is whether we listen to suffering as information, interruption, or sacred claim.",
    practice:
      "listen to one person today without preparing your answer while they speak.",
    takeaway: "Compassion is responsive attention before it is solution.",
    reflection: "Whose cry do you find easiest, or hardest, to hear?",
    closingLine: "May listening become a form of mercy.",
    question: "What does Guanyin especially represent in this reflection?",
    correctAnswer: "Compassion that listens and responds in many forms.",
    sourceKeys: ["avalokiteshvara", "lotusSutra25"],
  },
  {
    id: "loori-eight-gates-training",
    tradition: "buddhism",
    title: "John Daido Loori's Eight Gates",
    summary: "Zen training becomes whole-life practice rather than a single meditation technique.",
    difficulty: "medium",
    visual: "compass",
    cluster: "Zen practice and training",
    figures: ["John Daido Loori", "Zen Mountain Monastery"],
    themes: ["zazen", "study", "art", "body practice", "work practice"],
    keyLine: "A path is stronger when the whole life is invited into training.",
    context: [
      "The Eight Gates of Zen were developed by John Daido Loori Roshi for the Mountains and Rivers Order.",
      "The framework makes Zen training tangible across sitting, teacher relationship, liturgy, art, study, body practice, work, and moral action.",
      "This matters because serious practice is not just a mood of calm. It is a way to let every domain of life become trainable.",
    ],
    deepening:
      "The deeper question is which gate you overuse and which gate you avoid.",
    practice:
      "choose one daily action, such as washing a cup, and do it as work practice rather than a chore.",
    takeaway: "Zen training can include art, body, study, work, and relationship.",
    reflection: "Which gate into practice is open for you today?",
    closingLine: "Let the ordinary task become part of the path.",
    question: "What is the point of the Eight Gates framework?",
    correctAnswer: "To make Zen training a whole-life discipline.",
    sourceKeys: ["zmmEightGates"],
  },
  {
    id: "hinton-wild-mind-earth",
    tradition: "buddhism",
    title: "David Hinton and Wild Mind",
    summary: "Chan-inflected ecology challenges the fantasy that mind and earth are separate kingdoms.",
    difficulty: "medium",
    visual: "mountain",
    cluster: "Poetry, Chan, and contemplative nature",
    figures: ["David Hinton"],
    themes: ["Chan", "ecology", "wildness", "poetry", "interdependence"],
    keyLine: "The mountain is not scenery for the self; it is part of the self's undoing.",
    context: [
      "Hinton's work links ancient Chinese spirituality, Chan Buddhism, poetry, and ecological consciousness.",
      "Wild Mind, Wild Earth argues that ecological crisis is also a crisis of perception: humans imagine themselves separate from the earth.",
      "His lens is demanding because it asks not only for better behavior toward nature, but a transformed sense of what mind is.",
    ],
    deepening:
      "The harder question is whether contemplation can change the felt boundary between observer and world.",
    practice:
      "look at a tree, sky, stone, or patch of ground as kin rather than backdrop.",
    takeaway: "Chan ecology can train perception beyond human separateness.",
    reflection: "Where does the world stop being scenery?",
    closingLine: "Let the earth be more than outside.",
    question: "What is Hinton's ecological challenge in this reflection?",
    correctAnswer: "To question the felt separation between human mind and earth.",
    sourceKeys: ["hintonWild"],
  },
  {
    id: "ikkyu-iconoclast-authenticity",
    tradition: "buddhism",
    title: "Ikkyu and the Danger of Holy Masks",
    summary: "The Zen eccentric exposes the gap between institutional polish and actual realization.",
    difficulty: "medium",
    visual: "teacher",
    cluster: "Poetry, Chan, and contemplative nature",
    figures: ["Ikkyu Sojun"],
    themes: ["Zen poetry", "iconoclasm", "authenticity", "Rinzai", "art"],
    keyLine: "Irreverence can reveal truth, but it can also become another costume.",
    context: [
      "Ikkyu Sojun was a Japanese Zen monk, poet, calligrapher, eccentric, and critic of religious hypocrisy.",
      "His life is compelling because it refuses a sanitized portrait of spirituality. It includes brilliance, scandal, poetry, discipline, and danger.",
      "A mature reading does not romanticize every transgression. It asks what kind of authenticity serves awakening and what kind merely serves appetite.",
    ],
    deepening:
      "The challenging question is how to distinguish liberating irreverence from self-excusing performance.",
    practice:
      "notice one place where you appear more spiritually polished than you actually feel.",
    takeaway: "Ikkyu can sharpen honesty without becoming an excuse for carelessness.",
    reflection: "Which mask would be a relief to put down?",
    closingLine: "Let truth be more important than the pose of truth.",
    question: "What is a careful way to learn from Ikkyu?",
    correctAnswer: "Value his honesty while avoiding romanticizing every transgression.",
    sourceKeys: ["ikkyuEncyclopedia"],
  },
  {
    id: "basho-attention-haiku",
    tradition: "buddhism",
    title: "Basho and the Small Door of Haiku",
    summary: "A small poem can hold impermanence, travel, loneliness, humor, and precise seeing.",
    difficulty: "medium",
    visual: "tree",
    cluster: "Poetry, Chan, and contemplative nature",
    figures: ["Matsuo Basho"],
    themes: ["haiku", "impermanence", "nature", "travel", "attention"],
    keyLine: "A small thing seen completely is no longer small.",
    context: [
      "Basho made haiku a profound literary art, often read through Zen-inflected attention to impermanence and interdependence.",
      "His travel writing and poems make ordinary scenes carry emotional and spiritual density.",
      "The point is not to force Buddhist doctrine into every poem. It is to learn a kind of seeing that notices the world before commentary overwhelms it.",
    ],
    deepening:
      "The deeper move is to let brevity intensify attention rather than simplify reality.",
    practice:
      "write one three-line observation without explaining what it means.",
    takeaway: "Contemplative poetry can train exact, humble attention.",
    reflection: "What small thing did you almost miss today?",
    closingLine: "Let the brief moment open wide.",
    question: "What does Basho teach in this reflection?",
    correctAnswer: "Precise attention can reveal depth in ordinary moments.",
    sourceKeys: ["bashoBritannica"],
  },
  {
    id: "green-gulch-work-practice",
    tradition: "buddhism",
    title: "Green Gulch and Work as Practice",
    summary: "A farm temple shows how labor, land, community, and zazen can train one another.",
    difficulty: "medium",
    visual: "seedling",
    cluster: "Zen practice and training",
    figures: ["Green Gulch Farm Zen Center", "San Francisco Zen Center"],
    themes: ["zazen", "community", "work practice", "land", "Soto Zen"],
    keyLine: "Practice is not interrupted by the task; practice may be the task.",
    context: [
      "Green Gulch Farm is a Soto Zen practice center connected with San Francisco Zen Center.",
      "Its public identity includes meditation, philosophy, organic farming, work practice, and retreat life near the Pacific.",
      "For a learner, the point is that Zen is not only what happens on a cushion. It can include posture, schedule, soil, kitchen, tools, and community.",
    ],
    deepening:
      "The harder question is whether ordinary labor can be done without resentment, hurry, or self-display.",
    practice:
      "turn one household task into silent practice for five minutes.",
    takeaway: "Work practice can make attention physical and communal.",
    reflection: "Which ordinary task could become less divided from practice?",
    closingLine: "The path may be under the broom.",
    question: "What does work practice add to meditation?",
    correctAnswer: "It brings attention into labor, land, and community life.",
    sourceKeys: ["greenGulch", "everydayZenFischer"],
  },
  {
    id: "rupa-singh-ai-buddhist-ethics",
    tradition: "buddhism",
    title: "Buddhist AI Ethics and the Shape of Intention",
    summary: "AI becomes a modern field for non-harm, truthful speech, compassion, and attention to craving.",
    difficulty: "medium",
    visual: "compass",
    cluster: "Buddhism and modern ethics",
    figures: ["Rupa Singh"],
    themes: ["AI ethics", "non-harm", "compassion", "technology", "intention"],
    keyLine: "A system trained by human craving will not magically transcend it.",
    context: [
      "Rupa Singh's AI Ethics with a Buddhist Perspective appears in a growing field asking how Buddhist ethics can speak to algorithmic life.",
      "Recent scholarship also explores no-self, non-harm, truthful communication, fairness, and the reduction of greed, hatred, and delusion in digital environments.",
      "The topic is challenging because AI ethics is not only about machines. It returns responsibility to the intentions, incentives, and habits of human designers and users.",
    ],
    deepening:
      "The deeper question is what an interface encourages in the mind: craving, speed, fear, comparison, compassion, clarity, or care.",
    practice:
      "before using a digital tool, ask what state of mind you are feeding.",
    takeaway: "Buddhist ethics can frame AI as a field of intention and non-harm.",
    reflection: "What would compassionate design refuse to amplify?",
    closingLine: "Technology inherits the mind that trains it.",
    question: "What is the key Buddhist concern in AI ethics here?",
    correctAnswer: "Whether systems amplify greed, hatred, delusion, or conditions for care.",
    sourceKeys: ["rupaSingh", "buddhistAiMdpi"],
  },
  {
    id: "both-shekhinah-guanyin-listening-presence",
    tradition: "both",
    title: "Shekhinah and Guanyin: Presence That Hears",
    summary: "A careful comparison of Jewish divine nearness and Buddhist compassion without collapsing them.",
    difficulty: "medium",
    visual: "bridge",
    cluster: "Compassion and divine feminine comparison",
    figures: ["Shekhinah", "Guanyin", "Avalokiteshvara"],
    themes: ["presence", "compassion", "listening", "feminine imagery", "care"],
    keyLine: "One tradition speaks of divine dwelling; another of compassion that hears.",
    context: [
      "Shekhinah and Guanyin are not the same figure. Shekhinah belongs to Jewish languages of divine presence; Guanyin belongs to Mahayana bodhisattva devotion.",
      "Their comparison becomes fruitful when it stays precise: both can open reflection on nearness, feminine imagery, mercy, and the suffering of the world.",
      "The bridge is not doctrine but attention. How does suffering become heard, accompanied, and answered?",
    ],
    deepening:
      "The deeper challenge is to compare without conquest: let each symbol remain rooted while still illuminating the other.",
    practice:
      "hold two words for one minute: dwelling and listening. Notice how each changes the feel of compassion.",
    takeaway: "Comparison can deepen care when it respects difference.",
    reflection: "Do you most need presence, listening, or the courage to offer both?",
    closingLine: "May nearness learn to listen, and listening learn to dwell.",
    question: "What makes this comparison respectful?",
    correctAnswer: "It keeps Jewish and Buddhist meanings distinct while exploring resonance.",
    sourceKeys: ["shekhinahBritannica", "avalokiteshvara", "lotusSutra25"],
  },
  {
    id: "both-alan-lew-norman-fischer",
    tradition: "both",
    title: "Alan Lew and Norman Fischer: Sitting at the Threshold",
    summary: "Jewish return and Zen sitting meet through friendship, practice, and Makor Or.",
    difficulty: "medium",
    visual: "river",
    cluster: "Jewish meditation and Zen bridge",
    figures: ["Rabbi Alan Lew", "Zoketsu Norman Fischer", "Makor Or"],
    themes: ["Jewish meditation", "Zen", "teshuvah", "zazen", "friendship"],
    keyLine: "The bridge is built by practice, not by vague similarity.",
    context: [
      "Norman Fischer and Alan Lew worked together around Jewish meditation and helped create Makor Or in San Francisco.",
      "Lew brought Zen-shaped attention into Jewish cycles of return. Fischer brought Zen practice into interreligious conversation without pretending the traditions were identical.",
      "The result is a serious threshold: sit still enough to return, and return honestly enough that sitting is not escape.",
    ],
    deepening:
      "The hard question is whether meditation helps a person become more present to their own tradition rather than less accountable to it.",
    practice:
      "sit for three breaths, then ask: what am I returning to?",
    takeaway: "Jewish-Zen overlap is richest when practice deepens particularity.",
    reflection: "What would sitting reveal if it were part of return?",
    closingLine: "Be still, then come back more honestly.",
    question: "What is the strongest bridge between Lew and Fischer here?",
    correctAnswer: "Shared contemplative practice that still respects each tradition's shape.",
    sourceKeys: ["alanLewHachette", "everydayZenFischer"],
  },
  {
    id: "both-mussar-paramitas-character",
    tradition: "both",
    title: "Middot and Paramitas: Character as Practice",
    summary: "Jewish Mussar and Buddhist virtue training both ask what habits are making of us.",
    difficulty: "medium",
    visual: "compass",
    cluster: "Ethical self-cultivation",
    figures: ["Alan Morinis", "Norman Fischer"],
    themes: ["Mussar", "paramitas", "virtue", "habit", "practice"],
    keyLine: "Character is not a possession; it is a repeated direction.",
    context: [
      "Mussar works with middot such as humility, patience, truth, and responsibility.",
      "Buddhist training often speaks through virtues and perfections such as generosity, discipline, patience, energy, meditation, and wisdom.",
      "The comparison is powerful if it stays grounded: both traditions treat transformation as repeated practice, not self-improvement branding.",
    ],
    deepening:
      "The mature question is whether your practices are refining the traits your life most needs.",
    practice:
      "choose one trait and one tiny action that would express it before the day ends.",
    takeaway: "Character training becomes deep when it is concrete and repeated.",
    reflection: "Which trait is your teacher right now?",
    closingLine: "A virtue is a path walked more than once.",
    question: "What do Mussar and Buddhist virtue practice share here?",
    correctAnswer: "They train character through concrete, repeated attention.",
    sourceKeys: ["morinisInstitute", "everydayZenFischer"],
  },
  {
    id: "both-zohar-koan-hidden",
    tradition: "both",
    title: "Zohar and Koan: The Shock of Hidden Meaning",
    summary: "Mystical reading and Zen inquiry both unsettle the habit of staying on the surface.",
    difficulty: "medium",
    visual: "gate",
    cluster: "Mystical reading and contemplative inquiry",
    figures: ["The Zohar", "John Daido Loori"],
    themes: ["Kabbalah", "koan", "symbol", "attention", "interpretation"],
    keyLine: "A difficult text may be training perception, not hiding information.",
    context: [
      "The Zohar reads Torah through symbolic, layered radiance. Koan practice in Zen can press the mind beyond ordinary conceptual habits.",
      "They are not interchangeable. Zohar is Jewish mystical Torah interpretation; koan practice belongs to specific Zen training lineages.",
      "Still, both can challenge the reader who wants instant explanation. The point may be transformed seeing, not quick mastery.",
    ],
    deepening:
      "The hard question is whether confusion can become disciplined inquiry rather than frustration.",
    practice:
      "take one sentence you do not understand and stay with it without forcing a conclusion.",
    takeaway: "Some teachings work by changing the reader, not merely informing the reader.",
    reflection: "What kind of patience does hidden meaning ask from you?",
    closingLine: "Do not flatten the gate into a wall.",
    question: "How should this comparison be handled?",
    correctAnswer: "Respect the differences while noticing how both can train perception.",
    sourceKeys: ["zoharBritannica", "zmmEightGates"],
  },
  {
    id: "both-sabbath-zazen-time-body",
    tradition: "both",
    title: "Shabbat and Zazen: Time, Body, and Refusal",
    summary: "One path sanctifies time; the other stabilizes posture, and both interrupt compulsion.",
    difficulty: "medium",
    visual: "stones",
    cluster: "Practice, rest, and attention",
    figures: ["Abraham Joshua Heschel", "John Daido Loori"],
    themes: ["Shabbat", "zazen", "rest", "body", "discipline"],
    keyLine: "The body can refuse hurry; time can refuse utility.",
    context: [
      "Heschel's Shabbat thinking elevates sacred time. Zen zazen trains embodied stillness within a lineage of practice.",
      "These are different disciplines: Shabbat is covenantal Jewish sacred time; zazen is Buddhist sitting practice.",
      "Placed side by side, they ask a shared modern question: can a life stop obeying the command to be constantly useful?",
    ],
    deepening:
      "The serious question is what kind of freedom appears only when schedule and body are trained to stop.",
    practice:
      "sit still for one minute and let it be enough, without improving it.",
    takeaway: "Rest and sitting can both interrupt compulsion when practiced seriously.",
    reflection: "What do hurry and usefulness keep you from noticing?",
    closingLine: "Let the pause have a body.",
    question: "What is the shared question in this bridge lesson?",
    correctAnswer: "Whether practice can free us from constant hurry and usefulness.",
    sourceKeys: ["heschelJts", "zmmEightGates"],
  },
  {
    id: "both-body-kabbalah-mindfulness",
    tradition: "both",
    title: "Body, Blessing, Mindfulness",
    summary: "Jewish embodied practice and Buddhist mindfulness both ask the body to become knowable.",
    difficulty: "medium",
    visual: "lotus",
    cluster: "Embodied contemplative practice",
    figures: ["Jay Michaelson", "Satipatthana Sutta"],
    themes: ["body", "mindfulness", "blessing", "ritual", "attention"],
    keyLine: "The body is not a distraction from depth; it is where depth arrives.",
    context: [
      "Michaelson's embodied Jewish spirituality brings ritual, Kabbalah, and bodily attention together.",
      "The Satipatthana Sutta begins mindfulness through careful contemplation of body, posture, breath, and changing phenomena.",
      "The bridge is practical rather than doctrinal. Both can make the body a site of disciplined attention.",
    ],
    deepening:
      "The hard question is whether you can inhabit the body without turning it into vanity, shame, or background noise.",
    practice:
      "place one hand on the chest or belly for three breaths and notice without correcting.",
    takeaway: "Embodied practice can make attention honest and located.",
    reflection: "What does the body know before the mind explains?",
    closingLine: "Return to the breath that is already teaching.",
    question: "What is the shared practice insight here?",
    correctAnswer: "The body can become a serious field of spiritual attention.",
    sourceKeys: ["michaelsonBody", "satipatthana"],
  },
  {
    id: "both-tikkun-bodhisattva-vow",
    tradition: "both",
    title: "Repair and the Bodhisattva Imagination",
    summary: "Jewish repair and Buddhist compassion meet around responsibility that exceeds the private self.",
    difficulty: "medium",
    visual: "seedling",
    cluster: "Compassion and responsibility",
    figures: ["Rabbi Tarfon", "Avalokiteshvara"],
    themes: ["tikkun olam", "bodhisattva", "repair", "compassion", "limits"],
    keyLine: "The work is too large for ego and too urgent for withdrawal.",
    context: [
      "Pirkei Avot teaches that one is not obligated to finish the work, but is not free to desist from it.",
      "The bodhisattva imagination turns compassion outward, refusing liberation as a merely private achievement.",
      "The traditions differ, but both can challenge spiritual life that becomes self-enclosed.",
    ],
    deepening:
      "The hard question is how to serve without grandiosity, despair, or hidden hunger for admiration.",
    practice:
      "do one small repair anonymously or without needing it to be recognized.",
    takeaway: "Repair and compassion both ask the self to become porous to others.",
    reflection: "Where can you help without needing to be the whole solution?",
    closingLine: "Serve the next being, mend the next thread.",
    question: "What do repair and bodhisattva compassion have in common here?",
    correctAnswer: "They move spiritual practice beyond private self-concern.",
    sourceKeys: ["sefariaAvot216", "avalokiteshvara"],
  },
  {
    id: "both-poetry-attention",
    tradition: "both",
    title: "Basho, Hinton, Heschel: Attention as Reverence",
    summary: "Poetry, awe, and wild mind train a person to see more than usefulness.",
    difficulty: "medium",
    visual: "tree",
    cluster: "Poetry, awe, and contemplative nature",
    figures: ["Matsuo Basho", "David Hinton", "Abraham Joshua Heschel"],
    themes: ["poetry", "awe", "nature", "attention", "reverence"],
    keyLine: "Reverence begins when the world is no longer raw material.",
    context: [
      "Basho's haiku compresses attention into small scenes. Hinton's Chan ecology questions the boundary between mind and earth.",
      "Heschel's theology of awe insists that wonder is not decoration but a primary religious capacity.",
      "Together they suggest that attention can be ethical: the way we see the world shapes whether we exploit, ignore, or bless it.",
    ],
    deepening:
      "The hard question is what forms of usefulness have made you less available to wonder.",
    practice:
      "look at one ordinary natural thing for thirty seconds without naming its use.",
    takeaway: "Attention can become a form of reverence and restraint.",
    reflection: "What would you notice if usefulness stepped aside?",
    closingLine: "Let the world be more than material.",
    question: "What joins these figures in this reflection?",
    correctAnswer: "They train reverent attention to the world beyond utility.",
    sourceKeys: ["bashoBritannica", "hintonWild", "heschelJts"],
  },
  {
    id: "both-ai-prophetic-compassion",
    tradition: "both",
    title: "Prophetic and Buddhist Questions for AI",
    summary: "Technology is examined through justice, non-harm, compassion, and the habits it amplifies.",
    difficulty: "medium",
    visual: "compass",
    cluster: "Modern ethics and technology",
    figures: ["Abraham Joshua Heschel", "Rupa Singh"],
    themes: ["AI ethics", "justice", "non-harm", "compassion", "responsibility"],
    keyLine: "A tool is never only a tool once it trains desire and attention.",
    context: [
      "Jewish prophetic ethics asks who is harmed, who is humiliated, and what responsibility demands.",
      "Buddhist AI ethics asks how systems amplify craving, aversion, delusion, compassion, truthful speech, or non-harm.",
      "Together they create an unusually strong lens: not just whether technology works, but what kind of human world it normalizes.",
    ],
    deepening:
      "The hard question is whether our tools reduce suffering or merely accelerate habits we have not examined.",
    practice:
      "notice one digital habit today and ask whether it increases clarity, care, or agitation.",
    takeaway: "AI ethics can be spiritual when it asks what humans are becoming through tools.",
    reflection: "What should a compassionate technology refuse to make easy?",
    closingLine: "Let wisdom govern what speed makes possible.",
    question: "What is the shared ethical concern in this lesson?",
    correctAnswer: "Whether technology amplifies harm or supports justice, clarity, and compassion.",
    sourceKeys: ["heschelJts", "rupaSingh", "buddhistAiMdpi"],
  },
];

const troveById = new Map(trove.map((item) => [item.id, item]));

const imageById: Map<string, string> = new Map(
  trove.map((item) => [
    item.id,
    `/assets/religion-graphics/topics/${item.tradition}/${item.id}.png`,
  ]),
);

export function curatedTopics(
  tradition: Tradition,
  count = 4,
  options: { seed?: string | number } = {},
): Topic[] {
  const candidates = trove.filter((item) => item.tradition === tradition);
  const ordered =
    options.seed === undefined
      ? shuffle(candidates)
      : seededShuffle(candidates, `${tradition}:${options.seed}`);
  return ordered.slice(0, count).map(toTopic);
}

export function buildPreviewText(topicId: string): string | null {
  const item = troveById.get(topicId);
  if (!item) return null;
  const parts = [item.title];
  if (item.cluster) parts.push(item.cluster);
  parts.push(item.summary);
  if (item.keyLine) parts.push(item.keyLine);
  return parts.join(". ");
}

export function buildLessonScript(topicId: string, mode: SessionMode): string | null {
  const item = troveById.get(topicId);
  if (!item) return null;
  return buildScript(item, mode);
}

export function listTroveIds(): Array<{ id: string; tradition: Tradition }> {
  return trove.map((item) => ({ id: item.id, tradition: item.tradition }));
}

export function dailySeed(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function allCuratedTopics(): Topic[] {
  return trove.map(toTopic);
}

export function troveLesson({
  topic,
  mode,
}: {
  topic: Topic;
  mode: SessionMode;
}): LessonSession | null {
  const item = troveById.get(topic.researchId || topic.id);

  if (!item) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    tradition: item.tradition,
    topic: toTopic(item),
    mode,
    title: modeTitle(item, mode),
    script: buildScript(item, mode),
    simplifiedScript: buildSimplifiedScript(item),
    segments: [
      `Begin with ${item.figures.slice(0, 2).join(" and ")}.`,
      item.keyLine,
      item.deepening,
      `Practice: ${item.practice}`,
    ],
    question: {
      prompt: item.question,
      hint: "Look for the answer that preserves depth and difference.",
      options: buildQuestionOptions(item),
    },
    closing: {
      takeaway: item.takeaway,
      reflection: item.reflection,
      line: item.closingLine,
    },
    sources: item.sourceKeys.map((key) => sources[key]),
    themes: item.themes,
    audioUrl: null,
    audioAvailable: false,
    persisted: false,
    generatedBy: "trove",
  };
}

function buildQuestionOptions(item: TroveItem): QuizOption[] {
  const distractors = distractorsById[item.id] ?? [
    {
      text: "Treat it as trivia to remember, without letting it question the life.",
      response: "A detail can be useful, but this lesson is asking for lived reflection.",
    },
    {
      text: "Flatten every tradition into the same simple message.",
      response: "The bridge is richer when each tradition keeps its own shape.",
    },
    {
      text: "Rush to certainty before the question has done its work.",
      response: "Some wisdom needs patient attention before it opens.",
    },
  ];

  const seed = item.id;
  const shuffled = seededShuffle(
    [
      {
        text: item.correctAnswer,
        isCorrect: true,
        response: "Yes. That keeps the teaching both grounded and alive.",
      },
      ...distractors.map((d) => ({ text: d.text, isCorrect: false, response: d.response })),
    ],
    seed,
  );

  return shuffled.map((option, index) => ({
    id: String.fromCharCode(97 + index),
    text: option.text,
    isCorrect: option.isCorrect,
    response: option.response,
  }));
}

function toTopic(item: TroveItem): Topic {
  return {
    id: item.id,
    tradition: item.tradition,
    title: item.title,
    summary: item.summary,
    difficulty: item.difficulty,
    visual: item.visual,
    cluster: item.cluster,
    keyLine: item.keyLine,
    sourceTitle: item.figures.join(", "),
    researchId: item.id,
    imageUrl: imageById.get(item.id),
  };
}

function buildScript(item: TroveItem, mode: SessionMode) {
  if (mode === "story") return buildStoryScript(item);
  if (mode === "quiz") return buildQuizScript(item);
  return buildListenScript(item);
}

function figuresClause(item: TroveItem) {
  if (item.figures.length === 0) return "voices that have carried this teaching for a long time";
  if (item.figures.length === 1) return item.figures[0];
  if (item.figures.length === 2) return `${item.figures[0]} and ${item.figures[1]}`;
  return `${item.figures.slice(0, -1).join(", ")}, and ${item.figures[item.figures.length - 1]}`;
}

function anchorOpening(item: TroveItem) {
  if (!item.anchor) return null;
  return `Hold a short phrase near you for this session. ${item.anchor.text}, from ${item.anchor.attribution}.`;
}

function buildListenScript(item: TroveItem) {
  const opening =
    item.tradition === "both"
      ? `Today we listen to ${item.title}. Two languages, kept distinct, set near each other so they can ask better questions.`
      : item.tradition === "judaism"
        ? `Today we sit with ${item.title}. ${item.summary}`
        : `Today we approach ${item.title}. ${item.summary}`;

  const anchor = anchorOpening(item)
    || `Hold a short phrase near you for this session. ${item.keyLine}`;

  return [
    opening,
    anchor,
    `This teaching comes through ${figuresClause(item)}.`,
    ...item.context,
    `There is a sharper edge to this. ${item.deepening}`,
    `For today, ${item.practice}`,
    item.takeaway,
    `One question to carry afterwards. ${item.reflection}`,
  ].join("\n\n");
}

function buildStoryScript(item: TroveItem) {
  const opening =
    item.figures.length > 0
      ? `Here is a story carried through ${figuresClause(item)}. We are calling it ${item.title}.`
      : `Here is a story that has been carried for a long time. We are calling it ${item.title}.`;

  const anchor = item.anchor
    ? `If a single phrase belongs in this story, it is this. ${item.anchor.text}, from ${item.anchor.attribution}.`
    : `If a single line belongs in this story, it is this. ${item.keyLine}`;

  // Treat the context paragraphs as the body of the story.
  const body = item.context.length > 0 ? item.context : [item.summary];

  return [
    opening,
    anchor,
    ...body,
    `The story turns at this point. ${item.deepening}`,
    `If you were to take the story home today, it would be small and concrete. ${item.practice}`,
    `That is the moral, said without moralising. ${item.takeaway}`,
    `And the question the story leaves on the table. ${item.reflection}`,
  ].join("\n\n");
}

function buildQuizScript(item: TroveItem) {
  return [
    `A short reflection before a gentle question. The teaching today is ${item.title}.`,
    item.keyLine,
    `${item.summary} ${item.context[0] || ""}`.trim(),
    `Here is the angle the question will turn on. ${item.deepening}`,
    `Hold that lightly. The question on the next screen is not a test. It is an invitation to notice what the teaching is asking of us.`,
  ].join("\n\n");
}

function buildSimplifiedScript(item: TroveItem) {
  const path =
    item.tradition === "both"
      ? "two traditions in careful conversation"
      : item.tradition === "judaism"
        ? "a Jewish teaching"
        : "a Buddhist teaching";

  return `${item.title} is ${path}. The simple idea is this: ${item.keyLine} ${item.context[0]} The deeper invitation is gentle but serious: ${item.takeaway} For a small practice, ${item.practice}`;
}

function modeTitle(item: TroveItem, mode: SessionMode) {
  if (mode === "story") {
    return `${item.title}: Story and Context`;
  }

  if (mode === "quiz") {
    return `${item.title}: Reflective Question`;
  }

  return item.title;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    const j = h % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
