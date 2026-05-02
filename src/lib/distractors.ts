// Per-topic wrong answers for each trove lesson's gentle multiple-choice question.
// Each distractor is a plausible misreading of the teaching — not a strawman —
// paired with a kind response that points back toward the deeper sense.
// Order is not significant; the lesson builder shuffles them with the correct answer.

export type Distractor = {
  text: string;
  response: string;
};

export const distractorsById: Record<string, [Distractor, Distractor, Distractor]> = {
  "heschel-sabbath-time": [
    {
      text: "Mostly to recover energy so the working week can be more productive.",
      response:
        "Rest does refresh, but Heschel is asking for something larger: a different relationship with time itself.",
    },
    {
      text: "To follow the day's rules carefully so the day counts as observed.",
      response:
        "Observance matters, but the deeper move is letting the day reshape what feels important the rest of the week.",
    },
    {
      text: "To withdraw from the world for a while before returning to ordinary life.",
      response:
        "Heschel sees Shabbat less as withdrawal and more as a sanctuary in time that travels with you.",
    },
  ],
  "heschel-prophets-moral-audacity": [
    {
      text: "The prophet predicts the future and announces what will happen.",
      response:
        "Prediction is a small part. Heschel reads prophecy first as sensitivity to suffering before power.",
    },
    {
      text: "The prophet performs private spiritual practice and receives quiet visions.",
      response:
        "There is inwardness, but the demand is that inward awe meets outward action for real people.",
    },
    {
      text: "The prophet enforces religious rules and corrects those who fail to keep them.",
      response:
        "Heschel's prophet is closer to a moral nerve ending than to a rule enforcer.",
    },
  ],
  "alan-lew-teshuvah-unprepared": [
    {
      text: "It is mainly a feeling of guilt strong enough to motivate change.",
      response:
        "Lew is gentler and more honest than that. Return is a journey, not a verdict on yourself.",
    },
    {
      text: "It is a private mindfulness practice that replaces the High Holy Day rituals.",
      response:
        "Lew brings Zen attention into the rituals; he does not replace them. The prayers and the sitting work together.",
    },
    {
      text: "It is an annual reset where last year's mistakes are wiped away if you say the words.",
      response:
        "It is more like an itinerary than a reset. Honest attention does the work that simple words alone cannot.",
    },
  ],
  "morinis-middot-curriculum": [
    {
      text: "To memorise a list of virtues and recite them daily.",
      response:
        "Mussar is more practical than that. The practice is in the noticing and the small concrete acts.",
    },
    {
      text: "To feel inspired by good ideas about character.",
      response:
        "Inspiration is a beginning, but Morinis is interested in the disciplined work that follows.",
    },
    {
      text: "To strive for moral perfection and judge yourself when you fall short.",
      response:
        "Mussar is precise but not punishing. The aim is steady refinement, not perfection or self-blame.",
    },
  ],
  "gillman-sacred-fragments": [
    {
      text: "It tells modern Jews exactly what to believe about God and revelation.",
      response:
        "Gillman is doing the opposite. He invites careful theological work, not a list of correct answers.",
    },
    {
      text: "It treats traditional belief as outdated and best left behind.",
      response:
        "Not at all. Gillman writes from inside Jewish life; he is widening the room, not emptying it.",
    },
    {
      text: "It encourages believing whatever feels personally meaningful, with no obligation to the tradition.",
      response:
        "His humility is rigorous. Honest belief is still in conversation with text, community, and history.",
    },
  ],
  "zohar-radiance-inner-torah": [
    {
      text: "Treat it as the literal voice of Rabbi Shimon bar Yochai and ignore historical scholarship.",
      response:
        "The mature reading honours the tradition while staying honest about how the text emerged in history.",
    },
    {
      text: "Treat it as a medieval invention with no genuine spiritual weight today.",
      response:
        "That swing is too quick. The Zohar's symbolic language has shaped centuries of lived practice.",
    },
    {
      text: "Read it for hidden secrets you can use to influence outcomes.",
      response:
        "The Zohar invites attention and humility, not magical control. Its depth is contemplative, not transactional.",
    },
  ],
  "shekhinah-presence-exile": [
    {
      text: "It is a goddess figure imported into Judaism from other religions.",
      response:
        "Shekhinah is a long-standing Jewish vocabulary for divine presence, not a goddess from elsewhere.",
    },
    {
      text: "It is a way of saying God is far away and unreachable.",
      response:
        "It is closer to the opposite. Shekhinah names nearness, especially in fractured times.",
    },
    {
      text: "It is a poetic flourish without serious theological weight.",
      response:
        "The imagery is poetic and theologically substantial. Presence and exile sit together in the same word.",
    },
  ],
  "hillel-self-other-now": [
    {
      text: "Put others first to the point of losing yourself.",
      response:
        "Hillel refuses self-erasure as carefully as he refuses selfishness. The self belongs in the question.",
    },
    {
      text: "Tend to yourself first and worry about others when you are stronger.",
      response:
        "His three clauses come together. Self-care without responsibility is only half the teaching.",
    },
    {
      text: "Wait until the right moment, when you are wiser, before acting.",
      response:
        "If not now, when? Hillel is wary of endless deferral as much as of haste.",
    },
  ],
  "tarfon-unfinished-work": [
    {
      text: "Take responsibility for finishing every problem you can see.",
      response:
        "Tarfon names the limit kindly. Repair is a long, shared work; you are not asked to finish it alone.",
    },
    {
      text: "If the work cannot be finished, it is fine to stop.",
      response:
        "Limits are real, but you are also not free to desist. The middle path is faithful continued participation.",
    },
    {
      text: "Trust that the right outcome will arrive without your involvement.",
      response:
        "The teaching keeps you in the work, even while loosening grandiose expectations of control.",
    },
  ],
  "micah-justice-kindness-humility": [
    {
      text: "Choose one of the three and let the others rest in the background.",
      response:
        "Micah holds them together. Each word checks the others; you do not get to keep only your favourite.",
    },
    {
      text: "Memorise the verse so it can serve as a comforting reminder.",
      response:
        "Memorising is fine. The verse becomes more than a slogan when it begins to shape an ordinary day.",
    },
    {
      text: "Use it as a moral standard to measure others against.",
      response:
        "It is meant to walk humbly, not to point. Each clause turns first toward the one who reads it.",
    },
  ],
  "michaelson-body-as-practice": [
    {
      text: "The body distracts from prayer and is best quieted.",
      response:
        "Michaelson reverses that. The body is one of the places prayer happens, not an obstacle to it.",
    },
    {
      text: "Spirituality is mainly an inward, mental affair.",
      response:
        "Embodied Judaism is full of standing, blessing, tasting, and walking. Thought becomes located in the body.",
    },
    {
      text: "Bodily practice replaces study and text.",
      response:
        "It joins them. Study, ritual, and embodied attention support each other rather than competing.",
    },
  ],
  "satipatthana-four-foundations": [
    {
      text: "It is mainly about feeling calmer and less stressed.",
      response:
        "Calm can arrive, but the practice is investigation. The point is freedom, not just relaxation.",
    },
    {
      text: "It empties the mind of all thought.",
      response:
        "It watches what arises with clarity, rather than trying to erase the mind.",
    },
    {
      text: "It analyses experience until you understand yourself fully.",
      response:
        "Less analysis, more direct seeing. The four foundations are fields of attention, not a self-help theory.",
    },
  ],
  "four-noble-truths-diagnosis": [
    {
      text: "They teach that life is mostly suffering and there is little to be done.",
      response:
        "Only the first truth names suffering. The others diagnose it and point toward a path of release.",
    },
    {
      text: "They tell us to suppress desire so suffering will go away.",
      response:
        "The closer reading is about craving and clinging, not all desire. The path is more spacious than suppression.",
    },
    {
      text: "They are an old framework that modern life has outgrown.",
      response:
        "Their structure is unusually durable. Many contemporary teachers find them as practical as ever.",
    },
  ],
  "dhammapada-hatred-love": [
    {
      text: "Hatred is justified when the cause is serious enough.",
      response:
        "The verse is honest about how tempting that move is, and steady about where it tends to lead.",
    },
    {
      text: "We should pretend hatred is not there in order to keep the peace.",
      response:
        "Pretending is not the practice. Seeing it clearly is what makes ending it possible.",
    },
    {
      text: "Loving the other means agreeing with what they did.",
      response:
        "Non-hatred is closer to refusing to perpetuate the cycle than to endorsing harm.",
    },
  ],
  "heart-sutra-form-emptiness": [
    {
      text: "Nothing is real, so nothing finally matters.",
      response:
        "The Heart Sutra is more careful than that. Emptiness here is not nihilism; ethics still matters.",
    },
    {
      text: "Form is the illusion and emptiness is the truth behind it.",
      response:
        "The text refuses that split. Form is emptiness and emptiness is form, held together.",
    },
    {
      text: "Once you understand emptiness, ordinary life can be safely set aside.",
      response:
        "The teaching keeps you in ordinary life. Compassion is the practical face of this insight.",
    },
  ],
  "guanyin-listening-compassion": [
    {
      text: "A protector who removes difficulty when called upon.",
      response:
        "Guanyin is more about presence and listening than about removing every difficulty on demand.",
    },
    {
      text: "A purely symbolic figure with no living devotional life.",
      response:
        "The devotional life around Guanyin is centuries old and still vibrant across many cultures.",
    },
    {
      text: "A figure exclusive to one school of Buddhism.",
      response:
        "Avalokiteshvara, Guanyin, and Kannon appear across many traditions; the listening is shared.",
    },
  ],
  "loori-eight-gates-training": [
    {
      text: "A list of skills you can complete, like a curriculum to finish.",
      response:
        "The Eight Gates are more like ongoing rooms than items to tick off. Training keeps moving through them.",
    },
    {
      text: "A way to focus only on meditation and let the other parts of life rest.",
      response:
        "Loori does the opposite. Art, body, work, and study are all gates; meditation is one room among many.",
    },
    {
      text: "A framework for monastics that does not apply to lay life.",
      response:
        "The structure is monastic in origin, but Loori meant for it to inform whole-life practice.",
    },
  ],
  "hinton-wild-mind-earth": [
    {
      text: "Humans should withdraw from civilisation to live in true wilderness.",
      response:
        "Hinton is less prescriptive. The challenge is to question the inner divide, not to relocate.",
    },
    {
      text: "Mind and earth are essentially the same and the difference can be ignored.",
      response:
        "He explores their kinship without erasing the difference. The questioning is more careful than collapse.",
    },
    {
      text: "Ecology is a separate concern from contemplative practice.",
      response:
        "For Hinton, attention to mind and attention to earth are part of the same practice.",
    },
  ],
  "ikkyu-iconoclast-authenticity": [
    {
      text: "Imitate his transgressions to free yourself from religious constraint.",
      response:
        "His honesty is what to learn from. Imitating the surface behaviour misses the underlying integrity.",
    },
    {
      text: "Dismiss him as too irreverent to take seriously.",
      response:
        "His irreverence had spiritual seriousness underneath. Taking him seriously is part of the lesson.",
    },
    {
      text: "Treat his poetry as the only valuable part of his legacy.",
      response:
        "The poetry is wonderful, and inseparable from his Zen seriousness, calligraphy, and reform impulse.",
    },
  ],
  "basho-attention-haiku": [
    {
      text: "Use beautiful language to describe what feels important.",
      response:
        "Basho's gift is plainer. Restraint and attention do most of the work; the language stays simple.",
    },
    {
      text: "Travel to dramatic places to find subjects worth writing about.",
      response:
        "He travelled, but the material is often very small. A frog, a pond, a road are enough.",
    },
    {
      text: "Capture personal feelings as fully as possible.",
      response:
        "Haiku is less about expressing feeling than about clearing space for what is actually there.",
    },
  ],
  "green-gulch-work-practice": [
    {
      text: "Work is what you do until you can return to meditation.",
      response:
        "At Green Gulch the work is the practice, alongside sitting. They are not in competition.",
    },
    {
      text: "Practice belongs in silence; work belongs to ordinary life.",
      response:
        "The Soto tradition there folds them together. Hands, land, and zazen all carry attention.",
    },
    {
      text: "Communal living is incidental to the spiritual point.",
      response:
        "Community is part of the practice. Work, land, and shared life are training, not background.",
    },
  ],
  "rupa-singh-ai-buddhist-ethics": [
    {
      text: "Whether AI tools are technically accurate.",
      response:
        "Accuracy matters, but the Buddhist question is more about what the tools cultivate in the people who use them.",
    },
    {
      text: "Whether AI can be made to follow a strict list of rules.",
      response:
        "Rules help. The deeper test is whether systems support care and clarity or feed craving and aversion.",
    },
    {
      text: "Whether AI will eventually become conscious.",
      response:
        "That question is interesting elsewhere. Here the focus is on the human formation these systems shape.",
    },
  ],
  "both-shekhinah-guanyin-listening-presence": [
    {
      text: "It treats them as the same divine figure under different names.",
      response:
        "The respect is in keeping the meanings distinct. Resonance is noticed without collapsing the difference.",
    },
    {
      text: "It compares them only to argue which is the more compelling figure.",
      response:
        "The point is not preference. Two languages stand near each other and ask better questions of both.",
    },
    {
      text: "It avoids comparison entirely to prevent any blurring.",
      response:
        "Careful comparison is honoured here. The risk is flattening, not noticing.",
    },
  ],
  "both-alan-lew-norman-fischer": [
    {
      text: "They prove the two traditions are basically the same.",
      response:
        "Their friendship and practice show resonance, not sameness. Each tradition stays itself.",
    },
    {
      text: "Lew became Buddhist and Fischer became Jewish.",
      response:
        "Lew remained a rabbi; Fischer remained a Zen teacher. Each drew from the other without converting.",
    },
    {
      text: "Their writing is mainly of personal interest with little to teach others.",
      response:
        "Their work models a way of practising deeply within one tradition while learning seriously from another.",
    },
  ],
  "both-mussar-paramitas-character": [
    {
      text: "Both are mainly about avoiding wrongdoing.",
      response:
        "Avoidance is part of it. The shared focus is positive cultivation through small repeated practice.",
    },
    {
      text: "Both teach that the same virtues matter in the same order.",
      response:
        "The lists differ and the framings differ. What they share is the discipline of training character.",
    },
    {
      text: "Both promise enlightenment if the practice is done long enough.",
      response:
        "Neither promises a finish line. The practice is the point, and it shapes a life over time.",
    },
  ],
  "both-zohar-koan-hidden": [
    {
      text: "Treat the Zohar as a koan and a koan as a kind of midrash.",
      response:
        "Easy equivalence flattens both. They train perception in different ways and benefit from staying distinct.",
    },
    {
      text: "Conclude that hidden meaning is the same in every tradition.",
      response:
        "Hiddenness takes different shapes in different texts. The shared move is learning to read past the surface.",
    },
    {
      text: "Decide one form of mystery is more authentic than the other.",
      response:
        "The comparison is not a contest. Both can train attention in their own way.",
    },
  ],
  "both-sabbath-zazen-time-body": [
    {
      text: "Whether either practice can fully end the experience of stress.",
      response:
        "Neither promises that. The shared question is about a different relationship with time and usefulness.",
    },
    {
      text: "Whether one practice is more efficient than the other.",
      response:
        "Efficiency is the wrong frame. Both interrupt the logic of efficiency on purpose.",
    },
    {
      text: "Whether modern life has made these practices obsolete.",
      response:
        "Both teachers would say modern life makes the practices more useful, not less.",
    },
  ],
  "both-body-kabbalah-mindfulness": [
    {
      text: "The body is the same kind of object in both traditions.",
      response:
        "The framings differ. The shared insight is that bodily life can be a serious site of attention.",
    },
    {
      text: "Mindfulness alone is enough to reach the depth Kabbalah names.",
      response:
        "Each tradition has its own depth. Mindfulness is one rich form of attention; Kabbalah uses others.",
    },
    {
      text: "Bodily practice replaces the need for blessing or text.",
      response:
        "In both traditions the body works alongside text and ritual rather than replacing them.",
    },
  ],
  "both-tikkun-bodhisattva-vow": [
    {
      text: "Both teach that personal liberation is the main goal.",
      response:
        "Each in its own way pulls outward. Repair and the bodhisattva vow refuse to stop at the personal.",
    },
    {
      text: "Both expect a single hero to fix what is broken.",
      response:
        "Neither relies on a hero. The work is shared, partial, and intergenerational.",
    },
    {
      text: "They use different language for the same vow.",
      response:
        "The languages and theologies differ. What rhymes is the refusal of a purely private spiritual life.",
    },
  ],
  "both-poetry-attention": [
    {
      text: "They show that beauty matters more than ethics in the spiritual life.",
      response:
        "For each of them, attention to beauty is part of an ethical seeing, not separate from it.",
    },
    {
      text: "They prefer rare and sublime moments over ordinary ones.",
      response:
        "All three find the sublime in the ordinary. Reverence travels close to small things.",
    },
    {
      text: "Their styles are too different for the comparison to hold.",
      response:
        "The styles do differ. What rhymes is the discipline of attention itself, in poems, prayers, and prose.",
    },
  ],
  "both-ai-prophetic-compassion": [
    {
      text: "Whether AI can be made profitable in an ethical way.",
      response:
        "Profit is one question. The deeper one is whether the human world these tools shape is more humane.",
    },
    {
      text: "Whether AI can be regulated quickly enough.",
      response:
        "Regulation is part of justice. The traditions also ask what habits and desires the tools train.",
    },
    {
      text: "Whether AI is inherently good or inherently bad.",
      response:
        "Neither tradition treats the question that way. Both ask what the tool, in real use, actually amplifies.",
    },
  ],
};
