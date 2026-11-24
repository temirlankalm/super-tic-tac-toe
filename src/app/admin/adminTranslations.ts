export type AdminLang = 'ru' | 'en';

export interface AdminStrings {
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    errorRequired: string;
    errorInvalid: string;
    errorNetwork: string;
    returnToGame: string;
    lightTheme: string;
    darkTheme: string;
  };
  header: {
    title: string;
    subtitle: string;
    onlineNow: string;
    returnToGame: string;
    refresh: string;
    exportCsv: string;
    exportingCsv: string;
    resetData: string;
    resetConfirmPrompt: string;
    resetConfirmYes: string;
    resetConfirmNo: string;
    resetDone: string;
    logout: string;
    autoRefreshOn: string;
    autoRefreshOff: string;
    updatedAt: string;
    ranges: {
      '24h': string;
      '7d': string;
      '30d': string;
      all: string;
    };
    tabs: {
      all: string;
      traffic: string;
      gameplay: string;
      events: string;
    };
  };
  kpi: {
    onlineTitle: string;
    onlineDesc: string;
    uniquesTitle: string;
    uniquesDesc: (visits: number, todayUniques: number) => string;
    retentionTitle: string;
    retentionDesc: (returning: number, newV: number) => string;
    matchesTitle: string;
    matchesDesc: (completion: number, avgSession: string) => string;
    trafficBalance: string;
    humansLabel: string;
    botsLabel: string;
    botsExcluded: string;
  };
  timeline: {
    title: string;
    subtitle24h: string;
    subtitleDays: (range: string) => string;
    legendVisits: string;
    legendUniques: string;
    legendBots: string;
    hoverHint: string;
    visits: string;
    uniques: string;
    bots: string;
    noData: string;
  };
  sections: {
    trafficGeoHeading: string;
    gameplayHeading: string;
    logsHeading: string;
  };
  countries: {
    title: string;
    subtitle: string;
    countLabel: (n: number) => string;
    empty: string;
    visitsShort: string;
    uniquesShort: string;
  };
  devices: {
    title: string;
    subtitle: string;
    desktop: string;
    mobile: string;
    tablet: string;
    browsersTitle: string;
    osTitle: string;
    empty: string;
  };
  arrivals: {
    title: string;
    subtitle: string;
    hoursBadge: string;
    peakLabel: string;
    peakVisits: (n: number) => string;
    empty: string;
    hoverHint: string;
  };
  referrers: {
    title: string;
    subtitle: string;
    allDirect: string;
    categories: Record<'Direct' | 'Search' | 'Social' | 'Reddit' | 'Other', string>;
  };
  funnel: {
    title: string;
    subtitle: string;
    steps: [string, string, string, string];
    viralityLabel: string;
    completionLabel: string;
    finishedLabel: (n: number) => string;
    avgSessionLabel: string;
  };
  sectors: {
    title: string;
    subtitle: string;
    clicksLabel: (n: number) => string;
    topBadge: string;
    topInsight: (idx: number, name: string, clicks: number) => string;
    empty: string;
    names: Record<number, string>;
  };
  features: {
    title: string;
    subtitle: string;
    modesTitle: string;
    difficultyTitle: string;
    timersTitle: string;
    modifiersTitle: string;
    empty: string;
    modeLabels: Record<string, string>;
    difficultyLabels: Record<string, string>;
    modifierLabels: Record<string, string>;
    timerLabels: Record<string, string>;
  };
  buttons: {
    title: string;
    subtitle: string;
    empty: string;
    labels: Record<string, string>;
  };
  bots: {
    title: string;
    subtitle: string;
    hits: string;
    empty: string;
  };
  stream: {
    title: string;
    subtitle: string;
    filters: {
      all: string;
      humans: string;
      pageviews: string;
      games: string;
      bots: string;
    };
    columns: {
      time: string;
      event: string;
      visitor: string;
      location: string;
      client: string;
      details: string;
    };
    visitorBadges: {
      bot: string;
      returning: string;
      new: string;
    };
    empty: string;
    agoSec: (s: number) => string;
    agoMin: (m: number) => string;
    agoHour: (h: number) => string;
    showingCount: (shown: number, total: number) => string;
  };
}

