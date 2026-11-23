export type Language = 'ru' | 'en';

export interface Translations {
  common: {
    brandTag: string;
    rules: string;
    analytics: string;
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
}
