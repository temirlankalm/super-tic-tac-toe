export type Language = 'ru' | 'en';

export interface Translations {
  common: {
    brandTag: string;
    rules: string;
    analytics: string;
    leaderboard: string;
    close: string;
    copied: string;
    linkCopied: string;
    share: string;
    reset: string;
    done: string;
    or: string;
    cancel: string;
    daysShort: string;
  };
  sectors: {
    topLeft: string;
    topCenter: string;
    topRight: string;
    centerLeft: string;
    center: string;
    centerRight: string;
    bottomLeft: string;
    bottomCenter: string;
    bottomRight: string;
  };
  header: {
    dailyTitle: string;
    dailyButton: string;
    modifiersTitle: string;
    clockTitle: string;
    clockMenuHeader: string;
    soundOn: string;
    soundOff: string;
    lightTheme: string;
    darkTheme: string;
    rulesTitle: string;
    langToggle: string;
    nicknameTitle: string;
    leaderboardTitle: string;
    timeLabels: {
      off: string;
      60: string;
      120: string;
      180: string;
      300: string;
    };
    timeOptions: {
      off: string;
      60: string;
      120: string;
      180: string;
      300: string;
    };
  };
  modes: {
    chooseMode: string;
    rated: string;
    notRated: string;
    ai: {
      label: string;
      desc: string;
    };
    pvp: {
      label: string;
      desc: string;
    };
    online: {
      label: string;
      desc: string;
    };
    daily: {
      label: string;
      desc: string;
    };
  };
  difficulties: {
    easy: string;
    medium: string;
    hard: string;
    qnet: string;
  };
  status: {
    freeMove: string;
    freeMoveTooltip: string;
    sectorTarget: string;
    turnX: string;
    turnO: string;
    yourTurn: string;
    opponentTurn: string;
    qnetThinking: string;
    aiThinking: string;
    connectedWith: string;
    waitingOpponent: string;
    opponentDisconnected: string;
  };
  clock: {
    youX: string;
    opponentO: string;
    player1X: string;
    player2O: string;
    timesUp: string;
  };
  actions: {
    newGame: string;
    resign: string;
    draw: string;
    acceptDraw: string;
    declineDraw: string;
    rematch: string;
    acceptRematch: string;
    offered: string;
    declined: string;
    challengeFriend: string;
    drawOfferedBanner: string;
    rematchOfferedBanner: string;
  };
  results: {
    drawAgreement: string;
    drawGeneric: string;
    youWon: string;
    opponentWon: string;
    xWon: string;
    oWon: string;
    opponentResigned: string;
    youResigned: string;
    timeOut: string;
    threeInRow: string;
    playerWon: string;
    playerBeatAi: string;
    aiBeatPlayer: string;
  };
  rulesModal: {
    title: string;
    subtitle: string;
    rule1Title: string;
    rule1Desc: string;
    rule2Title: string;
    rule2Desc: string;
    rule3Title: string;
    rule3Desc: string;
    rule4Title: string;
    rule4Desc: string;
    button: string;
  };
  settingsModal: {
    title: string;
    subtitle: string;
    activeCount: string;
    nicknameSection: string;
    nicknameDesc: string;
    changeNickname: string;
    fogOfWar: {
      title: string;
      desc: string;
    };
    fadingInk: {
      title: string;
      desc: string;
    };
    speedBlitz: {
      title: string;
      desc: string;
    };
  };
  dailyModal: {
    title: string;
    subtitle: string;
    currentStreak: string;
    recordStreak: string;
    statusWon: string;
    statusLost: string;
    statusInProgress: string;
    statusAvailable: string;
    shareButton: string;
    playButton: string;
    note: string;
    shareSuccess: string;
  };
  onlineModal: {
    title: string;
    subtitle: string;
    roomCode: string;
    copyLink: string;
    enterCodeLabel: string;
    codePlaceholder: string;
    joinButton: string;
    statusConnecting: string;
    statusConnected: string;
    statusWaiting: string;
    disconnectNotice: string;
    leaveRoom: string;
    createNewRoom: string;
    emptyCodeError: string;
    connectFailed: string;
    errorTimeout: string;
    errorNotFound: string;
    errorConnectionFailed: string;
    youLabel: string;
    opponentLabel: string;
  };
  alerts: {
    confirmResignDaily: string;
    confirmLeaveDaily: string;
    aiDeclineDraw: string;
    shareChallengeTitle: string;
    shareChallengeText: string;
    shareChallengeCopied: string;
  };
  cell: {
    fadingSoon: string;
  };
  nicknameModal: {
    chooseTitle: string;
    changeTitle: string;
    subtitle: string;
    placeholder: string;
    save: string;
    skip: string;
    cancel: string;
    randomizeTooltip: string;
    rulesHint: string;
    tooShort: string;
    tooLong: string;
    invalidChars: string;
    profanityError: string;
    nicknameTaken: string;
    eloNote: string;
  };
  sideSelection: {
    side: string;
    chooseSide: string;
    random: string;
    youAreX: string;
    youAreO: string;
    yourTurn: string;
    aiTurn: string;
    opponentTurn: string;
    creatorPlays: string;
    joinerPlays: string;
    pvpXFirst: string;
    player1: string;
    player2: string;
    swappedNotice: string;
  };
}
