insert into cartoon_lessons(slug,title,level,duration_seconds,description,cover_emoji,cover_color,youtube_video_id,youtube_title,scenes)
select x.slug,x.title,x.level,x.duration_seconds,x.description,x.cover_emoji,x.cover_color,x.youtube_video_id,x.youtube_title,x.scenes
from jsonb_to_recordset($lessons$[
  {
    "slug": "the-lost-key",
    "title": "The Lion and the Mouse",
    "level": "A1",
    "duration_seconds": 485,
    "description": "A short animated fable about a lion and a helpful mouse.",
    "cover_emoji": "🦁",
    "cover_color": "#dff4ea",
    "youtube_video_id": "z46K8WqBFnw",
    "youtube_title": "The Lion and the Mouse — English Singsing",
    "scenes": [
      {
        "position": 1,
        "title": "A sleeping lion",
        "subtitleEn": "A lion was sleeping under a tree.",
        "translation": "Лев спал под деревом.",
        "illustration": "🦁",
        "durationSeconds": 20
      },
      {
        "position": 2,
        "title": "A small mouse",
        "subtitleEn": "The lion picked up the mouse and opened his mouth.",
        "translation": "Лев поднял мышь и открыл пасть.",
        "illustration": "🦁",
        "durationSeconds": 20
      },
      {
        "position": 3,
        "title": "Friends",
        "subtitleEn": "The lion and the mouse became best friends.",
        "translation": "Лев и мышь стали лучшими друзьями.",
        "illustration": "🦁",
        "durationSeconds": 20
      }
    ]
  },
  {
    "slug": "a-rainy-picnic",
    "title": "The Boy Who Cried Wolf",
    "level": "A2",
    "duration_seconds": 509,
    "description": "An animated fable about a shepherd, a wolf, and the importance of honesty.",
    "cover_emoji": "🐺",
    "cover_color": "#e6efff",
    "youtube_video_id": "j-95UexV70k",
    "youtube_title": "The Boy Who Cried Wolf — English Singsing",
    "scenes": [
      {
        "position": 1,
        "title": "The shepherd",
        "subtitleEn": "A shepherd boy was keeping sheep on a grassy hill.",
        "translation": "Мальчик-пастух пас овец на травянистом холме.",
        "illustration": "🐺",
        "durationSeconds": 20
      },
      {
        "position": 2,
        "title": "A false alarm",
        "subtitleEn": "The bored boy shouted that a wolf had come, and the villagers ran to help.",
        "translation": "Скучающий мальчик закричал, что пришёл волк, и жители деревни побежали на помощь.",
        "illustration": "🐺",
        "durationSeconds": 20
      },
      {
        "position": 3,
        "title": "The truth",
        "subtitleEn": "When the wolf really came, nobody believed the boy.",
        "translation": "Когда волк действительно пришёл, мальчику никто не поверил.",
        "illustration": "🐺",
        "durationSeconds": 20
      }
    ]
  },
  {
    "slug": "the-school-bus-mystery",
    "title": "What Makes a Hero?",
    "level": "B1",
    "duration_seconds": 260,
    "description": "An animated exploration of the journey shared by many fictional heroes.",
    "cover_emoji": "🦸",
    "cover_color": "#fdf0d8",
    "youtube_video_id": "Hhk4N9A0oCA",
    "youtube_title": "What Makes a Hero? — TED-Ed",
    "scenes": [
      {
        "position": 1,
        "title": "Ancient myths",
        "subtitleEn": "Many heroes of ancient myths have something in common.",
        "translation": "У многих героев древних мифов есть нечто общее.",
        "illustration": "🦸",
        "durationSeconds": 20
      },
      {
        "position": 2,
        "title": "The journey",
        "subtitleEn": "Joseph Campbell studied myths and described the hero’s journey.",
        "translation": "Джозеф Кэмпбелл изучал мифы и описал путь героя.",
        "illustration": "🦸",
        "durationSeconds": 20
      },
      {
        "position": 3,
        "title": "A cycle",
        "subtitleEn": "The hero’s journey is a cycle of challenges and change.",
        "translation": "Путь героя — это цикл испытаний и перемен.",
        "illustration": "🦸",
        "durationSeconds": 20
      }
    ]
  },
  {
    "slug": "the-ocean-cleanup",
    "title": "The Myth of Pandora’s Box",
    "level": "B2",
    "duration_seconds": 229,
    "description": "An animated retelling of Pandora’s story and the consequences of curiosity.",
    "cover_emoji": "📦",
    "cover_color": "#dff2f7",
    "youtube_video_id": "pMdJxVjZMRI",
    "youtube_title": "The Myth of Pandora’s Box — TED-Ed",
    "scenes": [
      {
        "position": 1,
        "title": "Curiosity",
        "subtitleEn": "Curiosity can be a blessing or a curse.",
        "translation": "Любопытство может быть благословением или проклятием.",
        "illustration": "📦",
        "durationSeconds": 20
      },
      {
        "position": 2,
        "title": "Pandora",
        "subtitleEn": "According to legend, Pandora was the first mortal woman.",
        "translation": "Согласно легенде, Пандора была первой смертной женщиной.",
        "illustration": "📦",
        "durationSeconds": 20
      },
      {
        "position": 3,
        "title": "Consequences",
        "subtitleEn": "Her curiosity set a chain of extraordinary events in motion.",
        "translation": "Её любопытство запустило цепь необыкновенных событий.",
        "illustration": "📦",
        "durationSeconds": 20
      }
    ]
  },
  {
    "slug": "the-midnight-interview",
    "title": "The Myth of King Midas",
    "level": "C1",
    "duration_seconds": 283,
    "description": "An animated Greek myth about King Midas and his golden touch.",
    "cover_emoji": "👑",
    "cover_color": "#eee7ff",
    "youtube_video_id": "nn8YGPZdCvA",
    "youtube_title": "The Myth of King Midas — TED-Ed",
    "scenes": [
      {
        "position": 1,
        "title": "A strange ruler",
        "subtitleEn": "King Midas ruled an ancient kingdom with an uneven hand.",
        "translation": "Царь Мидас правил древним царством непоследовательно.",
        "illustration": "👑",
        "durationSeconds": 20
      },
      {
        "position": 2,
        "title": "A wish",
        "subtitleEn": "Dionysus offered to grant King Midas one wish.",
        "translation": "Дионис предложил исполнить одно желание царя Мидаса.",
        "illustration": "👑",
        "durationSeconds": 20
      },
      {
        "position": 3,
        "title": "Golden touch",
        "subtitleEn": "The gift brought splendor but also painful consequences.",
        "translation": "Дар принёс великолепие, но и тяжёлые последствия.",
        "illustration": "👑",
        "durationSeconds": 20
      }
    ]
  },
  {
    "slug": "the-algorithms-garden",
    "title": "The Myth of Sisyphus",
    "level": "C2",
    "duration_seconds": 277,
    "description": "An animated Greek myth about Sisyphus, punishment, and meaning.",
    "cover_emoji": "🪨",
    "cover_color": "#e5f5e7",
    "youtube_video_id": "q4pDUxth5fQ",
    "youtube_title": "The Myth of Sisyphus — TED-Ed",
    "scenes": [
      {
        "position": 1,
        "title": "A devious king",
        "subtitleEn": "Sisyphus was a clever ruler and a devious tyrant.",
        "translation": "Сизиф был умным правителем и коварным тираном.",
        "illustration": "🪨",
        "durationSeconds": 20
      },
      {
        "position": 2,
        "title": "The gods",
        "subtitleEn": "His reckless actions angered the gods.",
        "translation": "Его безрассудные поступки разгневали богов.",
        "illustration": "🪨",
        "durationSeconds": 20
      },
      {
        "position": 3,
        "title": "The punishment",
        "subtitleEn": "His punishment was both repetitive and absurd.",
        "translation": "Его наказание было повторяющимся и абсурдным.",
        "illustration": "🪨",
        "durationSeconds": 20
      }
    ]
  }
]$lessons$::jsonb) as x(slug text,title text,level text,duration_seconds int,description text,cover_emoji text,cover_color text,youtube_video_id text,youtube_title text,scenes jsonb)
on conflict(slug) do update set
  title=excluded.title,level=excluded.level,duration_seconds=excluded.duration_seconds,
  description=excluded.description,cover_emoji=excluded.cover_emoji,cover_color=excluded.cover_color,youtube_video_id=excluded.youtube_video_id,youtube_title=excluded.youtube_title,scenes=excluded.scenes;