export const ADMIN_STRINGS: Record<AdminLang, AdminStrings> = {
  ru: {
    login: {
      title: 'tic³ · доступ администратора',
      subtitle: 'приватная аналитика платформы. вход защищён httpOnly-сессией и лимитом попыток.',
      emailLabel: 'email (опционально)',
      emailPlaceholder: 'admin@ttt.temr.dev',
      passwordLabel: 'пароль администратора',
      passwordPlaceholder: 'введите пароль',
      submit: 'войти в дашборд',
      submitting: 'проверка доступа…',
      errorRequired: 'введите пароль',
      errorInvalid: 'неверный пароль или email',
      errorNetwork: 'ошибка соединения с сервером',
      returnToGame: 'вернуться к игре',
      lightTheme: 'светлая',
      darkTheme: 'тёмная',
    },
    header: {
      title: 'tic³ · аналитика',
      subtitle: 'живая телеметрия без демо-данных · визиты, география, партии и события',
      onlineNow: 'онлайн',
      returnToGame: 'в игру',
      refresh: 'обновить',
      exportCsv: 'CSV',
      exportingCsv: 'экспорт…',
      resetData: 'сброс',
      resetConfirmPrompt: 'сбросить всю статистику?',
      resetConfirmYes: 'да, сбросить',
      resetConfirmNo: 'отмена',
      resetDone: 'данные очищены',
      logout: 'выйти',
      autoRefreshOn: 'авто 30с',
      autoRefreshOff: 'пауза',
      updatedAt: 'обновлено',
      ranges: {
        '24h': '24ч',
        '7d': '7д',
        '30d': '30д',
        all: 'всё',
      },
      tabs: {
        all: 'весь обзор',
        traffic: 'трафик и гео',
        gameplay: 'геймплей и ui',
        events: 'журнал событий',
      },
    },
    kpi: {
      onlineTitle: 'сейчас онлайн',
      onlineDesc: 'активных людей за последние 5 минут',
      uniquesTitle: 'уникальные люди',
      uniquesDesc: (visits, todayUniques) => `${visits} визитов за период · сегодня ${todayUniques} чел.`,
      retentionTitle: 'возвращаемость',
      retentionDesc: (returning, newV) => `${returning} вернулись · ${newV} впервые`,
      matchesTitle: 'сыграно партий',
      matchesDesc: (completion, avgSession) => `доиграно ${completion}% · ср. сессия ${avgSession}`,
      trafficBalance: 'баланс трафика',
      humansLabel: 'люди (визиты)',
      botsLabel: 'боты и краулеры',
      botsExcluded: 'боты не учитываются в метриках игроков',
    },
    timeline: {
      title: 'динамика визитов',
      subtitle24h: 'почасовой срез за последние 24 часа',
      subtitleDays: (range) => `ежедневная динамика за период (${range})`,
      legendVisits: 'визиты (люди)',
      legendUniques: 'уникальные',
      legendBots: 'боты',
      hoverHint: 'наведите или нажмите на столбец для деталей',
      visits: 'визиты',
      uniques: 'уник.',
      bots: 'боты',
      noData: 'за выбранный период визитов пока не было',
    },
    sections: {
      trafficGeoHeading: 'аудитория, устройства и география',
      gameplayHeading: 'геймплей, воронка и интерфейс',
      logsHeading: 'безопасность и лента событий',
    },
    countries: {
      title: 'страны и города',
      subtitle: 'реальные визиты по геолокации',
      countLabel: (n) => `${n} стран`,
      empty: 'геоданные появятся после первых визитов',
      visitsShort: 'виз.',
      uniquesShort: 'чел.',
    },
    devices: {
      title: 'устройства и браузеры',
      subtitle: 'тип экрана и клиентская платформа',
      desktop: 'десктоп',
      mobile: 'смартфон',
      tablet: 'планшет',
      browsersTitle: 'браузеры',
      osTitle: 'системы',
      empty: 'пока нет данных об устройствах',
    },
    arrivals: {
      title: 'суточный ритм приходов',
      subtitle: 'в какие часы заходят игроки (00:00–23:00)',
      hoursBadge: '24 часа',
      peakLabel: 'пик активности',
      peakVisits: (n) => `${n} виз. в пик`,
      empty: 'данные по часам появятся с первыми визитами',
      hoverHint: 'нажмите на час для деталей',
    },
    referrers: {
      title: 'источники трафика',
      subtitle: 'откуда приходят игроки',
      allDirect: 'все зафиксированные визиты были прямыми (direct)',
      categories: {
        Direct: 'прямые',
        Search: 'поиск',
        Social: 'соцсети',
        Reddit: 'reddit',
        Other: 'другое',
      },
    },
    funnel: {
      title: 'воронка вовлечения',
      subtitle: 'путь от захода на сайт до активной игры и шеринга',
      steps: [
        '1. визит на страницу',
        '2. старт партии',
        '3. завершение партии',
        '4. комнаты и шеринг',
      ],
      viralityLabel: 'виральность (шеринг / визит)',
      completionLabel: 'доходимость партий',
      finishedLabel: (n) => `${n} завершено`,
      avgSessionLabel: 'средняя сессия',
    },
    sectors: {
      title: 'карта секторов 3×3',
      subtitle: 'куда игроки чаще всего ставят ходы (0–8)',
      clicksLabel: (n) => `${n} ходов`,
      topBadge: 'топ',
      topInsight: (idx, name, clicks) => `лидирует сектор #${idx} (${name}) — ${clicks} ходов`,
      empty: 'ходы по доске пока не зафиксированы',
      names: {
        0: 'верх-лево',
        1: 'верх-центр',
        2: 'верх-право',
        3: 'центр-лево',
        4: 'центр',
        5: 'центр-право',
        6: 'низ-лево',
        7: 'низ-центр',
        8: 'низ-право',
      },
    },
    features: {
      title: 'режимы и настройки',
      subtitle: 'реальный выбор игроков в партиях',
      modesTitle: 'режимы игры',
      difficultyTitle: 'сложность ии',
      timersTitle: 'контроль времени',
      modifiersTitle: 'модификаторы',
      empty: 'нет данных',
      modeLabels: {
        ai: 'против ии',
        pvp: 'локально 2p',
        online: 'онлайн с другом',
        daily: 'дневной челлендж',
      },
      difficultyLabels: {
        easy: 'лёгкий',
        medium: 'средний',
        hard: 'сложный',
        qnet: 'qnet (профи)',
      },
      modifierLabels: {
        fogOfWar: 'туман войны',
        fadingInk: 'чернила',
        speedBlitz: 'блиц 5с',
      },
      timerLabels: {
        off: 'без таймера',
        '180': '3 мин',
        '300': '5 мин',
        '600': '10 мин',
      },
    },
    buttons: {
      title: 'действия в интерфейсе',
      subtitle: 'какие кнопки нажимают чаще всего',
      empty: 'клики по интерфейсу пока не зафиксированы',
      labels: {
        pageview: 'открытие страницы',
        board_cell_click: 'ход на доске',
        game_start: 'старт партии',
        game_win: 'победа в партии',
        game_loss: 'поражение в партии',
        game_draw: 'ничья в партии',
        game_finish: 'финиш партии',
        daily_challenge_played: 'дневной челлендж',
        room_created: 'создание комнаты',
        open_rules: 'открыть правила',
        open_settings: 'открыть модификаторы',
        open_daily: 'дневной челлендж',
        open_daily_modal: 'открыть челлендж',
        open_online_modal: 'игра с другом (комната)',
        open_nickname: 'изменить никнейм',
        language_toggle: 'смена языка (RU/EN)',
        theme_toggle: 'смена темы',
        sound_toggle: 'звук вкл/выкл',
        room_link_copy: 'копировать ссылку комнаты',
        room_link_share: 'поделиться комнатой',
        challenge_a_friend: 'бросить вызов другу',
        share_result: 'поделиться результатом',
        outbound_link: 'переход на temr.dev',
      },
    },
    bots: {
      title: 'боты и краулеры',
      subtitle: 'автоматический трафик, отфильтрованный из статистики людей',
      hits: 'запр.',
      empty: 'ботов за выбранный период не зафиксировано',
    },
    stream: {
      title: 'единый журнал событий',
      subtitle: 'последние визиты, партии и действия в реальном времени',
      filters: {
        all: 'все',
        humans: 'только люди',
        pageviews: 'визиты',
        games: 'игры',
        bots: 'боты',
      },
      columns: {
        time: 'время',
        event: 'событие',
        visitor: 'посетитель',
        location: 'страна / город',
        client: 'устройство',
        details: 'источник / детали',
      },
      visitorBadges: {
        bot: 'бот',
        returning: 'вернулся',
        new: 'новый',
      },
      empty: 'событий по выбранному фильтру пока нет',
      agoSec: (s) => `${s}с назад`,
      agoMin: (m) => `${m}м назад`,
      agoHour: (h) => `${h}ч назад`,
      showingCount: (shown, total) => `показано ${shown} из ${total}`,
    },
  },
  en: {
    login: {
      title: 'tic³ · admin access',
      subtitle: 'private platform telemetry. protected by httpOnly session and rate limiting.',
      emailLabel: 'email (optional)',
      emailPlaceholder: 'admin@ttt.temr.dev',
      passwordLabel: 'admin password',
      passwordPlaceholder: 'enter password',
      submit: 'sign in to dashboard',
      submitting: 'verifying…',
      errorRequired: 'password is required',
      errorInvalid: 'invalid credentials',
      errorNetwork: 'server connection error',
      returnToGame: 'return to game',
      lightTheme: 'light',
      darkTheme: 'dark',
    },
    header: {
      title: 'tic³ · analytics',
      subtitle: 'pure live telemetry · visits, geography, matches and user events',
      onlineNow: 'online',
      returnToGame: 'to game',
      refresh: 'refresh',
      exportCsv: 'CSV',
      exportingCsv: 'exporting…',
      resetData: 'reset',
      resetConfirmPrompt: 'clear all collected stats?',
      resetConfirmYes: 'yes, clear',
      resetConfirmNo: 'cancel',
      resetDone: 'data cleared',
      logout: 'log out',
      autoRefreshOn: 'live 30s',
      autoRefreshOff: 'paused',
      updatedAt: 'updated',
      ranges: {
        '24h': '24h',
        '7d': '7d',
        '30d': '30d',
        all: 'all',
      },
      tabs: {
        all: 'overview',
        traffic: 'traffic & geo',
        gameplay: 'gameplay & ui',
        events: 'event log',
      },
    },
    kpi: {
      onlineTitle: 'online now',
      onlineDesc: 'active humans in the last 5 minutes',
      uniquesTitle: 'unique players',
      uniquesDesc: (visits, todayUniques) => `${visits} visits in range · ${todayUniques} today`,
      retentionTitle: 'retention rate',
      retentionDesc: (returning, newV) => `${returning} returning · ${newV} first-time`,
      matchesTitle: 'matches played',
      matchesDesc: (completion, avgSession) => `${completion}% completed · avg ${avgSession}`,
      trafficBalance: 'traffic split',
      humansLabel: 'human visits',
      botsLabel: 'bots & crawlers',
      botsExcluded: 'bots are excluded from all player metrics',
    },
    timeline: {
      title: 'visits over time',
      subtitle24h: 'hourly breakdown over the last 24 hours',
      subtitleDays: (range) => `daily trajectory for selected range (${range})`,
      legendVisits: 'visits (humans)',
      legendUniques: 'uniques',
      legendBots: 'bots',
      hoverHint: 'hover or tap a bar for exact numbers',
      visits: 'visits',
      uniques: 'uniq.',
      bots: 'bots',
      noData: 'no visits recorded in this period yet',
    },
    sections: {
      trafficGeoHeading: 'audience, devices & geography',
      gameplayHeading: 'gameplay, funnel & interface',
      logsHeading: 'security & live event log',
    },
    countries: {
      title: 'countries & cities',
      subtitle: 'human visits by geolocation',
      countLabel: (n) => `${n} countries`,
      empty: 'country data will appear after the first visits',
      visitsShort: 'vis.',
      uniquesShort: 'ppl.',
    },
    devices: {
      title: 'devices & browsers',
      subtitle: 'form factors and client software',
      desktop: 'desktop',
      mobile: 'mobile',
      tablet: 'tablet',
      browsersTitle: 'browsers',
      osTitle: 'operating systems',
      empty: 'no device data recorded yet',
    },
    arrivals: {
      title: '24-hour arrival rhythm',
      subtitle: 'when players open the game (00:00–23:00)',
      hoursBadge: '24 hours',
      peakLabel: 'peak window',
      peakVisits: (n) => `${n} visits at peak`,
      empty: 'hourly data will appear once visits arrive',
      hoverHint: 'tap any hour for details',
    },
    referrers: {
      title: 'traffic sources',
      subtitle: 'where players discover Tic³',
      allDirect: 'all recorded visits were direct',
      categories: {
        Direct: 'direct',
        Search: 'search',
        Social: 'social',
        Reddit: 'reddit',
        Other: 'other',
      },
    },
    funnel: {
      title: 'engagement funnel',
      subtitle: 'from landing on the page to finishing & sharing matches',
      steps: [
        '1. page visit',
        '2. match started',
        '3. match finished',
        '4. rooms & shares',
      ],
      viralityLabel: 'virality (shares / visit)',
      completionLabel: 'match completion',
      finishedLabel: (n) => `${n} finished`,
      avgSessionLabel: 'avg active session',
    },
    sectors: {
      title: '3×3 sector heatmap',
      subtitle: 'where players place moves most often (0–8)',
      clicksLabel: (n) => `${n} moves`,
      topBadge: 'top',
      topInsight: (idx, name, clicks) => `most played: sector #${idx} (${name}) — ${clicks} moves`,
      empty: 'no board moves recorded yet',
      names: {
        0: 'top-left',
        1: 'top-center',
        2: 'top-right',
        3: 'mid-left',
        4: 'center',
        5: 'mid-right',
        6: 'bot-left',
        7: 'bot-center',
        8: 'bot-right',
      },
    },
    features: {
      title: 'modes & settings',
      subtitle: 'actual player choices across matches',
      modesTitle: 'game modes',
      difficultyTitle: 'ai difficulty',
      timersTitle: 'chess clocks',
      modifiersTitle: 'modifiers',
      empty: 'no data yet',
      modeLabels: {
        ai: 'vs ai',
        pvp: 'local 2p',
        online: 'online friend',
        daily: 'daily challenge',
      },
      difficultyLabels: {
        easy: 'easy',
        medium: 'medium',
        hard: 'hard',
        qnet: 'qnet (pro)',
      },
      modifierLabels: {
        fogOfWar: 'fog of war',
        fadingInk: 'fading ink',
        speedBlitz: 'speed blitz',
      },
      timerLabels: {
        off: 'no timer',
        '180': '3 min',
        '300': '5 min',
        '600': '10 min',
      },
    },
    buttons: {
      title: 'ui interactions',
      subtitle: 'most clicked controls and modals',
      empty: 'no ui clicks recorded yet',
      labels: {
        pageview: 'page visit',
        board_cell_click: 'board move',
        game_start: 'match started',
        game_win: 'match won',
        game_loss: 'match lost',
        game_draw: 'match draw',
        game_finish: 'match finished',
        daily_challenge_played: 'daily challenge',
        room_created: 'room created',
        open_rules: 'open rules',
        open_settings: 'open modifiers',
        open_daily: 'daily challenge',
        open_daily_modal: 'open daily modal',
        open_online_modal: 'play online modal',
        open_nickname: 'change nickname',
        language_toggle: 'language switch',
        theme_toggle: 'theme toggle',
        sound_toggle: 'sound toggle',
        room_link_copy: 'copy room link',
        room_link_share: 'share room',
        challenge_a_friend: 'challenge friend',
        share_result: 'share match result',
        outbound_link: 'temr.dev link',
      },
    },
    bots: {
      title: 'bots & crawlers',
      subtitle: 'automated requests excluded from human metrics',
      hits: 'hits',
      empty: 'no bot traffic recorded in this period',
    },
    stream: {
      title: 'unified event log',
      subtitle: 'latest arrivals, matches and actions in real time',
      filters: {
        all: 'all',
        humans: 'humans',
        pageviews: 'visits',
        games: 'games',
        bots: 'bots',
      },
      columns: {
        time: 'time',
        event: 'event',
        visitor: 'visitor',
        location: 'country / city',
        client: 'device',
        details: 'source / metadata',
      },
      visitorBadges: {
        bot: 'bot',
        returning: 'returning',
        new: 'new',
      },
      empty: 'no events match the selected filter',
      agoSec: (s) => `${s}s ago`,
      agoMin: (m) => `${m}m ago`,
      agoHour: (h) => `${h}h ago`,
      showingCount: (shown, total) => `showing ${shown} of ${total}`,
    },
  },
};
