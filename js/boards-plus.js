/* ==========================================================================
   HOCKEY TACTICS — movement overlay (v2)
   Adds to every tactic board: movement trails, live direction arrows,
   pass order chips, zone annotations and man-marking links. Replaces the
   traditional / modern comparison plays with visibly different motion.
   Runs after js/tactics.js, which owns the board instances.
   ========================================================================== */
(function () {
  'use strict';

  var LANG = window.HOCKEY_LANG === 'ko' ? 'ko' : 'en';

  function tr(o) {
    if (!o) { return ''; }
    if (typeof o === 'string') { return o; }
    return LANG === 'ko' && o.ko ? o.ko : (o.en || '');
  }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { return u * u * (3 - 2 * u); }
  function sample(keys, p) {
    if (!keys || !keys.length) { return [0, 0]; }
    if (p <= keys[0][0]) { return [keys[0][1], keys[0][2]]; }
    for (var i = 1; i < keys.length; i++) {
      if (p <= keys[i][0]) {
        var t0 = keys[i - 1][0], t1 = keys[i][0];
        var u = t1 === t0 ? 1 : (p - t0) / (t1 - t0);
        u = ease(Math.max(0, Math.min(1, u)));
        return [lerp(keys[i - 1][1], keys[i][1], u), lerp(keys[i - 1][2], keys[i][2], u)];
      }
    }
    var last = keys[keys.length - 1];
    return [last[1], last[2]];
  }
  function arrow(x1, y1, x2, y2, size) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    var s = size || 7;
    var bx = x2 - ux * s, by = y2 - uy * s;
    var px = -uy * s * 0.5, py = ux * s * 0.5;
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      'L' + bx.toFixed(1) + ' ' + by.toFixed(1) +
      'M' + (bx + px).toFixed(1) + ' ' + (by + py).toFixed(1) +
      'L' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
      'L' + (bx - px).toFixed(1) + ' ' + (by - py).toFixed(1) + 'Z';
  }

  /* ------------------------------------------------------------ new plays */
  var P = {};

  /* ---------------- forecheck ---------------- */
  P.fcTrad = {
    dur: 6200, mode: 'mini',
    name: { en: '2-1-2 forecheck', ko: '2-1-2 포체크' },
    sub: { en: 'Two chase the puck, one high, two on the line.', ko: '두 명이 퍽을 쫓고, 한 명 하이, 두 명 라인.' },
    badge: { en: 'Two chase the same corner', ko: '두 명이 같은 코너로' },
    steps: [
      { t: 0, en: 'Dump-in lands in the corner', ko: '덤프인이 코너에 떨어짐' },
      { t: 0.25, en: 'F1 and F2 both attack the puck', ko: 'F1·F2가 동시에 퍽으로' },
      { t: 0.55, en: 'Two-on-one at the wall', ko: '보드에서 2대1' },
      { t: 0.8, en: 'Puck won — middle is empty', ko: '퍽 획득, 그러나 중앙 공백' }
    ],
    players: [
      { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 500, 126], [0.28, 524, 186], [0.6, 540, 224], [1, 540, 224]] },
      { id: 'F2', tg: 'h', l: 'F2', keys: [[0, 478, 196], [0.28, 500, 214], [0.6, 520, 228], [1, 520, 228]] },
      { id: 'F3', tg: 'h', l: 'F3', keys: [[0, 362, 140], [0.3, 376, 128], [1, 376, 128]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 300, 88], [1, 300, 88]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 300, 192], [1, 300, 192]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 546, 240], [0.6, 540, 246], [1, 540, 246]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 472, 252], [0.6, 466, 250], [1, 466, 250]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 548, 238], [0.35, 542, 244], [1, 540, 246]],
    zones: [
      { d: 'M404 92 H470 V188 H404 Z', at: [437, 82], label: { en: 'middle left open', ko: '중앙이 비어 있음' }, c: 'warn' },
      { d: 'M508 200 a34 30 0 1 0 62 0 a34 30 0 1 0 -62 0', at: [538, 260], label: { en: '2 v 1 on the wall', ko: '보드 2대1' }, c: 'warn' }
    ],
    arrows: [
      { d: 'M500 128 Q520 180 536 218', n: '1', c: 'chase' },
      { d: 'M480 198 Q504 214 518 222', n: '2', c: 'chase' }
    ]
  };

  P.fcMod = {
    dur: 9400, mode: 'mini',
    name: { en: '1-3-1 layered forecheck', ko: '1-3-1 레이어 포체크' },
    sub: { en: 'One presses, three hold a wall, one stays high.', ko: '한 명 압박, 세 명 벽, 한 명 하이.' },
    badge: { en: 'One presses · three hold the wall', ko: '1명 압박 · 3명 벽 유지' },
    steps: [
      { t: 0, en: 'Wall is already set on the line', ko: '블루라인에 벽이 미리 서 있음' },
      { t: 0.3, en: 'F1 pressures above the puck', ko: 'F1이 퍽 위에서 압박' },
      { t: 0.62, en: 'The only pass is into the wall', ko: '남은 패스는 벽 쪽뿐' },
      { t: 0.85, en: 'Wall intercepts, counter starts', ko: '벽이 차단, 역습 시작' }
    ],
    players: [
      { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 506, 148], [0.35, 518, 172], [0.7, 520, 188], [1, 520, 188]] },
      { id: 'F2', tg: 'h', l: 'F2', keys: [[0, 398, 72], [0.4, 404, 78], [1, 404, 78]] },
      { id: 'F3', tg: 'h', l: 'F3', keys: [[0, 396, 140], [0.4, 410, 140], [1, 410, 140]] },
      { id: 'F4', tg: 'h', l: 'F4', keys: [[0, 396, 208], [0.4, 404, 202], [1, 404, 202]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 318, 140], [1, 318, 140]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 546, 240], [1, 540, 246]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 472, 252], [1, 466, 250]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 548, 238], [0.35, 540, 246], [0.58, 470, 150], [0.82, 414, 140], [1, 404, 80]],
    zones: [
      { d: 'M400 60 L412 220', at: [428, 236], label: { en: 'wall of three', ko: '3인 벽' }, c: 'good' }
    ],
    arrows: [
      { d: 'M534 240 Q486 196 420 142', n: '1', c: 'pass' },
      { d: 'M402 76 Q330 72 286 58', n: '2', c: 'shot' }
    ]
  };

  /* ---------------- breakout ---------------- */
  P.boTrad = {
    dur: 6400, mode: 'mini',
    name: { en: 'Rim and chase', ko: '림 앤 체이스' },
    sub: { en: 'Fire it around the boards, everyone races.', ko: '보드로 걷어내고 모두 경쟁.' },
    badge: { en: 'One long rim — 50-50 puck', ko: '긴 림 한 번 — 50대50' },
    steps: [
      { t: 0, en: 'D retrieves behind the net', ko: '수비수가 골대 뒤에서 회수' },
      { t: 0.24, en: 'Rim hard around the boards', ko: '보드를 따라 강하게 림' },
      { t: 0.55, en: 'Winger wins the race', ko: '윙어가 경쟁에서 승리' },
      { t: 0.8, en: 'Chip up the wall, no support', ko: '월로 칩, 서포트 없음' }
    ],
    players: [
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 84, 150], [0.25, 92, 156], [1, 96, 158]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 134, 98], [0.3, 150, 108], [1, 152, 110]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 158, 42], [0.5, 196, 44], [0.8, 232, 52], [1, 250, 54]] },
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 198, 198], [0.6, 210, 182], [1, 216, 176]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 256, 116], [1, 300, 118]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 128, 118], [0.5, 146, 84], [1, 156, 76]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 178, 168], [0.5, 196, 120], [1, 204, 116]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 86, 150], [0.22, 150, 26], [0.5, 170, 40], [0.78, 236, 52], [1, 236, 52]],
    zones: [
      { d: 'M70 176 H170 V232 H70 Z', at: [120, 246], label: { en: 'no short option', ko: '숏 옵션 없음' }, c: 'warn' }
    ],
    arrows: [
      { d: 'M92 146 Q100 40 158 32', n: '1', c: 'warn' },
      { d: 'M170 40 Q204 44 232 50', n: '2', c: 'warn' }
    ]
  };

  P.boMod = {
    dur: 9800, mode: 'mini',
    name: { en: 'Five-man short support', ko: '5인 숏 서포트' },
    sub: { en: 'D-to-D, centre swings low, both wingers move before the pass.', ko: 'D-to-D, 센터 로 스윙, 윙어 둘은 패스 전에 이동.' },
    badge: { en: 'Five skaters move · four short passes', ko: '5명 이동 · 짧은 패스 4회' },
    steps: [
      { t: 0, en: 'D1 retrieves, partner opens', ko: 'D1 회수, 파트너가 각을 엶' },
      { t: 0.2, en: 'D-to-D changes the angle', ko: 'D-to-D로 각도 전환' },
      { t: 0.42, en: 'Centre swings low as the short option', ko: '센터가 낮게 스윙해 숏 옵션' },
      { t: 0.64, en: 'Winger receives already skating', ko: '윙어가 달리며 받음' },
      { t: 0.86, en: 'Fifth man is the exit pass', ko: '다섯 번째 선수가 출구 패스' }
    ],
    players: [
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 80, 120], [0.18, 88, 126], [1, 90, 128]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 82, 168], [0.18, 104, 174], [1, 106, 176]] },
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 150, 212], [0.4, 164, 200], [0.62, 176, 196], [1, 178, 194]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 176, 86], [0.45, 196, 90], [0.75, 228, 96], [1, 232, 98]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 240, 184], [0.62, 262, 170], [1, 292, 160]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 140, 110], [0.5, 166, 76], [1, 176, 72]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 196, 164], [0.5, 216, 128], [1, 222, 124]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 82, 124], [0.2, 102, 172], [0.42, 170, 198], [0.64, 226, 96], [0.86, 288, 158], [1, 288, 158]],
    zones: [
      { d: 'M160 206 L232 90 L292 162 Z', at: [238, 232], label: { en: 'support triangle', ko: '서포트 삼각형' }, c: 'good' }
    ],
    arrows: [
      { d: 'M84 128 L100 168', n: '1', c: 'pass' },
      { d: 'M108 176 L164 196', n: '2', c: 'pass' },
      { d: 'M178 192 L224 100', n: '3', c: 'pass' },
      { d: 'M236 100 L282 154', n: '4', c: 'pass' }
    ]
  };

  /* ---------------- neutral zone ---------------- */
  P.nzTrad = {
    dur: 6800, mode: 'mini',
    name: { en: '1-2-2', ko: '1-2-2' },
    sub: { en: 'One, two, two — a shape that reacts.', ko: '1, 2, 2 — 반응하는 형태.' },
    badge: { en: 'Reacts after the pass', ko: '패스 후에 반응' },
    steps: [
      { t: 0, en: 'Carrier enters the neutral zone', ko: '캐리어가 중립존 진입' },
      { t: 0.3, en: 'Middle pair closes late', ko: '중앙 두 명이 늦게 닫음' },
      { t: 0.6, en: 'Carrier is steered to the wall', ko: '캐리어가 월로 몰림' },
      { t: 0.85, en: 'Dump-in becomes a 50-50', ko: '덤프인이 50대50으로' }
    ],
    players: [
      { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 404, 140], [0.3, 386, 136], [1, 386, 136]] },
      { id: 'M1', tg: 'h', l: 'M', keys: [[0, 332, 88], [0.3, 336, 108], [1, 336, 108]] },
      { id: 'M2', tg: 'h', l: 'M', keys: [[0, 332, 192], [0.3, 336, 172], [1, 336, 172]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 252, 92], [0.4, 258, 98], [1, 258, 98]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 252, 188], [0.4, 258, 182], [1, 258, 182]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 372, 106], [0.45, 340, 128], [1, 306, 64]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 396, 178], [0.5, 360, 170], [1, 320, 150]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 372, 106], [0.3, 342, 126], [0.6, 310, 78], [1, 296, 46]],
    zones: [
      { d: 'M330 92 L330 188', at: [336, 214], label: { en: 'seam closes late', ko: '시암이 늦게 닫힘' }, c: 'warn' }
    ],
    arrows: [{ d: 'M368 104 Q340 92 320 76', n: '1', c: 'warn' }]
  };

  P.nzMod = {
    dur: 9400, mode: 'mini',
    name: { en: '1-3-1 trap', ko: '1-3-1 트랩' },
    sub: { en: 'The wall is set before the pass is made.', ko: '패스가 나오기 전에 벽이 서 있음.' },
    badge: { en: 'Wall set before the pass', ko: '패스 전에 벽 완성' },
    steps: [
      { t: 0, en: 'Wall is formed on the centre line', ko: '센터라인에 벽 형성' },
      { t: 0.3, en: 'Carrier is steered to the wall', ko: '캐리어를 월로 유도' },
      { t: 0.6, en: 'The only pass is the bad one', ko: '유일한 패스는 나쁜 패스' },
      { t: 0.85, en: 'Interception, counter with numbers', ko: '차단 후 수적 우위 역습' }
    ],
    players: [
      { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 392, 140], [0.25, 376, 136], [1, 372, 132]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 330, 74], [0.3, 342, 86], [1, 346, 88]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 330, 140], [0.3, 342, 148], [1, 346, 150]] },
      { id: 'W3', tg: 'h', l: 'W', keys: [[0, 330, 206], [0.3, 342, 196], [1, 346, 194]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 252, 140], [1, 252, 140]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 388, 92], [0.35, 356, 116], [0.62, 338, 74], [1, 330, 56]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 398, 180], [0.5, 366, 176], [1, 340, 168]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 388, 92], [0.35, 358, 118], [0.55, 344, 90], [0.7, 348, 88], [1, 348, 88]],
    zones: [
      { d: 'M340 70 L348 200', at: [352, 226], label: { en: 'wall holds the line', ko: '벽이 라인 유지' }, c: 'good' }
    ],
    arrows: [
      { d: 'M390 94 Q370 108 356 118', n: '1', c: 'warn' },
      { d: 'M344 84 Q306 70 282 58', n: '2', c: 'shot' }
    ]
  };

  /* ---------------- d-zone ---------------- */
  P.dzTrad = {
    dur: 7200, mode: 'mini',
    name: { en: 'Man-on-man', ko: '맨투맨' },
    sub: { en: 'Every defender follows one attacker, wherever he goes.', ko: '수비수마다 한 명을 따라다님.' },
    badge: { en: 'Every check follows its man', ko: '각자 맡은 선수를 따라감' },
    steps: [
      { t: 0, en: 'Everyone takes a man', ko: '각자 한 명씩 마크' },
      { t: 0.3, en: 'Attackers drag their checks away', ko: '공격수가 수비수를 끌고 이동' },
      { t: 0.6, en: 'Slot opens behind the chase', ko: '추격 뒤로 슬롯이 열림' },
      { t: 0.85, en: 'One lost battle is a chance', ko: '한 번의 패배가 실점 기회' }
    ],
    players: [
      { id: 'M1', tg: 'h', l: '', keys: [[0, 96, 92], [0.3, 86, 86], [1, 82, 84]] },
      { id: 'M2', tg: 'h', l: '', keys: [[0, 96, 190], [0.3, 88, 196], [1, 84, 198]] },
      { id: 'M3', tg: 'h', l: '', keys: [[0, 144, 130], [0.5, 132, 142], [1, 128, 144]] },
      { id: 'M4', tg: 'h', l: '', keys: [[0, 184, 178], [0.3, 176, 186], [1, 172, 188]] },
      { id: 'M5', tg: 'h', l: '', keys: [[0, 188, 74], [0.3, 196, 66], [1, 198, 64]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 74, 86], [0.3, 68, 82], [1, 64, 80]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 74, 196], [0.3, 66, 200], [1, 62, 202]] },
      { id: 'X3', tg: 'a', l: '', keys: [[0, 124, 138], [0.5, 112, 146], [1, 108, 148]] },
      { id: 'X4', tg: 'a', l: '', keys: [[0, 166, 184], [0.3, 158, 190], [1, 154, 192]] },
      { id: 'X5', tg: 'a', l: '', keys: [[0, 210, 56], [0.3, 220, 50], [1, 222, 48]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 170, 186], [0.3, 160, 190], [0.6, 150, 186], [1, 148, 184]],
    zones: [
      { d: 'M138 112 a30 26 0 1 0 4 0', at: [150, 106], label: { en: 'slot opens', ko: '슬롯이 열림' }, c: 'warn' }
    ],
    links: [[0, 5], [1, 6], [2, 7], [3, 8], [4, 9]],
    arrows: [{ d: 'M126 150 Q140 146 150 140', n: '', c: 'warn' }]
  };

  P.dzMod = {
    dur: 8400, mode: 'mini',
    name: { en: 'Low-zone collapse', ko: '로우존 콜랩스' },
    sub: { en: 'Four sink into the house, one holds the point.', ko: '네 명이 하우스로 내려가고 한 명이 포인트.' },
    badge: { en: 'Four protect the house', ko: '4명이 하우스를 보호' },
    steps: [
      { t: 0, en: 'Four collapse into the house', ko: '4명이 하우스로 압축' },
      { t: 0.3, en: 'Point shot is conceded', ko: '포인트 슛은 허용' },
      { t: 0.6, en: 'Block the lane, box out', ko: '레인 차단, 박스아웃' },
      { t: 0.85, en: 'Goaltender sees it clean', ko: '골텐더가 깨끗하게 봄' }
    ],
    players: [
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 76, 140], [1, 76, 140]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 108, 110], [0.4, 116, 120], [1, 118, 122]] },
      { id: 'F1', tg: 'h', l: 'F', keys: [[0, 112, 172], [0.4, 118, 164], [1, 120, 162]] },
      { id: 'F2', tg: 'h', l: 'F', keys: [[0, 146, 104], [0.4, 138, 118], [1, 136, 120]] },
      { id: 'F3', tg: 'h', l: 'F', keys: [[0, 200, 140], [0.3, 192, 138], [1, 190, 138]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 70, 92], [1, 70, 92]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 70, 194], [1, 70, 194]] },
      { id: 'X3', tg: 'a', l: '', keys: [[0, 128, 178], [1, 128, 178]] },
      { id: 'X4', tg: 'a', l: '', keys: [[0, 180, 80], [1, 180, 80]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 196, 138], [0.3, 190, 138], [0.55, 150, 146], [0.8, 64, 146], [1, 64, 146]],
    zones: [
      { d: 'M64 108 H158 V186 H64 Z', at: [110, 202], label: { en: 'the house', ko: '하우스' }, c: 'good' },
      { d: 'M180 96 a22 22 0 1 0 2 0', at: [196, 84], label: { en: 'low-danger shot', ko: '저위험 슛' }, c: 'warn' }
    ],
    arrows: [{ d: 'M188 136 Q146 142 76 144', n: '', c: 'warn' }]
  };


  /* ===================== special situations ===================== */
  P.sp53 = {
    dur: 9000, mode: 'mini',
    name: { en: '5-on-3 power play', ko: '5대3 파워플레이' },
    sub: { en: 'Three killers cannot cover five options — stretch them one more pass.', ko: '킬러 3명이 5개 옵션을 다 막을 수 없습니다. 패스 한 번으로 더 벌립니다.' },
    badge: { en: 'One extra man, two extra options', ko: '한 명 더, 두 개 더 많은 옵션' },
    steps: [
      { t: 0, en: 'Point holds, both half-walls high', ko: '포인트 유지, 양 하프월 하이' },
      { t: 0.2, en: 'Swing to the strong wall', ko: '스트롱 월로 스윙' },
      { t: 0.42, en: 'Bumper drops into the seam', ko: '범퍼가 시암으로 내려옴' },
      { t: 0.65, en: 'Net front is unmarked', ko: '골대 앞은 무마크' },
      { t: 0.85, en: 'One-timer from the slot', ko: '슬롯 원타이머' }
    ],
    players: [
      { id: 'P', tg: 'h', l: 'P', keys: [[0, 388, 140], [0.2, 392, 134], [1, 392, 134]] },
      { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 452, 66], [0.2, 458, 70], [1, 458, 70]] },
      { id: 'W2', tg: 'h', l: 'W2', keys: [[0, 452, 214], [0.5, 458, 208], [1, 458, 208]] },
      { id: 'B', tg: 'h', l: 'B', keys: [[0, 474, 140], [0.42, 486, 146], [1, 486, 146]] },
      { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 528, 140], [1, 528, 140]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 454, 104], [0.3, 462, 112], [1, 462, 112]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 454, 176], [0.3, 462, 168], [1, 462, 168]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 518, 140], [0.6, 512, 132], [1, 512, 132]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 390, 138], [0.2, 456, 70], [0.42, 484, 144], [0.65, 526, 138], [0.85, 542, 146], [1, 542, 146]],
    zones: [
      { d: 'M498 108 H540 V172 H498 Z', at: [519, 96], label: { en: 'no killer here', ko: '킬러 없음' }, c: 'good' }
    ],
    arrows: [
      { d: 'M394 136 Q424 96 452 74', n: '1', c: 'pass' },
      { d: 'M458 74 Q482 110 482 138', n: '2', c: 'pass' },
      { d: 'M488 146 Q510 148 524 144', n: '3', c: 'pass' },
      { d: 'M530 142 L544 146', n: '4', c: 'shot' }
    ]
  };

  P.sp43 = {
    dur: 8600, mode: 'mini',
    name: { en: '4-on-3 power play', ko: '4대3 파워플레이' },
    sub: { en: 'Open ice in overtime — every pass crosses a lane nobody can cover.', ko: '연장의 넓은 얼음. 모든 패스가 아무도 못 막는 레인을 지납니다.' },
    badge: { en: '4-on-3: open ice, one free lane', ko: '4대3 — 열린 레인 하나' },
    steps: [
      { t: 0, en: 'Point, two flanks, one net front', ko: '포인트, 양 측면, 골대 앞 1명' },
      { t: 0.22, en: 'Swing to the left flank', ko: '왼쪽 측면으로 스윙' },
      { t: 0.45, en: 'Low-to-high look at the net', ko: '낮은 위치에서 골대 앞으로' },
      { t: 0.68, en: 'Back door is wide open', ko: '백도어가 완전히 열림' },
      { t: 0.86, en: 'Tap-in at the far post', ko: '파포스트 탭인' }
    ],
    players: [
      { id: 'P', tg: 'h', l: 'P', keys: [[0, 398, 140], [0.3, 404, 138], [1, 404, 138]] },
      { id: 'LT', tg: 'h', l: 'LT', keys: [[0, 462, 82], [0.22, 468, 86], [1, 468, 86]] },
      { id: 'RT', tg: 'h', l: 'RT', keys: [[0, 462, 198], [0.68, 470, 192], [1, 470, 192]] },
      { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 528, 140], [0.45, 524, 130], [1, 524, 130]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 466, 110], [0.3, 472, 116], [1, 472, 116]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 466, 170], [0.68, 474, 166], [1, 474, 166]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 520, 140], [0.6, 514, 138], [1, 514, 138]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 400, 138], [0.22, 464, 86], [0.45, 520, 130], [0.68, 468, 190], [0.86, 542, 148], [1, 542, 148]],
    zones: [
      { d: 'M498 176 H546 V226 H498 Z', at: [522, 244], label: { en: 'back door open', ko: '백도어 열림' }, c: 'good' }
    ],
    arrows: [
      { d: 'M404 136 Q432 100 460 86', n: '1', c: 'pass' },
      { d: 'M468 88 Q504 100 520 126', n: '2', c: 'pass' },
      { d: 'M522 134 Q508 172 478 190', n: '3', c: 'pass' },
      { d: 'M476 192 Q510 190 540 152', n: '4', c: 'shot' }
    ]
  };

  P.sp65 = {
    dur: 9200, mode: 'mini',
    name: { en: '6-on-5 extra attacker', ko: '6대5 엑스트라 어태커' },
    sub: { en: 'Goaltender pulled: six skaters, an empty net behind you.', ko: '골텐더를 빼고 6명. 뒤에는 빈 골대.' },
    badge: { en: 'Six attackers · empty net behind', ko: '6명 공격 · 뒤는 빈 골대' },
    steps: [
      { t: 0, en: 'Sixth skater enters as the low outlet', ko: '6번째 선수가 낮은 출구로 진입' },
      { t: 0.22, en: 'Both walls occupied', ko: '양 월 점유' },
      { t: 0.46, en: 'Cycle keeps the puck alive', ko: '사이클로 퍽 유지' },
      { t: 0.7, en: 'Point shot through traffic', ko: '혼잡 구간을 지나는 포인트 슛' },
      { t: 0.88, en: 'Rebound at the far post', ko: '파포스트 리바운드' }
    ],
    players: [
      { id: 'P', tg: 'h', l: 'P', keys: [[0, 392, 140], [0.5, 398, 134], [1, 398, 134]] },
      { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 456, 66], [0.22, 462, 72], [1, 462, 72]] },
      { id: 'W2', tg: 'h', l: 'W2', keys: [[0, 456, 214], [0.7, 462, 206], [1, 462, 206]] },
      { id: 'B', tg: 'h', l: 'B', keys: [[0, 478, 140], [0.46, 488, 148], [1, 488, 148]] },
      { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 528, 132], [0.88, 532, 126], [1, 532, 126]] },
      { id: 'X6', tg: 'h', l: '6', keys: [[0, 506, 246], [0.46, 496, 232], [1, 496, 232]] },
      { id: 'D1', tg: 'a', l: '', keys: [[0, 450, 96], [1, 450, 96]] },
      { id: 'D2', tg: 'a', l: '', keys: [[0, 450, 184], [1, 450, 184]] },
      { id: 'D3', tg: 'a', l: '', keys: [[0, 512, 104], [1, 512, 104]] },
      { id: 'D4', tg: 'a', l: '', keys: [[0, 512, 176], [1, 512, 176]] },
      { id: 'D5', tg: 'a', l: '', keys: [[0, 536, 150], [1, 536, 150]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 394, 138], [0.22, 460, 72], [0.46, 494, 230], [0.7, 484, 146], [0.88, 540, 148], [1, 540, 148]],
    zones: [
      { d: 'M26 112 H64 V168 H26 Z', at: [45, 184], label: { en: 'our empty net', ko: '우리 빈 골대' }, c: 'warn' }
    ],
    arrows: [
      { d: 'M396 140 Q430 100 456 74', n: '1', c: 'pass' },
      { d: 'M462 74 Q492 150 496 226', n: '2', c: 'pass' },
      { d: 'M490 230 Q486 180 484 152', n: '3', c: 'pass' },
      { d: 'M486 146 L536 146', n: '4', c: 'shot' }
    ]
  };

  P.spDelay = {
    dur: 9000, mode: 'mini',
    name: { en: 'Delayed penalty · 6-on-5', ko: '지연 페널티 · 6대5' },
    sub: { en: 'Nobody can score short-handed until the penalised team touches the puck.', ko: '페널티 팀이 퍽을 건드리기 전까지는 실점 위험이 없습니다.' },
    badge: { en: 'Touch the puck = whistle', ko: '퍽 터치 = 휘슬' },
    steps: [
      { t: 0, en: 'Arm up, play continues', ko: '팔이 올라가고 경기는 계속' },
      { t: 0.22, en: 'Sixth attacker joins the cycle', ko: '6번째 선수가 사이클에 합류' },
      { t: 0.5, en: 'Penalised team must chase', ko: '페널티 팀은 쫓아야 함' },
      { t: 0.74, en: 'They reach for the puck', ko: '퍽에 손을 뻗음' },
      { t: 0.88, en: 'Whistle — penalty is served', ko: '휘슬 — 페널티 시작' }
    ],
    players: [
      { id: 'P', tg: 'h', l: 'P', keys: [[0, 396, 140], [1, 396, 140]] },
      { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 462, 74], [0.5, 470, 80], [1, 470, 80]] },
      { id: 'W2', tg: 'h', l: 'W2', keys: [[0, 462, 206], [0.5, 470, 200], [1, 470, 200]] },
      { id: 'B', tg: 'h', l: 'B', keys: [[0, 486, 140], [0.5, 494, 146], [1, 494, 146]] },
      { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 530, 132], [1, 530, 132]] },
      { id: 'X6', tg: 'h', l: '6', keys: [[0, 510, 234], [0.5, 502, 222], [1, 502, 222]] },
      { id: 'D1', tg: 'a', l: '', keys: [[0, 470, 110], [0.74, 486, 130], [1, 494, 140]] },
      { id: 'D2', tg: 'a', l: '', keys: [[0, 470, 172], [1, 470, 172]] },
      { id: 'D3', tg: 'a', l: '', keys: [[0, 520, 106], [1, 520, 106]] },
      { id: 'D4', tg: 'a', l: '', keys: [[0, 520, 176], [1, 520, 176]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 398, 138], [0.22, 466, 80], [0.5, 492, 144], [0.74, 496, 146], [1, 494, 146]],
    zones: [
      { d: 'M470 118 a26 26 0 1 0 2 0', at: [496, 106], label: { en: 'touch here = whistle', ko: '여기서 터치하면 휘슬' }, c: 'warn' }
    ],
    arrows: [
      { d: 'M462 80 Q484 60 500 62', n: '', c: 'pass' },
      { d: 'M476 110 Q488 126 492 136', n: '1', c: 'warn' }
    ]
  };

  P.sp44 = {
    dur: 8600, mode: 'mini',
    name: { en: '4-on-4', ko: '4대4' },
    sub: { en: 'Same ice, two fewer players — the middle is suddenly available.', ko: '같은 얼음, 두 명이 빠지면 중앙이 열립니다.' },
    badge: { en: 'Two D at the points, two forwards low', ko: 'D 2명 포인트, 포워드 2명 낮게' },
    steps: [
      { t: 0, en: 'Both defencemen hold the line', ko: '수비수 두 명이 라인 유지' },
      { t: 0.22, en: 'Low forward carries across the middle', ko: '낮은 포워드가 중앙을 가로질러' },
      { t: 0.48, en: 'Weak side slides into the slot', ko: '위크사이드가 슬롯으로' },
      { t: 0.72, en: 'Point-to-point opens the lane', ko: '포인트 간 이동으로 레인 개방' },
      { t: 0.88, en: 'Shot from the top of the circle', ko: '서클 상단 슛' }
    ],
    players: [
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 398, 100], [0.72, 404, 106], [1, 404, 106]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 398, 180], [0.72, 410, 190], [1, 410, 190]] },
      { id: 'F1', tg: 'h', l: 'F', keys: [[0, 478, 118], [0.22, 492, 150], [1, 492, 150]] },
      { id: 'F2', tg: 'h', l: 'F', keys: [[0, 500, 196], [0.48, 512, 172], [1, 512, 172]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 466, 140], [0.4, 476, 150], [1, 476, 150]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 520, 100], [1, 520, 100]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 520, 184], [1, 520, 184]] },
      { id: 'K4', tg: 'a', l: '', keys: [[0, 540, 140], [1, 540, 140]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 556, 140], [1, 556, 140]] }
    ],
    puck: [[0, 400, 102], [0.22, 488, 148], [0.48, 510, 172], [0.72, 412, 188], [0.88, 534, 148], [1, 534, 148]],
    zones: [
      { d: 'M470 118 H520 V162 H470 Z', at: [495, 174], label: { en: 'middle open', ko: '중앙 개방' }, c: 'good' }
    ],
    arrows: [
      { d: 'M404 104 Q448 132 484 148', n: '1', c: 'pass' },
      { d: 'M494 152 Q504 164 508 170', n: '2', c: 'pass' },
      { d: 'M508 174 Q462 186 418 188', n: '3', c: 'pass' },
      { d: 'M414 186 L530 152', n: '4', c: 'shot' }
    ]
  };

  P.sp33 = {
    dur: 9600, mode: 'mini',
    name: { en: '3-on-3 overtime', ko: '3대3 연장' },
    sub: { en: 'Possession is the change: hold the puck and you can rotate fresh legs.', ko: '3대3에서는 퍽 소유가 곧 교체권입니다.' },
    badge: { en: 'Hold the puck, choose the change', ko: '퍽을 잡으면 교체를 고른다' },
    steps: [
      { t: 0, en: 'Three attackers spread the width', ko: '3명이 폭을 벌림' },
      { t: 0.24, en: 'Carrier holds behind the puck', ko: '캐리어가 퍽 뒤에서 버팀' },
      { t: 0.5, en: 'Cycle until a defender commits', ko: '수비수가 나올 때까지 사이클' },
      { t: 0.74, en: 'Change on possession, not on a dump', ko: '덤프가 아니라 소유 상태에서 교체' },
      { t: 0.9, en: 'Two-on-one off the rush', ko: '역습 2대1' }
    ],
    players: [
      { id: 'A1', tg: 'h', l: 'A1', keys: [[0, 424, 140], [0.24, 410, 150], [0.5, 418, 146], [1, 424, 140]] },
      { id: 'A2', tg: 'h', l: 'A2', keys: [[0, 496, 96], [0.5, 504, 84], [1, 508, 88]] },
      { id: 'A3', tg: 'h', l: 'A3', keys: [[0, 496, 190], [0.5, 506, 200], [1, 510, 196]] },
      { id: 'B1', tg: 'a', l: '', keys: [[0, 470, 110], [0.5, 480, 120], [1, 484, 118]] },
      { id: 'B2', tg: 'a', l: '', keys: [[0, 470, 176], [0.5, 482, 166], [1, 486, 168]] },
      { id: 'B3', tg: 'a', l: '', keys: [[0, 532, 140], [1, 534, 140]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 554, 140], [1, 554, 140]] }
    ],
    puck: [[0, 426, 142], [0.24, 414, 150], [0.5, 420, 144], [0.74, 496, 200], [0.9, 536, 148], [1, 536, 148]],
    zones: [
      { d: 'M392 104 H436 V184 H392 Z', at: [414, 96], label: { en: 'safe change zone', ko: '안전 교체 구역' }, c: 'good' }
    ],
    arrows: [
      { d: 'M428 142 Q416 158 414 152', n: '1', c: 'pass' },
      { d: 'M420 144 Q460 176 498 198', n: '2', c: 'pass' },
      { d: 'M506 196 Q524 176 532 150', n: '3', c: 'shot' }
    ]
  };

  /* ===================== face-offs & regroup ===================== */
  P.fzOz = {
    dur: 7400, mode: 'mini',
    name: { en: 'Offensive-zone face-off win', ko: '오펜시브존 페이스오프' },
    sub: { en: 'Win it back to the point, screen, shoot.', ko: '포인트로 되돌리고, 스크린, 슛.' },
    badge: { en: 'Win back · screen · shot', ko: '백 패스 · 스크린 · 슛' },
    steps: [
      { t: 0, en: 'Set: centre at the dot, both walls loaded', ko: '세팅: 센터 도트, 양 월 대기' },
      { t: 0.24, en: 'Win it straight back to the D', ko: '수비수에게 바로 백' },
      { t: 0.5, en: 'Wingers drive the net', ko: '윙어가 골대를 향해 돌진' },
      { t: 0.72, en: 'Screen set in front', ko: '골대 앞 스크린 완성' },
      { t: 0.86, en: 'Shot from the top', ko: '상단에서 슛' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 488, 140], [0.24, 488, 132], [1, 488, 132]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 524, 84], [0.5, 534, 118], [1, 534, 118]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 516, 206], [0.5, 532, 174], [1, 532, 174]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 420, 92], [0.24, 426, 96], [1, 426, 96]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 420, 190], [1, 420, 190]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 470, 120], [1, 470, 120]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 514, 140], [1, 514, 140]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 476, 166], [1, 476, 166]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 488, 140], [0.24, 428, 96], [0.5, 432, 100], [0.72, 534, 140], [0.86, 546, 144], [1, 546, 144]],
    zones: [
      { d: 'M516 118 H552 V162 H516 Z', at: [534, 108], label: { en: 'screen + tip', ko: '스크린 + 팁' }, c: 'good' }
    ],
    arrows: [
      { d: 'M484 138 L432 100', n: '1', c: 'pass' },
      { d: 'M428 98 L540 142', n: '2', c: 'shot' },
      { d: 'M520 90 Q528 110 532 118', n: '3', c: 'chase' }
    ]
  };

  P.fzDz = {
    dur: 7400, mode: 'mini',
    name: { en: 'Defensive-zone face-off win', ko: '디펜시브존 페이스오프' },
    sub: { en: 'Win it forward, not back — straight up the wall and out.', ko: '뒤가 아니라 앞으로. 월을 따라 바로 탈출.' },
    badge: { en: 'Win forward · wall · exit', ko: '앞으로 승리 · 월 · 탈출' },
    steps: [
      { t: 0, en: 'Set: centre at the dot, walls tight', ko: '세팅: 센터 도트, 월은 붙어서' },
      { t: 0.24, en: 'Win it forward off the draw', ko: '드로에서 앞으로 이김' },
      { t: 0.48, en: 'Wall receiver already moving', ko: '월 리시버가 이미 이동 중' },
      { t: 0.72, en: 'Chip past the pinching D', ko: '핀치하는 D를 지나 칩' },
      { t: 0.88, en: 'Clean exit, no rim', ko: '림 없이 깔끔한 탈출' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 112, 140], [0.24, 118, 148], [1, 118, 148]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 150, 76], [0.48, 172, 90], [1, 190, 96]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 150, 204], [0.48, 176, 190], [1, 196, 184]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 82, 98], [1, 82, 98]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 82, 184], [1, 82, 184]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 88, 118], [0.5, 104, 110], [1, 112, 108]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 144, 120], [0.5, 160, 104], [1, 168, 100]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 144, 168], [1, 148, 170]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 112, 140], [0.24, 156, 90], [0.48, 186, 96], [0.72, 214, 88], [1, 214, 88]],
    zones: [
      { d: 'M196 64 H240 V132 H196 Z', at: [218, 52], label: { en: 'exit lane', ko: '탈출 레인' }, c: 'good' }
    ],
    arrows: [
      { d: 'M114 142 Q136 110 152 92', n: '1', c: 'pass' },
      { d: 'M190 94 Q206 90 214 88', n: '2', c: 'pass' }
    ]
  };

  P.fzPp = {
    dur: 7600, mode: 'mini',
    name: { en: 'Power-play face-off win', ko: '파워플레이 페이스오프' },
    sub: { en: 'Same draw, one more option: win back, swing, one-time.', ko: '같은 드로, 옵션 하나 더. 백, 스윙, 원타이머.' },
    badge: { en: 'Win · swing · one-timer', ko: '승리 · 스윙 · 원타이머' },
    steps: [
      { t: 0, en: 'Power-play setup on the draw', ko: 'PP 세팅으로 드로 준비' },
      { t: 0.22, en: 'Win back to the point', ko: '포인트로 백' },
      { t: 0.46, en: 'Point swings to the open flank', ko: '포인트가 열린 측면으로 스윙' },
      { t: 0.7, en: 'Bumper pulls a killer away', ko: '범퍼가 킬러를 끌어냄' },
      { t: 0.88, en: 'One-timer from the circle', ko: '서클 원타이머' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 488, 140], [0.22, 490, 134], [1, 490, 134]] },
      { id: 'P', tg: 'h', l: 'P', keys: [[0, 416, 140], [0.46, 424, 146], [1, 424, 146]] },
      { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 462, 76], [0.88, 468, 82], [1, 468, 82]] },
      { id: 'B', tg: 'h', l: 'B', keys: [[0, 484, 146], [0.7, 494, 138], [1, 494, 138]] },
      { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 528, 140], [1, 528, 140]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 462, 108], [0.7, 474, 122], [1, 474, 122]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 462, 172], [1, 466, 170]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 518, 140], [1, 520, 138]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 488, 140], [0.22, 420, 142], [0.46, 430, 148], [0.7, 496, 138], [0.88, 540, 146], [1, 540, 146]],
    zones: [
      { d: 'M448 62 H486 V100 H448 Z', at: [467, 52], label: { en: 'shooting lane', ko: '슈팅 레인' }, c: 'good' }
    ],
    arrows: [
      { d: 'M486 138 L428 142', n: '1', c: 'pass' },
      { d: 'M426 142 Q438 96 460 82', n: '2', c: 'pass' },
      { d: 'M466 80 Q504 108 520 132', n: '3', c: 'shot' }
    ]
  };

  P.fzReg = {
    dur: 9200, mode: 'mini',
    name: { en: 'Neutral-zone regroup', ko: '중립존 리그룹' },
    sub: { en: 'No entry? Turn back and come again with five.', ko: '진입이 막히면 돌아서서 다섯 명으로 다시.' },
    badge: { en: 'Turn back · D-to-D · re-enter', ko: '되돌아 · D-to-D · 재진입' },
    steps: [
      { t: 0, en: 'Carrier meets the wall of three', ko: '캐리어가 3인 벽과 마주침' },
      { t: 0.26, en: 'Turns back instead of forcing it', ko: '밀어붙이지 않고 뒤로 회전' },
      { t: 0.5, en: 'D-to-D resets the attack', ko: 'D-to-D로 공격 재설정' },
      { t: 0.74, en: 'Wingers stretch the far lane', ko: '윙어가 반대 레인으로 벌림' },
      { t: 0.9, en: 'Re-entry with speed', ko: '속도를 붙여 재진입' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 250, 150], [0.26, 208, 158], [0.5, 186, 150], [1, 240, 140]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 160, 108], [0.5, 172, 116], [1, 196, 122]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 160, 176], [0.5, 176, 172], [1, 200, 164]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 300, 84], [0.74, 276, 78], [1, 316, 74]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 300, 200], [0.74, 274, 206], [1, 318, 204]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 330, 140], [1, 330, 140]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 392, 100], [1, 392, 100]] },
      { id: 'X3', tg: 'a', l: '', keys: [[0, 392, 184], [1, 392, 184]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 252, 150], [0.26, 210, 158], [0.5, 178, 118], [0.74, 206, 160], [0.9, 300, 76], [1, 300, 76]],
    zones: [
      { d: 'M322 92 H330 V188 H322 Z', at: [326, 214], label: { en: 'entry denied', ko: '진입 차단' }, c: 'warn' }
    ],
    arrows: [
      { d: 'M252 150 Q230 162 212 158', n: '1', c: 'pass' },
      { d: 'M182 120 Q190 120 196 122', n: '2', c: 'pass' },
      { d: 'M202 160 Q244 150 296 84', n: '3', c: 'pass' }
    ]
  };

  P.fzTrap = {
    dur: 9400, mode: 'mini',
    name: { en: 'Regroup trap', ko: '리그룹 트랩' },
    sub: { en: 'Let them regroup — then take away the only exit.', ko: '리그룹은 허용하되, 유일한 출구를 지웁니다.' },
    badge: { en: 'Allow the reset, deny the exit', ko: '리셋 허용, 출구 차단' },
    steps: [
      { t: 0, en: 'F1 steers the carrier back', ko: 'F1이 캐리어를 뒤로 유도' },
      { t: 0.26, en: 'Carrier turns back to the D', ko: '캐리어가 D에게 되돌림' },
      { t: 0.5, en: 'Our wall holds the centre line', ko: '우리 벽이 센터라인 유지' },
      { t: 0.74, en: 'D-to-D gives them nothing', ko: 'D-to-D로 얻는 것이 없음' },
      { t: 0.9, en: 'Forced pass is intercepted', ko: '강제 패스가 차단됨' }
    ],
    players: [
      { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 330, 140], [0.26, 348, 148], [0.5, 336, 142], [1, 336, 142]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 280, 82], [0.5, 296, 88], [1, 296, 88]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 280, 198], [0.5, 296, 192], [1, 296, 192]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 236, 112], [1, 236, 112]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 236, 170], [1, 236, 170]] },
      { id: 'X1', tg: 'a', l: '', keys: [[0, 372, 140], [0.26, 344, 152], [0.5, 398, 160], [1, 398, 160]] },
      { id: 'X2', tg: 'a', l: '', keys: [[0, 442, 116], [1, 442, 116]] },
      { id: 'X3', tg: 'a', l: '', keys: [[0, 442, 182], [1, 442, 182]] },
      { id: 'X4', tg: 'a', l: '', keys: [[0, 470, 148], [1, 470, 148]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 372, 140], [0.26, 346, 152], [0.5, 396, 160], [0.74, 440, 150], [1, 440, 150]],
    zones: [
      { d: 'M292 76 V204', at: [300, 222], label: { en: 'no exit through the middle', ko: '중앙 출구 없음' }, c: 'good' }
    ],
    arrows: [
      { d: 'M370 140 Q356 154 348 154', n: '1', c: 'warn' },
      { d: 'M400 160 Q420 156 436 150', n: '2', c: 'warn' }
    ]
  };


  /* ------------- added face-off routines (v4) ------------- */
  P.fzOz2 = {
    dur: 7600, mode: 'mini',
    name: { en: 'O-zone win · over-under', ko: '오펜시브존 · 오버-언더' },
    sub: { en: 'Routine 2: win to the wall, wall to the point, point shot.', ko: '루틴 2: 월로 이기고, 월에서 포인트로, 포인트 슛.' },
    badge: { en: 'Over-under: wall → point → shot', ko: '오버-언더: 월 → 포인트 → 슛' },
    steps: [
      { t: 0, en: 'Centre and winger set an over-under', ko: '센터와 윙어가 오버-언더 세팅' },
      { t: 0.24, en: 'Win it to the wall, not the point', ko: '포인트가 아니라 월로 이김' },
      { t: 0.5, en: 'Wall bumps it back to the point', ko: '월이 포인트로 되돌림' },
      { t: 0.72, en: 'Two screens form in front', ko: '골대 앞에 스크린 두 개' },
      { t: 0.88, en: 'Shot through the double screen', ko: '더블 스크린 너머로 슛' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 488, 140], [0.24, 490, 132], [1, 490, 132]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 520, 86], [0.24, 528, 96], [0.5, 534, 108], [1, 534, 108]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 516, 204], [0.72, 528, 172], [1, 528, 172]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 424, 96], [0.5, 430, 100], [1, 430, 100]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 424, 186], [1, 424, 186]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 470, 120], [1, 470, 120]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 512, 140], [1, 512, 140]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 476, 166], [1, 476, 166]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 488, 140], [0.24, 526, 96], [0.5, 430, 100], [0.72, 534, 140], [0.88, 546, 144], [1, 546, 144]],
    zones: [
      { d: 'M516 112 H552 V168 H516 Z', at: [534, 104], label: { en: 'double screen', ko: '더블 스크린' }, c: 'good' }
    ],
    arrows: [
      { d: 'M488 136 Q508 108 524 98', n: '1', c: 'pass' },
      { d: 'M526 100 Q480 96 436 100', n: '2', c: 'pass' },
      { d: 'M432 100 L542 142', n: '3', c: 'shot' }
    ]
  };

  P.fzDz2 = {
    dur: 7800, mode: 'mini',
    name: { en: 'D-zone win · reverse behind', ko: '디펜시브존 · 리버스' },
    sub: { en: 'Routine 2: win back, reverse behind the net, exit the far wall.', ko: '루틴 2: 뒤로 이기고, 골대 뒤로 리버스, 반대 월로 탈출.' },
    badge: { en: 'Reverse behind the net', ko: '골대 뒤 리버스' },
    steps: [
      { t: 0, en: 'Centre wins it back to the D', ko: '센터가 수비수에게 백' },
      { t: 0.24, en: 'D1 reverses behind the net', ko: 'D1이 골대 뒤로 리버스' },
      { t: 0.5, en: 'D2 picks it up on the far side', ko: 'D2가 반대편에서 받음' },
      { t: 0.74, en: 'Far winger is already up the wall', ko: '반대 윙어가 이미 월 위로' },
      { t: 0.9, en: 'Exit past the forechecker', ko: '포체커를 지나 탈출' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 112, 140], [0.24, 106, 150], [1, 106, 150]] },
      { id: 'D1', tg: 'h', l: 'D', keys: [[0, 76, 116], [0.24, 60, 138], [1, 58, 140]] },
      { id: 'D2', tg: 'h', l: 'D', keys: [[0, 76, 168], [0.5, 54, 178], [1, 52, 178]] },
      { id: 'W1', tg: 'h', l: 'W', keys: [[0, 150, 80], [0.74, 172, 88], [1, 192, 92]] },
      { id: 'W2', tg: 'h', l: 'W', keys: [[0, 150, 204], [0.5, 170, 196], [1, 200, 188]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 92, 122], [0.5, 110, 112], [1, 120, 108]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 150, 118], [0.5, 146, 104], [1, 150, 98]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 126, 172], [1, 130, 174]] },
      { id: 'G', tg: 'h', gk: true, keys: [[0, 44, 140], [1, 44, 140]] }
    ],
    puck: [[0, 112, 140], [0.24, 74, 118], [0.5, 42, 152], [0.62, 56, 176], [0.8, 186, 92], [1, 214, 86]],
    zones: [
      { d: 'M26 118 H64 V166 H26 Z', at: [45, 110], label: { en: 'reverse zone', ko: '리버스 구역' }, c: 'good' }
    ],
    arrows: [
      { d: 'M112 142 Q94 128 80 120', n: '1', c: 'pass' },
      { d: 'M70 122 Q44 136 40 154', n: '2', c: 'pass' },
      { d: 'M48 168 Q120 96 186 90', n: '3', c: 'pass' }
    ]
  };

  P.fzPp2 = {
    dur: 7200, mode: 'mini',
    name: { en: 'PP face-off · direct shot', ko: 'PP 페이스오프 · 직접 슛' },
    sub: { en: 'Routine 2: win it clean to the point and shoot first time.', ko: '루틴 2: 포인트로 깔끔하게 이기고 바로 슛.' },
    badge: { en: 'One pass, then shoot', ko: '패스 한 번, 그다음 슛' },
    steps: [
      { t: 0, en: 'Bumper and net front set the screen', ko: '범퍼와 골대 앞이 스크린 준비' },
      { t: 0.24, en: 'Win it straight back to the point', ko: '포인트로 바로 백' },
      { t: 0.5, en: 'No extra pass — shoot', ko: '추가 패스 없이 슛' },
      { t: 0.72, en: 'Screen holds the goaltender', ko: '스크린이 골텐더 시야 차단' },
      { t: 0.88, en: 'Rebound at the far post', ko: '파포스트 리바운드' }
    ],
    players: [
      { id: 'C', tg: 'h', l: 'C', keys: [[0, 488, 140], [0.24, 490, 133], [1, 490, 133]] },
      { id: 'P', tg: 'h', l: 'P', keys: [[0, 428, 140], [0.5, 432, 143], [1, 432, 143]] },
      { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 470, 80], [0.72, 480, 92], [1, 480, 92]] },
      { id: 'W2', tg: 'h', l: 'W2', keys: [[0, 470, 200], [1, 470, 200]] },
      { id: 'B', tg: 'h', l: 'B', keys: [[0, 516, 150], [0.72, 520, 146], [1, 520, 146]] },
      { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 534, 132], [1, 534, 132]] },
      { id: 'K1', tg: 'a', l: '', keys: [[0, 466, 110], [1, 466, 110]] },
      { id: 'K2', tg: 'a', l: '', keys: [[0, 466, 174], [1, 466, 174]] },
      { id: 'K3', tg: 'a', l: '', keys: [[0, 520, 146], [1, 524, 146]] },
      { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
    ],
    puck: [[0, 488, 140], [0.24, 430, 142], [0.5, 546, 146], [1, 546, 146]],
    zones: [
      { d: 'M510 116 H548 V164 H510 Z', at: [529, 108], label: { en: 'screen lane', ko: '스크린 레인' }, c: 'good' }
    ],
    arrows: [
      { d: 'M486 138 L436 142', n: '1', c: 'pass' },
      { d: 'M434 142 L540 146', n: '2', c: 'shot' }
    ]
  };

  /* ------------- qualitative tags per structure (v4) ------------- */
  var TAGS = {
    pp131: [{ c: 'good', v: { en: 'Conversion: high', ko: '득점 확률: 높음' } }, { c: 'warn', v: { en: 'Rush risk: high', ko: '역습 실점 위험: 높음' } }],
    ppUmbrella: [{ c: 'good', v: { en: 'Shot volume: high', ko: '슛 양: 많음' } }, { c: 'mid', v: { en: 'Rush risk: medium', ko: '역습 실점 위험: 중간' } }],
    ppOverload: [{ c: 'mid', v: { en: 'Conversion: medium', ko: '득점 확률: 중간' } }, { c: 'warn', v: { en: 'Cross-ice pass risk', ko: '크로스 패스 리스크' } }],
    ppSpread: [{ c: 'mid', v: { en: 'Conversion: medium', ko: '득점 확률: 중간' } }, { c: 'warn', v: { en: 'Fewer net-front bodies', ko: '골대 앞 인원 적음' } }],
    pkDiamond: [{ c: 'good', v: { en: 'Seam coverage: good', ko: '시암 커버: 좋음' } }, { c: 'mid', v: { en: 'Short-handed threat: medium', ko: '쇼트핸디드 기회: 중간' } }],
    pkBox: [{ c: 'good', v: { en: 'High-danger conceded: low', ko: '고위험 허용: 낮음' } }, { c: 'warn', v: { en: 'Screened shots allowed', ko: '가려진 슛 허용' } }],
    pkWedge: [{ c: 'good', v: { en: 'Short-handed threat: high', ko: '쇼트핸디드 기회: 높음' } }, { c: 'warn', v: { en: 'Beaten first man = 3-on-4', ko: '첫 압박 뚫리면 3대4' } }],
    pk13: [{ c: 'mid', v: { en: 'Denies entries', ko: '진입 차단' } }, { c: 'warn', v: { en: 'Box stretches once entered', ko: '진입 허용 시 박스 벌어짐' } }],
    sp53: [{ c: 'good', v: { en: 'Conversion: very high', ko: '득점 확률: 매우 높음' } }, { c: 'good', v: { en: 'Rush risk: very low', ko: '실점 위험: 매우 낮음' } }],
    sp43: [{ c: 'good', v: { en: 'Conversion: high', ko: '득점 확률: 높음' } }, { c: 'mid', v: { en: 'Rush risk: low', ko: '실점 위험: 낮음' } }],
    sp65: [{ c: 'mid', v: { en: 'Conversion: medium', ko: '득점 확률: 중간' } }, { c: 'warn', v: { en: 'Empty-net risk: very high', ko: '빈 골대 실점 위험: 매우 높음' } }],
    spDelay: [{ c: 'mid', v: { en: 'Conversion: medium', ko: '득점 확률: 중간' } }, { c: 'good', v: { en: 'No short-handed goal risk', ko: '쇼트핸디드 실점 없음' } }],
    sp44: [{ c: 'mid', v: { en: 'Conversion: medium', ko: '득점 확률: 중간' } }, { c: 'mid', v: { en: 'Rush risk: medium', ko: '역습 실점 위험: 중간' } }],
    sp33: [{ c: 'mid', v: { en: 'Conversion: medium', ko: '득점 확률: 중간' } }, { c: 'warn', v: { en: 'Rush risk: high', ko: '역습 실점 위험: 높음' } }],
    fzOz: [{ c: 'good', v: { en: 'Shot generated: high', ko: '슛 생성: 높음' } }, { c: 'good', v: { en: 'Breakout risk: low', ko: '역습 위험: 낮음' } }],
    fzOz2: [{ c: 'good', v: { en: 'Shot generated: high', ko: '슛 생성: 높음' } }, { c: 'mid', v: { en: 'Needs a clean win', ko: '클린 승리 필요' } }],
    fzDz: [{ c: 'good', v: { en: 'Clean exit chance: high', ko: '깔끔한 탈출: 높음' } }, { d: 0, c: 'warn', v: { en: 'Loss here = slot shot', ko: '여기서 지면 슬롯 슛 허용' } }],
    fzDz2: [{ c: 'good', v: { en: 'Exit chance: high', ko: '탈출 확률: 높음' } }, { c: 'mid', v: { en: 'Timing-dependent', ko: '타이밍 의존' } }],
    fzPp: [{ c: 'good', v: { en: 'Conversion: high', ko: '득점 확률: 높음' } }, { c: 'good', v: { en: 'Set play, low risk', ko: '세트플레이, 리스크 낮음' } }],
    fzPp2: [{ c: 'good', v: { en: 'Conversion: high', ko: '득점 확률: 높음' } }, { c: 'mid', v: { en: 'One shot only', ko: '슛 한 번이 전부' } }],
    fzReg: [{ c: 'mid', v: { en: 'Entry chance: medium', ko: '진입 확률: 중간' } }, { c: 'good', v: { en: 'Turnover risk: low', ko: '턴오버 위험: 낮음' } }],
    fzTrap: [{ c: 'good', v: { en: 'Turnover forced: high', ko: '턴오버 유도: 높음' } }, { c: 'mid', v: { en: 'Concedes the regroup', ko: '리그룹은 허용' } }]
  };

  /* ---------------------------------------------------------- overlay DOM */
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    if (attrs) {
      for (var k in attrs) { if (attrs.hasOwnProperty(k)) { n.setAttribute(k, attrs[k]); } }
    }
    return n;
  }

  function fxBuild(b) {
    var play = b.play;
    if (!play || !b.svg) { return; }

    if (b._fxRoot && b._fxRoot.parentNode) { b._fxRoot.parentNode.removeChild(b._fxRoot); }

    var root = el('g', { 'class': 'fx-root' });
    var gZones = el('g', { 'class': 'fx-zones' });
    var gArrows = el('g', { 'class': 'fx-arrows' });
    var gLinks = el('g', { 'class': 'fx-links' });
    var gTrails = el('g', { 'class': 'fx-trails' });
    var gVecs = el('g', { 'class': 'fx-vecs' });
    root.appendChild(gZones);
    root.appendChild(gArrows);
    root.appendChild(gTrails);
    root.appendChild(gLinks);
    root.appendChild(gVecs);
    b.gPlayers.parentNode.insertBefore(root, b.gPlayers);

    /* static zones */
    (play.zones || []).forEach(function (z) {
      gZones.appendChild(el('path', { d: z.d, 'class': 'fx-zone' + (z.c ? ' fx-zone--' + z.c : '') }));
      if (z.label && z.at) {
        var tx = el('text', {
          x: z.at[0], y: z.at[1],
          'class': 'fx-zlabel' + (z.c ? ' fx-zlabel--' + z.c : ''),
          'text-anchor': 'middle'
        });
        tx.textContent = tr(z.label);
        gZones.appendChild(tx);
      }
    });

    /* numbered pass arrows */
    (play.arrows || []).forEach(function (a) {
      var path = el('path', { d: a.d, 'class': 'fx-arrow' + (a.c ? ' fx-arrow--' + a.c : '') });
      gArrows.appendChild(path);
      if (a.n) {
        var len = path.getTotalLength ? path.getTotalLength() : 0;
        var pt = len ? path.getPointAtLength(len * 0.52) : { x: 0, y: 0 };
        gArrows.appendChild(el('circle', { cx: pt.x, cy: pt.y, r: 7.5, 'class': 'fx-num-bg fx-num-bg--' + (a.c || 'pass') }));
        var tn = el('text', { x: pt.x, y: pt.y + 3.4, 'class': 'fx-num', 'text-anchor': 'middle' });
        tn.textContent = a.n;
        gArrows.appendChild(tn);
      }
    });

    /* per-player trail + vector */
    var trails = [], vecs = [];
    (play.players || []).forEach(function (pl, i) {
      if (pl.gk) { trails.push(null); vecs.push(null); return; }
      var tp = el('path', { d: '', 'class': 'fx-trail fx-trail--' + pl.tg });
      gTrails.appendChild(tp);
      trails.push(tp);
      var vs = el('path', { d: '', 'class': 'fx-vec fx-vec--' + pl.tg });
      gVecs.appendChild(vs);
      vecs.push(vs);
    });
    var ptrail = el('path', { d: '', 'class': 'fx-ptrail' });
    gTrails.appendChild(ptrail);

    /* man-marking links */
    var links = (play.links || []).map(function (pair) {
      var ln = el('line', { x1: 0, y1: 0, x2: 0, y2: 0, 'class': 'fx-link' });
      gLinks.appendChild(ln);
      return ln;
    });

    b._fx = { trails: trails, vecs: vecs, ptrail: ptrail, links: links, play: play };

    /* badge */
    if (b._fxBadge && b._fxBadge.parentNode) { b._fxBadge.parentNode.removeChild(b._fxBadge); }
    if (play.badge) {
      var inner = b.el.querySelector('.board-inner');
      if (inner) {
        var bd = document.createElement('p');
        bd.className = 'fx-badge';
        bd.textContent = tr(play.badge);
        inner.appendChild(bd);
        b._fxBadge = bd;
      }
    }

    /* qualitative risk / reward chips */
    if (b._fxTags && b._fxTags.parentNode) { b._fxTags.parentNode.removeChild(b._fxTags); }
    b._fxTags = null;
    var tagList = TAGS[b.playId];
    if (tagList && tagList.length) {
      var inner2 = b.el.querySelector('.board-inner');
      if (inner2) {
        var wrap2 = document.createElement('div');
        wrap2.className = 'fx-tags';
        tagList.forEach(function (tg) {
          var sp = document.createElement('span');
          sp.className = 'fx-tag fx-tag--' + tg.c;
          sp.textContent = tr(tg.v);
          wrap2.appendChild(sp);
        });
        inner2.appendChild(wrap2);
        b._fxTags = wrap2;
      }
    }
  }

  function pathOf(keys, p, steps) {
    var n = steps || 16;
    var d = '';
    for (var i = 0; i <= n; i++) {
      var u = (p * i) / n;
      var pt = sample(keys, u);
      d += (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1);
    }
    return d;
  }

  function fxDraw(b, p) {
    var fx = b._fx;
    if (!fx) { return; }
    var play = fx.play || b.play;

    (play.players || []).forEach(function (pl, i) {
      if (pl.gk) { return; }
      var tp = fx.trails[i];
      if (tp) { tp.setAttribute('d', p > 0.015 ? pathOf(pl.keys, p, 16) : ''); }
      var vs = fx.vecs[i];
      if (vs) {
        var cur = sample(pl.keys, p);
        var prev = sample(pl.keys, Math.max(0, p - 0.035));
        var dist = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
        if (dist > 2.2) {
          vs.setAttribute('d', arrow(prev[0], prev[1], cur[0], cur[1], 6));
        } else {
          vs.setAttribute('d', '');
        }
      }
    });

    fx.ptrail.setAttribute('d', p > 0.03 ? pathOf(play.puck, p, 22) : '');

    (play.links || []).forEach(function (pair, k) {
      var ln = fx.links[k];
      if (!ln) { return; }
      var a = sample(play.players[pair[0]].keys, p);
      var c = sample(play.players[pair[1]].keys, p);
      ln.setAttribute('x1', a[0].toFixed(1));
      ln.setAttribute('y1', a[1].toFixed(1));
      ln.setAttribute('x2', c[0].toFixed(1));
      ln.setAttribute('y2', c[1].toFixed(1));
    });
  }

  function enhance(b) {
    if (!b || !b.svg || !b.buildPlayers) { return; }
    if (P[b.playId]) { b.play = P[b.playId]; }
    b.buildPlayers();
    b.buildRoutes();
    fxBuild(b);
    if (!b._fxWrapped) {
      var orig = b.render.bind(b);
      b.render = function (p) { orig(p); fxDraw(b, p); };
      var origLoad = b.load.bind(b);
      b.load = function (id) {
        origLoad(id);
        if (P[id]) { b.play = P[id]; }
        fxBuild(b);
        b.render(0);
      };
      b._fxWrapped = true;
    }
    b.render(b.p || 0);
  }

  function injectPlays() {
    var T = window.HockeyTactics;
    if (!T || !T.plays) { return; }
    for (var id in P) { if (P.hasOwnProperty(id)) { T.plays[id] = P[id]; } }
  }

  function boot() {
    var T = window.HockeyTactics;
    if (!T || !T.boards) { return; }
    T.boards.forEach(function (b) {
      if (!b.el || !b.el.getAttribute('data-play')) { return; }
      enhance(b);
    });
  }

  document.addEventListener('hockey:lang', function (e) {
    LANG = e.detail && e.detail.lang === 'ko' ? 'ko' : 'en';
    var T = window.HockeyTactics;
    if (!T || !T.boards) { return; }
    T.boards.forEach(function (b) {
      if (!b.el || !b.el.getAttribute('data-play')) { return; }
      fxBuild(b);
      b.render(b.p || 0);
    });
  });

  injectPlays();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    boot();
  }
})();