insert into cartoon_lesson_words(lesson_id,word,phonetic,translation_ru,translation_kk,definition_en,example_sentence,difficulty,position)
select l.id,w.word,w.phonetic,w.translation_ru,w.translation_kk,w.definition_en,w.example_sentence,w.difficulty,w.position
from jsonb_to_recordset($words$[
  {
    "lesson_slug": "the-lost-key",
    "word": "lion",
    "phonetic": null,
    "translation_ru": "лев",
    "translation_kk": "арыстан",
    "definition_en": "A large wild cat with a golden coat, the male having a mane.",
    "example_sentence": "The lion roared loudly.",
    "difficulty": "A1",
    "position": 1
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "mouse",
    "phonetic": null,
    "translation_ru": "мышь",
    "translation_kk": "тышқан",
    "definition_en": "A small rodent with a pointed snout and long tail.",
    "example_sentence": "A mouse ran across the floor.",
    "difficulty": "A1",
    "position": 2
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "tree",
    "phonetic": null,
    "translation_ru": "дерево",
    "translation_kk": "ағаш",
    "definition_en": "A tall plant with a woody trunk and branches.",
    "example_sentence": "The tree provides shade in summer.",
    "difficulty": "A1",
    "position": 3
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "sleeping",
    "phonetic": null,
    "translation_ru": "спящий",
    "translation_kk": "ұйықтап жатқан",
    "definition_en": "Being in a state of sleep.",
    "example_sentence": "The sleeping baby looked peaceful.",
    "difficulty": "A1",
    "position": 4
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "help",
    "phonetic": null,
    "translation_ru": "помогать",
    "translation_kk": "көмектесу",
    "definition_en": "To give assistance to someone.",
    "example_sentence": "Can you help me carry this box?",
    "difficulty": "A1",
    "position": 5
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "friends",
    "phonetic": null,
    "translation_ru": "друзья",
    "translation_kk": "достар",
    "definition_en": "People whom one knows and likes and who are not family.",
    "example_sentence": "She invited her friends to the party.",
    "difficulty": "A1",
    "position": 6
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "shepherd",
    "phonetic": null,
    "translation_ru": "пастух",
    "translation_kk": "қойшы",
    "definition_en": "A person who tends sheep.",
    "example_sentence": "The shepherd guided his flock to the pasture.",
    "difficulty": "A2",
    "position": 1
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "sheep",
    "phonetic": null,
    "translation_ru": "овца",
    "translation_kk": "қой",
    "definition_en": "A domesticated ruminant animal with a thick woolly coat.",
    "example_sentence": "The sheep grazed in the field.",
    "difficulty": "A2",
    "position": 2
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "bored",
    "phonetic": null,
    "translation_ru": "скучающий",
    "translation_kk": "зеріккен",
    "definition_en": "Feeling weary and restless because one is uninterested.",
    "example_sentence": "He looked bored during the lecture.",
    "difficulty": "A2",
    "position": 3
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "wolf",
    "phonetic": null,
    "translation_ru": "волк",
    "translation_kk": "қасқыр",
    "definition_en": "A wild carnivorous mammal that lives and hunts in packs.",
    "example_sentence": "The wolf howled at the moon.",
    "difficulty": "A2",
    "position": 4
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "villagers",
    "phonetic": null,
    "translation_ru": "сельчане",
    "translation_kk": "ауыл тұрғындары",
    "definition_en": "People who live in a village.",
    "example_sentence": "The villagers gathered for the festival.",
    "difficulty": "A2",
    "position": 5
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "believe",
    "phonetic": null,
    "translation_ru": "верить",
    "translation_kk": "сену",
    "definition_en": "To accept something as true.",
    "example_sentence": "I believe in your honesty.",
    "difficulty": "A2",
    "position": 6
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "truth",
    "phonetic": null,
    "translation_ru": "правда",
    "translation_kk": "шындық",
    "definition_en": "That which is true or in accordance with fact.",
    "example_sentence": "He finally told the truth about the incident.",
    "difficulty": "A2",
    "position": 7
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "hero",
    "phonetic": null,
    "translation_ru": "герой",
    "translation_kk": "батыр",
    "definition_en": "A person admired for courage or outstanding achievements.",
    "example_sentence": "The hero saved the child from the fire.",
    "difficulty": "B1",
    "position": 1
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "myth",
    "phonetic": null,
    "translation_ru": "миф",
    "translation_kk": "миф",
    "definition_en": "A traditional story explaining natural or social phenomena.",
    "example_sentence": "The myth of the minotaur is famous.",
    "difficulty": "B1",
    "position": 2
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "journey",
    "phonetic": null,
    "translation_ru": "путешествие",
    "translation_kk": "саяхат",
    "definition_en": "An act of traveling from one place to another.",
    "example_sentence": "Their journey across the desert took weeks.",
    "difficulty": "B1",
    "position": 3
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "variant",
    "phonetic": null,
    "translation_ru": "вариант",
    "translation_kk": "нұсқа",
    "definition_en": "A form or version of something that differs from others.",
    "example_sentence": "This variant of the story has a different ending.",
    "difficulty": "B1",
    "position": 4
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "cycle",
    "phonetic": null,
    "translation_ru": "цикл",
    "translation_kk": "цикл",
    "definition_en": "A series of events that repeat in the same order.",
    "example_sentence": "The water cycle is essential for life.",
    "difficulty": "B1",
    "position": 5
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "ordinary",
    "phonetic": null,
    "translation_ru": "обычный",
    "translation_kk": "қарапайым",
    "definition_en": "Normal or usual; not special.",
    "example_sentence": "It was just an ordinary day at work.",
    "difficulty": "B1",
    "position": 6
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "retelling",
    "phonetic": null,
    "translation_ru": "пересказ",
    "translation_kk": "қайта әңгімелеу",
    "definition_en": "A new version of a story.",
    "example_sentence": "Her retelling of the fairy tale was captivating.",
    "difficulty": "B1",
    "position": 7
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "adventure",
    "phonetic": null,
    "translation_ru": "приключение",
    "translation_kk": "шытырман оқиға",
    "definition_en": "An unusual and exciting experience.",
    "example_sentence": "They went on an adventure in the mountains.",
    "difficulty": "B1",
    "position": 8
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "curiosity",
    "phonetic": null,
    "translation_ru": "любопытство",
    "translation_kk": "қызығушылық",
    "definition_en": "A strong desire to know or learn something.",
    "example_sentence": "Her curiosity led her to explore the old house.",
    "difficulty": "B2",
    "position": 1
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "blessing",
    "phonetic": null,
    "translation_ru": "благословение",
    "translation_kk": "бата",
    "definition_en": "A beneficial thing for which one is grateful.",
    "example_sentence": "The rain was a blessing for the dry crops.",
    "difficulty": "B2",
    "position": 2
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "curse",
    "phonetic": null,
    "translation_ru": "проклятие",
    "translation_kk": "қарғыс",
    "definition_en": "A cause of harm or misfortune.",
    "example_sentence": "The witch cast a curse on the village.",
    "difficulty": "B2",
    "position": 3
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "paradoxical",
    "phonetic": null,
    "translation_ru": "парадоксальный",
    "translation_kk": "парадоксалды",
    "definition_en": "Seemingly absurd or self-contradictory.",
    "example_sentence": "It is paradoxical that the more we have, the more we want.",
    "difficulty": "B2",
    "position": 4
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "mortal",
    "phonetic": null,
    "translation_ru": "смертный",
    "translation_kk": "өлімші",
    "definition_en": "Subject to death; human.",
    "example_sentence": "All mortal beings must eventually die.",
    "difficulty": "B2",
    "position": 5
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "extraordinary",
    "phonetic": null,
    "translation_ru": "необычайный",
    "translation_kk": "ерекше",
    "definition_en": "Very unusual or remarkable.",
    "example_sentence": "She has an extraordinary talent for music.",
    "difficulty": "B2",
    "position": 6
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "craftsmanship",
    "phonetic": null,
    "translation_ru": "мастерство",
    "translation_kk": "шеберлік",
    "definition_en": "Skill in a particular craft.",
    "example_sentence": "The furniture is known for its fine craftsmanship.",
    "difficulty": "B2",
    "position": 7
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "emotion",
    "phonetic": null,
    "translation_ru": "эмоция",
    "translation_kk": "эмоция",
    "definition_en": "A strong feeling such as joy, anger, or fear.",
    "example_sentence": "He showed no emotion when he heard the news.",
    "difficulty": "B2",
    "position": 8
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "harebrained",
    "phonetic": null,
    "translation_ru": "безрассудный",
    "translation_kk": "ақылсыз",
    "definition_en": "Rash and impractical.",
    "example_sentence": "He came up with a harebrained scheme to get rich quickly.",
    "difficulty": "C1",
    "position": 1
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "asinine",
    "phonetic": null,
    "translation_ru": "глупый",
    "translation_kk": "ақымақ",
    "definition_en": "Extremely stupid or foolish.",
    "example_sentence": "It was an asinine decision to ignore the warnings.",
    "difficulty": "C1",
    "position": 2
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "rogue",
    "phonetic": null,
    "translation_ru": "мошенник",
    "translation_kk": "қу",
    "definition_en": "A dishonest or unprincipled person.",
    "example_sentence": "The rogue tricked the villagers out of their money.",
    "difficulty": "C1",
    "position": 3
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "antics",
    "phonetic": null,
    "translation_ru": "выходки",
    "translation_kk": "қылықтар",
    "definition_en": "Foolish, outrageous, or amusing behavior.",
    "example_sentence": "The clown's antics made the children laugh.",
    "difficulty": "C1",
    "position": 4
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "splendor",
    "phonetic": null,
    "translation_ru": "великолепие",
    "translation_kk": "сән-салтанат",
    "definition_en": "Magnificent and impressive beauty.",
    "example_sentence": "The palace was restored to its former splendor.",
    "difficulty": "C1",
    "position": 5
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "affinity",
    "phonetic": null,
    "translation_ru": "влечение",
    "translation_kk": "бейімділік",
    "definition_en": "A natural liking for or attraction to something.",
    "example_sentence": "She has an affinity for classical music.",
    "difficulty": "C1",
    "position": 6
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "satyr",
    "phonetic": null,
    "translation_ru": "сатир",
    "translation_kk": "сатир",
    "definition_en": "A creature in Greek mythology with a man's upper body and a horse's or goat's lower body.",
    "example_sentence": "The satyr played a flute in the forest.",
    "difficulty": "C1",
    "position": 7
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "hospitality",
    "phonetic": null,
    "translation_ru": "гостеприимство",
    "translation_kk": "қонақжайлылық",
    "definition_en": "The friendly and generous reception of guests.",
    "example_sentence": "Thank you for your hospitality during my stay.",
    "difficulty": "C1",
    "position": 8
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "gruesome",
    "phonetic": null,
    "translation_ru": "ужасный",
    "translation_kk": "қорқынышты",
    "definition_en": "Causing horror or disgust.",
    "example_sentence": "The gruesome scene was too much for the audience.",
    "difficulty": "C2",
    "position": 1
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "mortals",
    "phonetic": null,
    "translation_ru": "смертные",
    "translation_kk": "өлімшілер",
    "definition_en": "Human beings, as opposed to gods.",
    "example_sentence": "The gods often intervened in the affairs of mortals.",
    "difficulty": "C2",
    "position": 2
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "punishment",
    "phonetic": null,
    "translation_ru": "наказание",
    "translation_kk": "жаза",
    "definition_en": "The infliction of a penalty for an offense.",
    "example_sentence": "His punishment was to clean the entire school.",
    "difficulty": "C2",
    "position": 3
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "outrageous",
    "phonetic": null,
    "translation_ru": "возмутительный",
    "translation_kk": "ашуландырарлық",
    "definition_en": "Shockingly bad or excessive.",
    "example_sentence": "The prices at the restaurant were outrageous.",
    "difficulty": "C2",
    "position": 4
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "cruelty",
    "phonetic": null,
    "translation_ru": "жестокость",
    "translation_kk": "қатыгездік",
    "definition_en": "Callous indifference to or pleasure in causing pain.",
    "example_sentence": "The cruelty of the dictator was well known.",
    "difficulty": "C2",
    "position": 5
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "familiarity",
    "phonetic": null,
    "translation_ru": "знакомство",
    "translation_kk": "таныстық",
    "definition_en": "Close acquaintance with or knowledge of something.",
    "example_sentence": "His familiarity with the subject impressed everyone.",
    "difficulty": "C2",
    "position": 6
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "prosperous",
    "phonetic": null,
    "translation_ru": "процветающий",
    "translation_kk": "гүлденген",
    "definition_en": "Successful, usually by making a lot of money.",
    "example_sentence": "The city grew into a prosperous trading center.",
    "difficulty": "C2",
    "position": 7
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "devious",
    "phonetic": null,
    "translation_ru": "коварный",
    "translation_kk": "айлакер",
    "definition_en": "Showing a skilful use of underhand tactics to achieve goals.",
    "example_sentence": "He used devious methods to get the promotion.",
    "difficulty": "C2",
    "position": 8
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "reckless",
    "phonetic": null,
    "translation_ru": "безрассудный",
    "translation_kk": "абайсыз",
    "definition_en": "Heedless of danger or the consequences of one's actions.",
    "example_sentence": "His reckless driving caused a serious accident.",
    "difficulty": "C2",
    "position": 9
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "squeak",
    "translation_ru": "писк",
    "translation_kk": "шиқыл",
    "definition_en": "A short, high sound made by a mouse.",
    "example_sentence": "The mouse made a little squeak.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 7
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "trap",
    "translation_ru": "ловушка",
    "translation_kk": "қақпан",
    "definition_en": "Something used to catch an animal.",
    "example_sentence": "The lion was caught in a trap.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 8
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "rope",
    "translation_ru": "верёвка",
    "translation_kk": "арқан",
    "definition_en": "A thick, strong cord.",
    "example_sentence": "The mouse chewed the rope.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 9
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "chew",
    "translation_ru": "грызть",
    "translation_kk": "кеміру",
    "definition_en": "To bite something repeatedly.",
    "example_sentence": "The mouse began to chew the rope.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 10
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "picked up",
    "translation_ru": "поднял",
    "translation_kk": "көтеріп алды",
    "definition_en": "Lifted someone or something.",
    "example_sentence": "The lion picked up the mouse.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 11
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "woke up",
    "translation_ru": "проснулся",
    "translation_kk": "оянды",
    "definition_en": "Stopped sleeping.",
    "example_sentence": "The lion woke up suddenly.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 12
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "ran away",
    "translation_ru": "убежал",
    "translation_kk": "қашып кетті",
    "definition_en": "Left a place quickly by running.",
    "example_sentence": "The mouse ran away.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 13
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "let me go",
    "translation_ru": "отпусти меня",
    "translation_kk": "мені жіберші",
    "definition_en": "A request to be released.",
    "example_sentence": "Please let me go, said the mouse.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 14
  },
  {
    "lesson_slug": "the-lost-key",
    "word": "best friends",
    "translation_ru": "лучшие друзья",
    "translation_kk": "ең жақын достар",
    "definition_en": "People who are especially close friends.",
    "example_sentence": "The lion and the mouse became best friends.",
    "difficulty": "A1",
    "phonetic": null,
    "position": 15
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "hill",
    "translation_ru": "холм",
    "translation_kk": "төбе",
    "definition_en": "A raised area of land smaller than a mountain.",
    "example_sentence": "The sheep stood on the hill.",
    "difficulty": "A2",
    "phonetic": null,
    "position": 8
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "kidding",
    "translation_ru": "шучу",
    "translation_kk": "әзілдеп тұрмын",
    "definition_en": "Joking rather than speaking seriously.",
    "example_sentence": "I am just kidding, said the boy.",
    "difficulty": "A2",
    "phonetic": null,
    "position": 9
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "angry",
    "translation_ru": "злой",
    "translation_kk": "ашулы",
    "definition_en": "Feeling strong displeasure.",
    "example_sentence": "The villagers went back angry.",
    "difficulty": "A2",
    "phonetic": null,
    "position": 10
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "cried out",
    "translation_ru": "закричал",
    "translation_kk": "айқайлап жіберді",
    "definition_en": "Shouted suddenly and loudly.",
    "example_sentence": "The boy cried out for help.",
    "difficulty": "A2",
    "phonetic": null,
    "position": 11
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "got tricked",
    "translation_ru": "попались на обман",
    "translation_kk": "алданып қалды",
    "definition_en": "Were fooled by someone.",
    "example_sentence": "The villagers got tricked again.",
    "difficulty": "A2",
    "phonetic": null,
    "position": 12
  },
  {
    "lesson_slug": "a-rainy-picnic",
    "word": "went back",
    "translation_ru": "вернулись",
    "translation_kk": "қайтып кетті",
    "definition_en": "Returned to a previous place.",
    "example_sentence": "The people went back angry.",
    "difficulty": "A2",
    "phonetic": null,
    "position": 13
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "threshold",
    "translation_ru": "порог",
    "translation_kk": "табалдырық",
    "definition_en": "The entrance to a place or a new stage.",
    "example_sentence": "The hero crosses the threshold.",
    "difficulty": "B1",
    "phonetic": null,
    "position": 9
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "mysterious",
    "translation_ru": "загадочный",
    "translation_kk": "жұмбақ",
    "definition_en": "Difficult to explain or understand.",
    "example_sentence": "The hero receives a mysterious message.",
    "difficulty": "B1",
    "phonetic": null,
    "position": 10
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "quest",
    "translation_ru": "поиск",
    "translation_kk": "ізденіс",
    "definition_en": "A long search for an important goal.",
    "example_sentence": "The quest takes the hero far from home.",
    "difficulty": "B1",
    "phonetic": null,
    "position": 11
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "in common",
    "translation_ru": "общего",
    "translation_kk": "ортақ",
    "definition_en": "Shared by different people or things.",
    "example_sentence": "What do these heroes have in common?",
    "difficulty": "B1",
    "phonetic": null,
    "position": 12
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "along the way",
    "translation_ru": "по пути",
    "translation_kk": "жол бойында",
    "definition_en": "During a journey or process.",
    "example_sentence": "Along the way, the hero meets a guide.",
    "difficulty": "B1",
    "phonetic": null,
    "position": 13
  },
  {
    "lesson_slug": "the-school-bus-mystery",
    "word": "status quo",
    "translation_ru": "существующее положение",
    "translation_kk": "қалыптасқан жағдай",
    "definition_en": "The situation as it is now.",
    "example_sentence": "The story begins with the status quo.",
    "difficulty": "B1",
    "phonetic": null,
    "position": 14
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "bestowed",
    "translation_ru": "даровал",
    "translation_kk": "сыйға тартты",
    "definition_en": "Gave something as a gift or honor.",
    "example_sentence": "Zeus bestowed two gifts on Pandora.",
    "difficulty": "B2",
    "phonetic": null,
    "position": 9
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "ornately",
    "translation_ru": "замысловато",
    "translation_kk": "әшекейлеп",
    "definition_en": "In a highly decorated way.",
    "example_sentence": "The box was ornately carved.",
    "difficulty": "B2",
    "phonetic": null,
    "position": 10
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "earth-shattering",
    "translation_ru": "потрясающий",
    "translation_kk": "дүниені дүр сілкіндірген",
    "definition_en": "Having a dramatic and far-reaching effect.",
    "example_sentence": "Her choice set earth-shattering events in motion.",
    "difficulty": "B2",
    "phonetic": null,
    "position": 11
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "in motion",
    "translation_ru": "в движение",
    "translation_kk": "қозғалысқа",
    "definition_en": "Started and continuing to happen.",
    "example_sentence": "Her curiosity set events in motion.",
    "difficulty": "B2",
    "phonetic": null,
    "position": 12
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "attention to detail",
    "translation_ru": "внимание к деталям",
    "translation_kk": "ұсақ-түйекке назар аудару",
    "definition_en": "Careful notice of small details.",
    "example_sentence": "Athena gave her attention to detail.",
    "difficulty": "B2",
    "phonetic": null,
    "position": 13
  },
  {
    "lesson_slug": "the-ocean-cleanup",
    "word": "under any circumstance",
    "translation_ru": "ни при каких обстоятельствах",
    "translation_kk": "ешбір жағдайда",
    "definition_en": "In any possible situation.",
    "example_sentence": "She was not to open the box under any circumstance.",
    "difficulty": "B2",
    "phonetic": null,
    "position": 14
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "stupor",
    "translation_ru": "оцепенение",
    "translation_kk": "меңіреу күй",
    "definition_en": "A state of reduced awareness.",
    "example_sentence": "Midas spent his days in a stupor.",
    "difficulty": "C1",
    "phonetic": null,
    "position": 9
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "gorging",
    "translation_ru": "объедаясь",
    "translation_kk": "тойып жеп",
    "definition_en": "Eating far more than needed.",
    "example_sentence": "He was gorging himself on feasts.",
    "difficulty": "C1",
    "phonetic": null,
    "position": 10
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "luster",
    "translation_ru": "блеск",
    "translation_kk": "жылтыр",
    "definition_en": "Brightness or a quality of attractiveness.",
    "example_sentence": "He thought his life was lacking luster.",
    "difficulty": "C1",
    "phonetic": null,
    "position": 11
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "picked up",
    "translation_ru": "поднял",
    "translation_kk": "көтеріп алды",
    "definition_en": "Lifted someone or something.",
    "example_sentence": "Midas picked up a bunch of grapes.",
    "difficulty": "C1",
    "phonetic": null,
    "position": 12
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "cast a greedy eye",
    "translation_ru": "бросил жадный взгляд",
    "translation_kk": "ашкөз көз тастады",
    "definition_en": "Looked at something with a strong desire to possess it.",
    "example_sentence": "Midas cast a greedy eye over his surroundings.",
    "difficulty": "C1",
    "phonetic": null,
    "position": 13
  },
  {
    "lesson_slug": "the-midnight-interview",
    "word": "no amount",
    "translation_ru": "никакое количество",
    "translation_kk": "қанша болса да",
    "definition_en": "Not even a large quantity.",
    "example_sentence": "No amount of gold felt like enough.",
    "difficulty": "C1",
    "phonetic": null,
    "position": 14
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "inflicting",
    "translation_ru": "причиняя",
    "translation_kk": "зиян келтіріп",
    "definition_en": "Causing harm or suffering.",
    "example_sentence": "The gods were inflicting horrors on mortals.",
    "difficulty": "C2",
    "phonetic": null,
    "position": 10
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "violation",
    "translation_ru": "нарушение",
    "translation_kk": "бұзушылық",
    "definition_en": "An act of breaking a rule or duty.",
    "example_sentence": "His actions were a violation of tradition.",
    "difficulty": "C2",
    "phonetic": null,
    "position": 11
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "pursued",
    "translation_ru": "преследовал",
    "translation_kk": "қуды",
    "definition_en": "Followed in order to catch someone.",
    "example_sentence": "Aegina's father pursued their trail.",
    "difficulty": "C2",
    "phonetic": null,
    "position": 12
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "show off",
    "translation_ru": "покрасоваться",
    "translation_kk": "мақтану",
    "definition_en": "Display something proudly to impress others.",
    "example_sentence": "Sisyphus wanted to show off his power.",
    "difficulty": "C2",
    "phonetic": null,
    "position": 13
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "found out",
    "translation_ru": "узнал",
    "translation_kk": "біліп қойды",
    "definition_en": "Discovered information previously unknown.",
    "example_sentence": "When Zeus found out, he became furious.",
    "difficulty": "C2",
    "phonetic": null,
    "position": 14
  },
  {
    "lesson_slug": "the-algorithms-garden",
    "word": "in exchange for",
    "translation_ru": "в обмен на",
    "translation_kk": "орнына",
    "definition_en": "As a trade for something else.",
    "example_sentence": "He asked for a spring in exchange for the secret.",
    "difficulty": "C2",
    "phonetic": null,
    "position": 15
  }
]$words$::jsonb) as w(lesson_slug text,word text,phonetic text,translation_ru text,translation_kk text,definition_en text,example_sentence text,difficulty text,position int)
join cartoon_lessons l on l.slug=w.lesson_slug
on conflict(lesson_id,word) do update set
  phonetic=excluded.phonetic,translation_ru=excluded.translation_ru,translation_kk=excluded.translation_kk,
  definition_en=excluded.definition_en,example_sentence=excluded.example_sentence,difficulty=excluded.difficulty,position=excluded.position;
