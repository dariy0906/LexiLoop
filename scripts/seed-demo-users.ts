import pg from 'pg';

type DemoUser = { id: string; name: string; email: string; createdAt: string };
const disabledPasswordHash = '$2b$12$rXqEaEt/ajre8nyFd/diTOzR0hgLR3tKyzpvE79yrh7XCrVUjYhHu';
const rows = `Сараухан Абубакір|saraukhan.abubakir83@example.com|2026-11-06T09:15:00Z
Имбрагим Мади|imbragim.madi41@example.com|2026-11-06T10:20:00Z
Сабит Ильяс|sabit.ilyas72@example.com|2026-11-06T08:45:00Z
Бауржан Амир|baurzhan.amir96@example.com|202u2026-01-16T11:10:00Z`.replace('202u2026', '2026') + `
Серик Санжар|serik.sanzhar35@example.com|2026-11-06T13:35:00Z
Худайберген Санжар|khudaibergen.sanzhar67@example.com|2026-11-06T07:50:00Z
Хасен Асик|khasen.asik54@example.com|2026-11-06T12:05:00Z
Танғали Коля|tangali.kolya28@example.com|2026-11-06T15:25:00Z
Жолдас Думан|zholdas.duman85@example.com|2026-11-06T09:40:00Z
Салауатұлы Али|salauatuly.ali39@example.com|2026-11-06T14:15:00Z
Салават Ерасыл|salavat.erasil61@example.com|2026-11-06T10:55:00Z
Дуйсенгали Айзере|duisengali.aizere47@example.com|2026-11-06T08:30:00Z
Бектурды Нурай|bekturdy.nurai92@example.com|2026-11-06T11:45:00Z
Тлеу Керымай|tleu.kerymai16@example.com|2026-11-06T16:05:00Z
Кенжетай Айару|kenzhetai.aiaru74@example.com|2026-11-06T09:20:00Z
Едыге Ернар|edyge.ernar58@example.com|2026-11-06T12:40:00Z
Айзак Адия Джусипбеккызы|aizak.adiya63@example.com|2026-11-06T08:10:00Z
Асылбекова Инкар Каршыгакызы|asylbekova.inkar27@example.com|2026-11-06T13:25:00Z
Базарбай Адия Бауырбеккызы|bazarbai.adiya84@example.com|2026-11-06T10:35:00Z
Даумшар Нурканат Муратулы|daumshar.nurkanat52@example.com|2026-11-06T15:50:00Z
Досан Бейбарыс Кайратулы|dosan.beibarys73@example.com|2026-11-06T09:05:00Z
Еркінұлы Мәлік|erkinuly.malik46@example.com|2026-11-06T11:30:00Z
Есболат Жәнібек Ерұланұлы|esbolat.zhanibek91@example.com|2026-11-06T14:45:00Z
Жантемір Аяжан Жанболатқызы|zhantemir.ayazhan38@example.com|2026-11-06T08:55:00Z
Жолдас Даулет Дәуренұлы|zholdas.daulet65@example.com|2026-11-06T12:15:00Z
Қожырбай Шыңғыс Амангелдіұлы|kozhyrbai.shyngys24@example.com|2026-11-06T16:20:00Z
Сембаев Ахмедияр Ернарович|sembaev.akhmediyar79@example.com|2026-11-06T10:00:00Z
Төлеш Альтаир Джанатайұлы|tolesh.altair43@example.com|2026-11-06T13:40:00Z
Тулешов Дарий Даниярулы|dariy.tuleshov86@example.com|2026-11-06T09:50:00Z
Тыныштық Диас Куатулы|tynyshtyk.dias31@example.com|2026-11-06T11:05:00Z
Хурметбай Дамир Динмухаммедулы|khurmetbai.damir57@example.com|2026-11-06T15:10:00Z
Шиганаков Темирлан Есжанович|shiganakov.temirlan68@example.com|2026-11-06T08:35:00Z`;
const demoUsers: DemoUser[] = rows.split('\n').map((row, index) => { const [name, email, createdAt] = row.split('|'); return { id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, name, email, createdAt }; });

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing.');
  const database = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await database.query('begin'); let synchronized = 0;
    for (const user of demoUsers) {
      const result = await database.query(`insert into users (id,email,password_hash,display_name,language_preference,timezone,created_at,is_demo) values ($1,$2,$3,$4,'kk','Asia/Almaty',$5,true) on conflict (id) do update set email=excluded.email where users.is_demo=true and users.email is distinct from excluded.email returning email`, [user.id,user.email,disabledPasswordHash,user.name,user.createdAt]);
      synchronized += result.rowCount ?? 0;
    }
    await database.query('commit');
    const [{ count }] = (await database.query<{ count: string }>('select count(*)::text as count from users where is_demo=true')).rows;
    console.log(`Demo users: ${count}; synchronized: ${synchronized}; unchanged: ${demoUsers.length - synchronized}.`);
  } catch (error) { await database.query('rollback'); throw error; } finally { await database.end(); }
}
void seed();
