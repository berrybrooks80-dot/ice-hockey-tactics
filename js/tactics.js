/* ==========================================================================
   ICE-HOCKEY TACTICS — tactic board engine
   Rink is 600 x 280 units. Play data uses normalised time keys (0..1),
   so a board can be replayed, paused or frozen from the URL.
   ========================================================================== */
(function () {
  'use strict';

  var VB_W = 600, VB_H = 280;
  var LANG = 'en';

  /* ------------------------------------------------------------ helpers */
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
        return [
          lerp(keys[i - 1][1], keys[i][1], u),
          lerp(keys[i - 1][2], keys[i][2], u)
        ];
      }
    }
    var last = keys[keys.length - 1];
    return [last[1], last[2]];
  }

  function t(o, key) {
    if (!o) { return ''; }
    if (typeof o === 'string') { return o; }
    return LANG === 'ko' && o.ko ? o.ko : (o.en || '');
  }

  /* --------------------------------------------------------------- rink */
  function rink() {
    return '<g class="rink-art">' +
      '<rect class="rk-board" x="4" y="4" width="592" height="272" rx="46"/>' +
      '<rect class="rk-ice" x="16" y="16" width="568" height="248" rx="38"/>' +
      /* centre line + blue lines */
      '<line class="rk-line" x1="300" y1="16" x2="300" y2="264"/>' +
      '<line class="rk-blue" x1="220" y1="16" x2="220" y2="264"/>' +
      '<line class="rk-blue" x1="380" y1="16" x2="380" y2="264"/>' +
      /* centre circle */
      '<circle class="rk-circle" cx="300" cy="140" r="30"/>' +
      '<circle class="rk-dot" cx="300" cy="140" r="3.4"/>' +
      /* neutral dots */
      '<circle class="rk-dot" cx="220" cy="76" r="3.4"/><circle class="rk-dot" cx="220" cy="204" r="3.4"/>' +
      '<circle class="rk-dot" cx="380" cy="76" r="3.4"/><circle class="rk-dot" cx="380" cy="204" r="3.4"/>' +
      /* end-zone circles */
      '<circle class="rk-circle" cx="112" cy="82" r="30"/><circle class="rk-circle" cx="112" cy="198" r="30"/>' +
      '<circle class="rk-circle" cx="488" cy="82" r="30"/><circle class="rk-circle" cx="488" cy="198" r="30"/>' +
      '<circle class="rk-dot" cx="112" cy="82" r="3.4"/><circle class="rk-dot" cx="112" cy="198" r="3.4"/>' +
      '<circle class="rk-dot" cx="488" cy="82" r="3.4"/><circle class="rk-dot" cx="488" cy="198" r="3.4"/>' +
      '<circle class="rk-circle" cx="112" cy="140" r="4"/><circle class="rk-circle" cx="488" cy="140" r="4"/>' +
      /* creases + goals */
      '<path class="rk-crease" d="M40 108 a32 32 0 0 1 0 64 L20 172 L20 108 Z"/>' +
      '<path class="rk-crease" d="M560 108 a32 32 0 0 0 0 64 L580 172 L580 108 Z"/>' +
      '<line class="rk-goal" x1="34" y1="122" x2="34" y2="158"/>' +
      '<line class="rk-goal" x1="566" y1="122" x2="566" y2="158"/>' +
      '</g>';
  }

  /* --------------------------------------------------------------- plays */
  var A = 600; /* shorthand */

  var PLAYS = {

    /* ============================== POWER PLAY ============================== */
    pp131: {
      dur: 8200,
      name: { en: '1-3-1', ko: '1-3-1' },
      sub: {
        en: 'One point, three across, one at the net.',
        ko: '포인트 1명, 가로 3명, 골대 앞 1명.'
      },
      steps: [
        { t: 0, en: 'Point holds the middle of the blue line', ko: '포인트가 블루라인 중앙을 잡습니다' },
        { t: 0.16, en: 'Swing to the strong-side half-wall', ko: '스트롱사이드 하프월로 전환' },
        { t: 0.34, en: 'Half-wall feeds the bumper in the slot', ko: '하프월에서 슬롯의 범퍼로 연결' },
        { t: 0.52, en: 'Reverse to the far half-wall', ko: '반대쪽 하프월로 리버스' },
        { t: 0.70, en: 'Back to the point, kill shifts', ko: '포인트로 회귀, 킬이 이동' },
        { t: 0.86, en: 'Shot through a double screen', ko: '더블 스크린을 통한 슛' }
      ],
      routes: [
        { d: 'M498 60 Q508 104 528 128', c: 'route route--pass' }
      ],
      players: [
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 388, 140], [0.66, 392, 134], [0.86, 398, 140], [1, 398, 140]] },
        { id: 'LW', tg: 'h', l: 'LW', keys: [[0, 496, 54], [0.2, 502, 58], [1, 502, 58]] },
        { id: 'B', tg: 'h', l: 'B', keys: [[0, 462, 140], [0.34, 466, 146], [0.62, 470, 138], [1, 470, 138]] },
        { id: 'RW', tg: 'h', l: 'RW', keys: [[0, 496, 226], [0.52, 504, 222], [1, 504, 222]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 530, 140], [0.3, 528, 132], [0.86, 526, 126], [1, 526, 126]] },
        { id: 'D1', tg: 'a', l: '', keys: [[0, 446, 96], [0.2, 452, 90], [1, 452, 90]] },
        { id: 'D2', tg: 'a', l: '', keys: [[0, 446, 184], [0.5, 452, 190], [1, 452, 190]] },
        { id: 'D3', tg: 'a', l: '', keys: [[0, 512, 92], [1, 512, 92]] },
        { id: 'D4', tg: 'a', l: '', keys: [[0, 512, 188], [1, 512, 188]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] }
      ],
      puck: [[0, 388, 140], [0.16, 500, 56], [0.34, 466, 146], [0.52, 502, 224], [0.70, 396, 136], [0.84, 540, 144], [1, 540, 144]]
    },

    ppUmbrella: {
      dur: 8200,
      name: { en: 'Umbrella', ko: '엄브렐라' },
      sub: {
        en: 'Point on top, two at the tops of the circles, two down low.',
        ko: '포인트가 꼭대기, 서클 상단 2명, 낮은 위치 2명.'
      },
      steps: [
        { t: 0, en: 'Point starts the swing', ko: '포인트가 스윙을 시작' },
        { t: 0.15, en: 'Left circle: one-timer threat', ko: '왼쪽 서클: 원타이머 위협' },
        { t: 0.33, en: 'Down to the goal line', ko: '골라인 아래로 내려감' },
        { t: 0.50, en: 'Net-front tip option', ko: '골대 앞 팁 옵션' },
        { t: 0.68, en: 'Out to the right circle', ko: '오른쪽 서클로 아웃' },
        { t: 0.85, en: 'One-timer from the circle', ko: '서클에서 원타이머' }
      ],
      routes: [
        { d: 'M452 88 L528 128', c: 'route route--shot' }
      ],
      players: [
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 396, 140], [0.1, 402, 144], [1, 402, 144]] },
        { id: 'LT', tg: 'h', l: 'LT', keys: [[0, 452, 88], [0.15, 456, 92], [1, 456, 92]] },
        { id: 'RT', tg: 'h', l: 'RT', keys: [[0, 452, 192], [0.68, 458, 188], [1, 458, 188]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 528, 146], [0.5, 526, 132], [1, 526, 132]] },
        { id: 'GL', tg: 'h', l: 'GL', keys: [[0, 510, 232], [0.33, 518, 238], [0.62, 512, 226], [1, 512, 226]] },
        { id: 'D1', tg: 'a', l: '', keys: [[0, 452, 110], [0.15, 462, 104], [1, 462, 104]] },
        { id: 'D2', tg: 'a', l: '', keys: [[0, 452, 170], [0.68, 464, 176], [1, 464, 176]] },
        { id: 'D3', tg: 'a', l: '', keys: [[0, 514, 104], [1, 514, 104]] },
        { id: 'D4', tg: 'a', l: '', keys: [[0, 514, 178], [1, 514, 178]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] }
      ],
      puck: [[0, 400, 142], [0.15, 456, 92], [0.33, 516, 236], [0.50, 526, 132], [0.68, 458, 188], [0.86, 538, 148], [1, 538, 148]]
    },

    ppOverload: {
      dur: 8600,
      name: { en: 'Overload', ko: '오버로드' },
      sub: {
        en: 'Four skaters on one side, one weak-side shooter.',
        ko: '한쪽에 4명을 몰고, 반대쪽에 슈터 1명.'
      },
      steps: [
        { t: 0, en: 'Load the strong side', ko: '스트롱사이드에 인원을 몰아넣기' },
        { t: 0.18, en: 'Wall to the corner', ko: '하프월에서 코너로' },
        { t: 0.36, en: 'Low cycle draws two killers', ko: '로우 사이클로 킬러 2명 유인' },
        { t: 0.56, en: 'Net-front look', ko: '골대 앞 슛 기회' },
        { t: 0.74, en: 'Back up top', ko: '다시 위로' },
        { t: 0.88, en: 'Weak-side release', ko: '위크사이드 릴리스' }
      ],
      routes: [
        { d: 'M404 120 L446 62', c: 'route route--shot' }
      ],
      players: [
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 404, 118], [0.74, 410, 124], [1, 410, 124]] },
        { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 498, 208], [0.36, 506, 214], [1, 506, 214]] },
        { id: 'C', tg: 'h', l: 'C', keys: [[0, 522, 250], [0.36, 530, 252], [0.7, 526, 240], [1, 526, 240]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 528, 158], [0.56, 524, 146], [1, 524, 146]] },
        { id: 'W2', tg: 'h', l: 'W2', keys: [[0, 446, 58], [0.88, 452, 64], [1, 452, 64]] },
        { id: 'D1', tg: 'a', l: '', keys: [[0, 452, 112], [0.36, 470, 128], [1, 470, 128]] },
        { id: 'D2', tg: 'a', l: '', keys: [[0, 514, 100], [0.36, 500, 116], [1, 500, 116]] },
        { id: 'D3', tg: 'a', l: '', keys: [[0, 506, 184], [0.36, 496, 176], [1, 496, 176]] },
        { id: 'D4', tg: 'a', l: '', keys: [[0, 452, 192], [0.36, 470, 186], [1, 470, 186]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] }
      ],
      puck: [[0, 406, 120], [0.18, 502, 210], [0.36, 528, 248], [0.56, 524, 146], [0.74, 412, 124], [0.88, 448, 62], [1, 448, 62]]
    },

    ppSpread: {
      dur: 8200,
      name: { en: 'Spread 2-1-2', ko: '스프레드 2-1-2' },
      sub: {
        en: 'Two points, one slot, two low half-walls.',
        ko: '포인트 2명, 슬롯 1명, 낮은 하프월 2명.'
      },
      steps: [
        { t: 0, en: 'Both points stretch the kill', ko: '포인트 두 명이 킬을 벌립니다' },
        { t: 0.18, en: 'Point to the low half-wall', ko: '포인트에서 낮은 하프월로' },
        { t: 0.38, en: 'Into the slot', ko: '슬롯으로 진입' },
        { t: 0.58, en: 'Across to the weak wall', ko: '위크사이드 월로 크로스' },
        { t: 0.76, en: 'Point to point', ko: '포인트 간 이동' },
        { t: 0.9, en: 'Shot from the top', ko: '상단에서 슛' }
      ],
      players: [
        { id: 'P1', tg: 'h', l: 'P1', keys: [[0, 410, 76], [0.76, 416, 82], [1, 416, 82]] },
        { id: 'P2', tg: 'h', l: 'P2', keys: [[0, 410, 204], [0.76, 416, 198], [1, 416, 198]] },
        { id: 'S', tg: 'h', l: 'S', keys: [[0, 472, 140], [0.38, 480, 142], [0.66, 476, 136], [1, 476, 136]] },
        { id: 'W1', tg: 'h', l: 'W1', keys: [[0, 514, 64], [0.18, 520, 70], [1, 520, 70]] },
        { id: 'W2', tg: 'h', l: 'W2', keys: [[0, 514, 216], [0.58, 520, 210], [1, 520, 210]] },
        { id: 'D1', tg: 'a', l: '', keys: [[0, 458, 100], [0.18, 470, 94], [1, 470, 94]] },
        { id: 'D2', tg: 'a', l: '', keys: [[0, 458, 180], [0.58, 470, 186], [1, 470, 186]] },
        { id: 'D3', tg: 'a', l: '', keys: [[0, 516, 104], [1, 516, 104]] },
        { id: 'D4', tg: 'a', l: '', keys: [[0, 516, 176], [1, 516, 176]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] }
      ],
      puck: [[0, 412, 78], [0.18, 518, 68], [0.38, 480, 142], [0.58, 518, 212], [0.76, 414, 196], [0.90, 540, 146], [1, 540, 146]]
    },

    /* ============================== PENALTY KILL ============================== */
    pkDiamond: {
      dur: 8800,
      name: { en: 'Diamond', ko: '다이아몬드' },
      sub: {
        en: 'One high, two flanks, one at the net. Pressure on the puck side.',
        ko: '위 1명, 측면 2명, 골대 앞 1명. 퍽 쪽으로 압박.'
      },
      steps: [
        { t: 0, en: 'Diamond sets above the dots', ko: '다이아몬드가 서클 위에 자리' },
        { t: 0.16, en: 'Top man takes the point shot away', ko: '상단이 포인트 슛을 차단' },
        { t: 0.36, en: 'Flank closes the seam', ko: '측면이 시암을 닫음' },
        { t: 0.56, en: 'Rotate with the puck', ko: '퍽을 따라 로테이션' },
        { t: 0.74, en: 'Low man holds the back door', ko: '하단이 백도어를 지킴' },
        { t: 0.88, en: 'Blocked shot, clear the zone', ko: '슛 블록 후 클리어' }
      ],
      routes: [
        { d: 'M476 90 L500 60', c: 'route route--pass' }
      ],
      players: [
        { id: 'F1', tg: 'a', l: 'F1', keys: [[0, 420, 140], [0.16, 436, 104], [0.36, 452, 132], [0.56, 436, 152], [1, 436, 152]] },
        { id: 'W1', tg: 'a', l: 'W1', keys: [[0, 476, 86], [0.2, 490, 74], [0.5, 486, 92], [1, 486, 92]] },
        { id: 'W2', tg: 'a', l: 'W2', keys: [[0, 476, 194], [0.6, 492, 190], [1, 492, 190]] },
        { id: 'D', tg: 'a', l: 'D', keys: [[0, 526, 140], [0.78, 522, 150], [1, 522, 150]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] },
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 388, 140], [1, 388, 140]] },
        { id: 'LW', tg: 'h', l: 'LW', keys: [[0, 496, 54], [1, 496, 54]] },
        { id: 'B', tg: 'h', l: 'B', keys: [[0, 464, 140], [1, 464, 140]] },
        { id: 'RW', tg: 'h', l: 'RW', keys: [[0, 498, 226], [1, 498, 226]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 530, 140], [1, 530, 140]] }
      ],
      puck: [[0, 388, 140], [0.2, 496, 54], [0.38, 466, 140], [0.56, 388, 140], [0.74, 498, 226], [0.88, 540, 148], [1, 540, 148]]
    },

    pkBox: {
      dur: 8600,
      name: { en: 'Passive box', ko: '패시브 박스' },
      sub: {
        en: 'Four in a square around the slot. Concede the perimeter.',
        ko: '슬롯 주위에 4명의 사각형. 외곽은 내줍니다.'
      },
      steps: [
        { t: 0, en: 'Box packs the slot', ko: '박스가 슬롯을 압축' },
        { t: 0.2, en: 'Perimeter is conceded', ko: '외곽 슛은 허용' },
        { t: 0.44, en: 'Slide as a unit with the puck', ko: '퍽을 따라 단위로 이동' },
        { t: 0.66, en: 'Front the shot, no tips', ko: '슛 앞을 막고 팁 허용 안 함' },
        { t: 0.82, en: 'Collapse on the rebound', ko: '리바운드에 모여들기' }
      ],
      players: [
        { id: 'B1', tg: 'a', l: 'B1', keys: [[0, 452, 96], [0.2, 446, 110], [1, 446, 110]] },
        { id: 'B2', tg: 'a', l: 'B2', keys: [[0, 452, 184], [0.6, 446, 172], [1, 446, 172]] },
        { id: 'B3', tg: 'a', l: 'B3', keys: [[0, 512, 96], [0.2, 506, 108], [1, 506, 108]] },
        { id: 'B4', tg: 'a', l: 'B4', keys: [[0, 512, 184], [0.6, 506, 172], [1, 506, 172]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] },
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 392, 140], [1, 392, 140]] },
        { id: 'LW', tg: 'h', l: 'LW', keys: [[0, 500, 56], [1, 500, 56]] },
        { id: 'B', tg: 'h', l: 'B', keys: [[0, 470, 140], [1, 470, 140]] },
        { id: 'RW', tg: 'h', l: 'RW', keys: [[0, 500, 224], [1, 500, 224]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 530, 140], [1, 530, 140]] }
      ],
      puck: [[0, 392, 140], [0.2, 500, 56], [0.44, 530, 140], [0.62, 500, 224], [0.8, 392, 140], [0.92, 528, 152], [1, 528, 152]]
    },

    pkWedge: {
      dur: 8800,
      name: { en: 'Wedge + 1', ko: '웨지 + 1' },
      sub: {
        en: 'One skater attacks the puck, three form a triangle behind him.',
        ko: '한 명이 퍽에 달려들고, 세 명이 뒤에 삼각형을 만듭니다.'
      },
      steps: [
        { t: 0, en: 'F1 jumps the wall', ko: 'F1이 하프월로 달려듭니다' },
        { t: 0.22, en: 'Wedge seals the middle', ko: '웨지가 중앙을 봉인' },
        { t: 0.42, en: 'Force the pass back to the point', ko: '포인트로의 백패스를 유도' },
        { t: 0.64, en: 'Second pressure on the point', ko: '포인트에 두 번째 압박' },
        { t: 0.82, en: 'Reset into the box', ko: '박스로 재정렬' }
      ],
      players: [
        { id: 'F1', tg: 'a', l: 'F1', keys: [[0, 492, 64], [0.22, 502, 76], [0.42, 476, 92], [0.64, 430, 116], [0.82, 460, 108], [1, 460, 108]] },
        { id: 'W1', tg: 'a', l: 'W1', keys: [[0, 456, 108], [0.22, 470, 120], [0.62, 456, 118], [1, 456, 118]] },
        { id: 'W2', tg: 'a', l: 'W2', keys: [[0, 456, 172], [0.22, 470, 162], [0.62, 458, 164], [1, 458, 164]] },
        { id: 'D', tg: 'a', l: 'D', keys: [[0, 522, 140], [0.42, 516, 140], [1, 516, 140]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] },
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 390, 140], [0.64, 396, 132], [1, 396, 132]] },
        { id: 'LW', tg: 'h', l: 'LW', keys: [[0, 496, 56], [1, 496, 56]] },
        { id: 'B', tg: 'h', l: 'B', keys: [[0, 466, 140], [1, 466, 140]] },
        { id: 'RW', tg: 'h', l: 'RW', keys: [[0, 498, 224], [1, 498, 224]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 530, 140], [1, 530, 140]] }
      ],
      puck: [[0, 496, 58], [0.22, 500, 78], [0.42, 390, 138], [0.64, 392, 130], [0.82, 496, 58], [1, 496, 58]]
    },

    pk13: {
      dur: 8600,
      name: { en: '1-3', ko: '1-3' },
      sub: {
        en: 'One chaser, three across the blue line.',
        ko: '체이서 1명, 블루라인에 가로 3명.'
      },
      steps: [
        { t: 0, en: '1-3 sits at the blue line', ko: '1-3이 블루라인에 자리' },
        { t: 0.2, en: 'Three across deny the entry', ko: '3명이 진입로를 차단' },
        { t: 0.44, en: 'Chaser forces the point', ko: '체이서가 포인트를 압박' },
        { t: 0.66, en: 'Third man protects the slot', ko: '세 번째 선수가 슬롯을 보호' },
        { t: 0.84, en: 'Wall wins the loose puck', ko: '월이 루즈 퍽을 획득' }
      ],
      players: [
        { id: 'F1', tg: 'a', l: 'F1', keys: [[0, 412, 140], [0.44, 424, 138], [0.66, 412, 146], [1, 412, 146]] },
        { id: 'W1', tg: 'a', l: 'W1', keys: [[0, 474, 64], [0.2, 482, 78], [1, 482, 78]] },
        { id: 'W2', tg: 'a', l: 'W2', keys: [[0, 474, 140], [0.2, 484, 140], [1, 484, 140]] },
        { id: 'W3', tg: 'a', l: 'W3', keys: [[0, 474, 214], [0.2, 482, 200], [1, 482, 200]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 550, 140], [1, 550, 140]] },
        { id: 'P', tg: 'h', l: 'P', keys: [[0, 386, 140], [0.44, 392, 136], [1, 392, 136]] },
        { id: 'LW', tg: 'h', l: 'LW', keys: [[0, 498, 54], [1, 498, 54]] },
        { id: 'B', tg: 'h', l: 'B', keys: [[0, 468, 140], [1, 468, 140]] },
        { id: 'RW', tg: 'h', l: 'RW', keys: [[0, 500, 226], [1, 500, 226]] },
        { id: 'NF', tg: 'h', l: 'NF', keys: [[0, 530, 140], [1, 530, 140]] }
      ],
      puck: [[0, 388, 140], [0.2, 498, 54], [0.42, 468, 140], [0.62, 500, 226], [0.8, 392, 136], [0.9, 540, 148], [1, 540, 148]]
    },

    /* ============================== FORECHECK ============================== */
    fcTrad: {
      dur: 7600,
      mode: 'mini',
      name: { en: '2-1-2 forecheck', ko: '2-1-2 포체크' },
      sub: { en: 'Two chase, one high, two on the line.', ko: '2명 추격, 1명 하이, 2명 라인.' },
      steps: [
        { t: 0, en: 'Dump-in goes to the corner', ko: '덤프인이 코너로' },
        { t: 0.3, en: 'F1 and F2 both chase', ko: 'F1과 F2가 함께 추격' },
        { t: 0.62, en: 'Wall battle, one support', ko: '월 배틀, 서포트 1명' },
        { t: 0.85, en: 'Turnover, but the middle is open', ko: '턴오버 성공, 그러나 중앙이 비어 있음' }
      ],
      players: [
        { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 502, 132], [0.3, 526, 196], [0.62, 538, 232], [1, 538, 232]] },
        { id: 'F2', tg: 'h', l: 'F2', keys: [[0, 470, 188], [0.3, 492, 210], [0.62, 512, 226], [1, 512, 226]] },
        { id: 'F3', tg: 'h', l: 'F3', keys: [[0, 352, 140], [0.3, 372, 128], [1, 372, 128]] },
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 300, 84], [1, 300, 84]] },
        { id: 'D2', tg: 'h', l: 'D', keys: [[0, 300, 196], [1, 300, 196]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 546, 240], [0.6, 540, 244], [1, 540, 244]] },
        { id: 'X2', tg: 'a', l: '', keys: [[0, 480, 250], [1, 480, 250]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 548, 238], [1, 548, 238]],
      routes: [{ d: 'M506 138 Q526 190 542 228', c: 'route' }]
    },

    fcMod: {
      dur: 7600,
      mode: 'mini',
      name: { en: '1-3-1 layered forecheck', ko: '1-3-1 레이어 포체크' },
      sub: { en: 'One pressures, three hold the middle, one stays high.', ko: '1명 압박, 3명 중앙 유지, 1명 하이.' },
      steps: [
        { t: 0, en: 'Dump-in goes to the corner', ko: '덤프인이 코너로' },
        { t: 0.3, en: 'F1 pressures above the puck', ko: 'F1이 퍽 위에서 압박' },
        { t: 0.62, en: 'Three form a wall on the line', ko: '3명이 라인에 벽을 형성' },
        { t: 0.85, en: 'Forced pass into the wall', ko: '강제 패스가 벽에 걸림' }
      ],
      players: [
        { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 508, 136], [0.3, 518, 168], [0.62, 522, 186], [1, 522, 186]] },
        { id: 'F2', tg: 'h', l: 'F2', keys: [[0, 396, 72], [0.62, 402, 80], [1, 402, 80]] },
        { id: 'F3', tg: 'h', l: 'F3', keys: [[0, 396, 140], [0.62, 408, 140], [1, 408, 140]] },
        { id: 'F4', tg: 'h', l: 'F4', keys: [[0, 396, 208], [0.62, 402, 200], [1, 402, 200]] },
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 318, 140], [1, 318, 140]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 546, 240], [0.5, 540, 244], [1, 540, 244]] },
        { id: 'X2', tg: 'a', l: '', keys: [[0, 470, 250], [1, 470, 250]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 548, 238], [0.5, 540, 244], [0.72, 470, 120], [1, 470, 120]],
      routes: [{ d: 'M540 236 Q500 190 470 122', c: 'route route--pass' }]
    },

    /* ============================== BREAKOUT ============================== */
    boTrad: {
      dur: 7000,
      mode: 'mini',
      name: { en: 'Rim and chase', ko: '림 앤 체이스' },
      sub: { en: 'Fire it around the boards and race.', ko: '보드로 걷어내고 경쟁.' },
      steps: [
        { t: 0, en: 'D retrieves behind the net', ko: '수비수가 골대 뒤에서 회수' },
        { t: 0.25, en: 'Rim hard around the boards', ko: '보드를 따라 강하게 림' },
        { t: 0.55, en: 'Winger wins the race', ko: '윙어가 경쟁에서 승리' },
        { t: 0.8, en: 'Chip and chase up the wall', ko: '월로 칩 앤 체이스' }
      ],
      players: [
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 82, 146], [0.25, 92, 154], [1, 96, 156]] },
        { id: 'D2', tg: 'h', l: 'D', keys: [[0, 132, 96], [1, 132, 96]] },
        { id: 'W1', tg: 'h', l: 'W', keys: [[0, 156, 48], [0.55, 162, 40], [0.8, 236, 52], [1, 244, 54]] },
        { id: 'C', tg: 'h', l: 'C', keys: [[0, 196, 196], [0.8, 214, 176], [1, 218, 174]] },
        { id: 'W2', tg: 'h', l: 'W', keys: [[0, 254, 114], [1, 268, 104]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 126, 116], [0.4, 146, 82], [1, 154, 78]] },
        { id: 'X2', tg: 'a', l: '', keys: [[0, 176, 168], [0.4, 196, 120], [1, 204, 116]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 84, 148], [0.25, 148, 30], [0.55, 168, 42], [0.8, 240, 52], [1, 240, 52]],
      routes: [{ d: 'M90 150 Q110 24 150 26', c: 'route route--pass' }]
    },

    boMod: {
      dur: 7000,
      mode: 'mini',
      name: { en: 'Five-man short support', ko: '5인 숏 서포트' },
      sub: { en: 'D-to-D, centre swings low, winger moves up.', ko: 'D-to-D, 센터 로 스윙, 윙어 전진.' },
      steps: [
        { t: 0, en: 'D retrieves, partner opens up', ko: '수비수 회수, 파트너가 각을 엶' },
        { t: 0.28, en: 'D-to-D changes the angle', ko: 'D-to-D로 각도 전환' },
        { t: 0.55, en: 'Centre swings low as the short option', ko: '센터가 낮게 스윙해 숏 옵션' },
        { t: 0.8, en: 'Winger receives already moving', ko: '윙어가 달리며 패스 받음' }
      ],
      players: [
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 80, 122], [0.28, 88, 128], [1, 90, 130]] },
        { id: 'D2', tg: 'h', l: 'D', keys: [[0, 80, 168], [0.28, 96, 172], [1, 98, 172]] },
        { id: 'C', tg: 'h', l: 'C', keys: [[0, 148, 206], [0.55, 156, 200], [1, 160, 198]] },
        { id: 'W1', tg: 'h', l: 'W', keys: [[0, 176, 86], [0.8, 214, 94], [1, 222, 96]] },
        { id: 'W2', tg: 'h', l: 'W', keys: [[0, 232, 178], [1, 250, 170]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 138, 112], [0.5, 158, 76], [1, 168, 72]] },
        { id: 'X2', tg: 'a', l: '', keys: [[0, 194, 160], [0.5, 208, 130], [1, 214, 126]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 82, 124], [0.28, 96, 170], [0.55, 156, 200], [0.8, 214, 94], [1, 214, 94]],
      routes: [
        { d: 'M84 130 L94 166', c: 'route route--pass' },
        { d: 'M100 174 Q124 206 152 200', c: 'route route--pass' },
        { d: 'M162 194 Q186 140 210 96', c: 'route route--pass' }
      ]
    },

    /* ============================== NEUTRAL ZONE ============================== */
    nzTrad: {
      dur: 7400,
      mode: 'mini',
      name: { en: '1-2-2', ko: '1-2-2' },
      sub: { en: 'One, two, two — a reactive shape.', ko: '1, 2, 2 — 반응형 형태.' },
      steps: [
        { t: 0, en: 'Carrier enters the neutral zone', ko: '캐리어가 중립존 진입' },
        { t: 0.3, en: 'Middle pair closes the seam', ko: '중앙 두 명이 시암을 닫음' },
        { t: 0.6, en: 'Forced to the wall', ko: '월로 몰림' },
        { t: 0.85, en: 'Dump-in becomes a 50-50', ko: '덤프인이 50대50 경쟁으로' }
      ],
      players: [
        { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 404, 140], [0.3, 386, 136], [1, 386, 136]] },
        { id: 'M1', tg: 'h', l: 'M', keys: [[0, 332, 88], [0.3, 336, 106], [1, 336, 106]] },
        { id: 'M2', tg: 'h', l: 'M', keys: [[0, 332, 192], [0.3, 336, 174], [1, 336, 174]] },
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 252, 92], [1, 252, 92]] },
        { id: 'D2', tg: 'h', l: 'D', keys: [[0, 252, 188], [1, 252, 188]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 372, 106], [0.6, 330, 130], [1, 306, 66]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 372, 106], [0.3, 342, 126], [0.6, 310, 78], [0.85, 296, 46], [1, 296, 46]],
      routes: [{ d: 'M368 104 L318 74', c: 'route route--pass' }]
    },

    nzMod: {
      dur: 7400,
      mode: 'mini',
      name: { en: '1-3-1 trap', ko: '1-3-1 트랩' },
      sub: { en: 'One, three across the centre line, one behind.', ko: '1명, 센터라인 가로 3명, 뒤 1명.' },
      steps: [
        { t: 0, en: 'Wall forms on the centre line', ko: '센터라인에 벽 형성' },
        { t: 0.3, en: 'Carrier is steered to the wall', ko: '캐리어를 월로 유도' },
        { t: 0.6, en: 'Pass is intercepted by the wall', ko: '패스가 벽에 차단' },
        { t: 0.85, en: 'Counter with numbers', ko: '수적 우위로 역습' }
      ],
      players: [
        { id: 'F1', tg: 'h', l: 'F1', keys: [[0, 392, 140], [0.3, 372, 132], [1, 372, 132]] },
        { id: 'W1', tg: 'h', l: 'W', keys: [[0, 330, 74], [1, 330, 74]] },
        { id: 'W2', tg: 'h', l: 'W', keys: [[0, 330, 140], [1, 330, 140]] },
        { id: 'W3', tg: 'h', l: 'W', keys: [[0, 330, 206], [1, 330, 206]] },
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 252, 140], [1, 252, 140]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 388, 92], [0.3, 356, 116], [0.6, 336, 74], [1, 330, 54]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 388, 92], [0.3, 356, 116], [0.55, 340, 84], [0.7, 336, 66], [1, 336, 66]],
      routes: [{ d: 'M386 94 L344 116', c: 'route' }]
    },

    /* ============================== D-ZONE ============================== */
    dzTrad: {
      dur: 7200,
      mode: 'mini',
      name: { en: 'Man-on-man', ko: '맨투맨' },
      sub: { en: 'Every defender locks onto one attacker.', ko: '수비수마다 한 명씩 전담.' },
      steps: [
        { t: 0, en: 'Everyone takes a man', ko: '각자 한 명씩 마크' },
        { t: 0.3, en: 'Follow him anywhere', ko: '어디든 따라감' },
        { t: 0.6, en: 'Battle in front', ko: '골대 앞 배틀' },
        { t: 0.85, en: 'One lost check opens the slot', ko: '한 번의 실패로 슬롯이 열림' }
      ],
      players: [
        { id: 'M1', tg: 'h', l: '', keys: [[0, 92, 92], [0.3, 86, 84], [1, 86, 84]] },
        { id: 'M2', tg: 'h', l: '', keys: [[0, 92, 190], [0.3, 86, 198], [1, 86, 198]] },
        { id: 'M3', tg: 'h', l: '', keys: [[0, 140, 128], [0.5, 128, 140], [1, 128, 140]] },
        { id: 'M4', tg: 'h', l: '', keys: [[0, 182, 178], [0.3, 176, 186], [1, 176, 186]] },
        { id: 'M5', tg: 'h', l: '', keys: [[0, 186, 72], [1, 186, 72]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 74, 86], [1, 74, 86]] },
        { id: 'X2', tg: 'a', l: '', keys: [[0, 74, 196], [1, 74, 196]] },
        { id: 'X3', tg: 'a', l: '', keys: [[0, 124, 136], [0.5, 150, 150], [1, 150, 150]] },
        { id: 'X4', tg: 'a', l: '', keys: [[0, 168, 182], [1, 168, 182]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 172, 178], [0.3, 160, 170], [0.6, 150, 150], [1, 150, 150]],
      routes: [
        { d: 'M92 92 L78 86', c: 'route route--pass' },
        { d: 'M92 190 L78 196', c: 'route route--pass' },
        { d: 'M140 128 L122 136', c: 'route route--pass' }
      ]
    },

    dzMod: {
      dur: 7200,
      mode: 'mini',
      name: { en: 'Low-zone collapse', ko: '로우존 콜랩스' },
      sub: { en: 'Four collapse into the house, one holds the point.', ko: '4명이 하우스로 모이고, 1명이 포인트.' },
      steps: [
        { t: 0, en: 'Four collapse into the house', ko: '4명이 하우스로 압축' },
        { t: 0.3, en: 'Point shot is conceded', ko: '포인트 슛은 허용' },
        { t: 0.6, en: 'Block the lane, box out', ko: '레인 차단, 박스아웃' },
        { t: 0.85, en: 'Goaltender sees it clean', ko: '골텐더가 깨끗하게 봄' }
      ],
      players: [
        { id: 'D1', tg: 'h', l: 'D', keys: [[0, 72, 140], [1, 72, 140]] },
        { id: 'D2', tg: 'h', l: 'D', keys: [[0, 106, 112], [1, 106, 112]] },
        { id: 'F1', tg: 'h', l: 'F', keys: [[0, 112, 172], [1, 112, 172]] },
        { id: 'F2', tg: 'h', l: 'F', keys: [[0, 140, 104], [1, 140, 104]] },
        { id: 'F3', tg: 'h', l: 'F', keys: [[0, 196, 140], [0.3, 190, 140], [1, 190, 140]] },
        { id: 'X1', tg: 'a', l: '', keys: [[0, 70, 92], [1, 70, 92]] },
        { id: 'X2', tg: 'a', l: '', keys: [[0, 70, 194], [1, 70, 194]] },
        { id: 'X3', tg: 'a', l: '', keys: [[0, 132, 138], [1, 132, 138]] },
        { id: 'X4', tg: 'a', l: '', keys: [[0, 176, 82], [1, 176, 82]] },
        { id: 'G', tg: 'a', gk: true, keys: [[0, 552, 140], [1, 552, 140]] }
      ],
      puck: [[0, 196, 138], [0.3, 190, 138], [0.55, 150, 142], [0.8, 60, 146], [1, 60, 146]],
      routes: [{ d: 'M190 140 L150 142', c: 'route route--shot' }]
    }
  };

  /* Hero board reuses the 1-3-1 */
  PLAYS.hero = PLAYS.pp131;

  /* ------------------------------------------------------------ registry */
  var OPTS = (function () {
    var q = {};
    try {
      var p = new URLSearchParams(location.search);
      q.freeze = p.get('freeze') !== null ? parseFloat(p.get('freeze')) : null;
      if (isNaN(q.freeze)) { q.freeze = null; }
    } catch (e) { q.freeze = null; }
    return q;
  })();

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var registry = [];

  function TacticBoard(el) {
    this.el = el;
    this.mode = el.getAttribute('data-mode') || 'full';
    this.stepsEl = null;
    this.playId = el.getAttribute('data-play') || 'pp131';
    this.p = 0;
    this.playing = true;
    this.raf = null;
    this.base = 0;
    this.visible = false;
    this.build();
    this.load(this.playId);
  }

  TacticBoard.prototype.build = function () {
    var bar = this.mode === 'full' || this.mode === 'lg'
      ? '<div class="board-bar">' +
          '<button class="bp-btn" type="button" data-act="toggle" aria-label="Play or pause">' +
            '<svg viewBox="0 0 16 16" class="ico-pause"><rect x="3" y="2.5" width="4" height="11" rx="1"/><rect x="9" y="2.5" width="4" height="11" rx="1"/></svg>' +
          '</button>' +
          '<button class="bp-btn" type="button" data-act="replay" aria-label="Replay">' +
            '<svg viewBox="0 0 16 16"><path d="M8 2.5a5.5 5.5 0 1 0 5.3 7h-2.1A3.4 3.4 0 1 1 8 4.6v2L4.6 3.6 8 .4z"/></svg>' +
          '</button>' +
          '<div class="bp-track"><div class="bp-fill"></div></div>' +
          '<span class="bp-label">00%</span>' +
        '</div>'
      : '';

    this.el.innerHTML =
      '<div class="board-inner">' +
        '<svg class="board-svg" viewBox="0 0 ' + VB_W + ' ' + VB_H + '" role="img">' +
          rink() +
          '<g class="routes"></g>' +
          '<g class="players"></g>' +
          '<g class="puck-layer"></g>' +
        '</svg>' +
        '<div class="board-caption" hidden></div>' +
      '</div>' + bar;

    this.svg = this.el.querySelector('svg');
    this.gRoutes = this.el.querySelector('.routes');
    this.gPlayers = this.el.querySelector('.players');
    this.gPuck = this.el.querySelector('.puck-layer');
    this.captionEl = this.el.querySelector('.board-caption');
    this.fillEl = this.el.querySelector('.bp-fill');
    this.labelEl = this.el.querySelector('.bp-label');
    this.toggleBtn = this.el.querySelector('[data-act="toggle"]');

    var self = this;
    this.el.addEventListener('click', function (e) {
      var b = e.target.closest('.bp-btn');
      if (!b) { return; }
      if (b.getAttribute('data-act') === 'toggle') { self.toggle(); }
      else { self.replay(); }
    });
  };

  TacticBoard.prototype.load = function (id) {
    var play = PLAYS[id] || PLAYS.pp131;
    this.playId = id;
    this.play = play;
    this.p = 0;
    this.buildPlayers();
    this.buildRoutes();
    this.buildSteps();
    this.render(0);
    this.startClock();
  };

  TacticBoard.prototype.buildPlayers = function () {
    var out = '';
    var play = this.play;
    for (var i = 0; i < play.players.length; i++) {
      var pl = play.players[i];
      if (pl.gk) {
        out += '<g class="pl pl--gk" data-i="' + i + '">' +
          '<ellipse class="gk" cx="0" cy="0" rx="8" ry="6.5"/></g>';
      } else {
        out += '<g class="pl pl--' + pl.tg + '" data-i="' + i + '">' +
          '<circle class="pl-ring" cx="0" cy="0" r="12"/>' +
          '<circle class="pl-body" cx="0" cy="0" r="11"/>' +
          (pl.l ? '<text class="pl-label" x="0" y="0">' + pl.l + '</text>' : '') +
          '</g>';
      }
    }
    this.gPlayers.innerHTML = out;
    this.playerEls = Array.prototype.slice.call(this.gPlayers.querySelectorAll('.pl'));
    this.gPuck.innerHTML = '<rect class="puck" x="-4" y="-3" width="8" height="6" rx="2.4"/>';
    this.puckEl = this.gPuck.querySelector('.puck');
  };

  TacticBoard.prototype.buildRoutes = function () {
    var routes = this.play.routes || [];
    this.gRoutes.innerHTML = routes.map(function (r) {
      return '<path class="' + (r.c || 'route') + '" d="' + r.d + '"/>';
    }).join('');
  };

  TacticBoard.prototype.buildSteps = function () {
    if (!this.stepsEl) { return; }
    var steps = this.play.steps || [];
    this.stepsEl.innerHTML = steps.map(function (s) {
      return '<li>' + t(s) + '</li>';
    }).join('');
    this.stepEls = Array.prototype.slice.call(this.stepsEl.children);
  };

  TacticBoard.prototype.startClock = function () {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    this.base = performance.now();
    this.playing = !reduceMotion;
    if (OPTS.freeze !== null) {
      this.playing = false;
      this.render(Math.max(0, Math.min(1, OPTS.freeze)));
      return;
    }
    if (reduceMotion) {
      this.render(0.42);
      return;
    }
    this.syncButton();
    this.tick(performance.now());
  };

  TacticBoard.prototype.tick = function (now) {
    if (!this.playing || !this.visible) { this.raf = null; return; }
    var p = ((now - this.base) / this.play.dur) % 1;
    this.render(p);
    var self = this;
    this.raf = requestAnimationFrame(function (n) { self.tick(n); });
  };

  TacticBoard.prototype.syncButton = function () {
    if (!this.toggleBtn) { return; }
    this.toggleBtn.innerHTML = this.playing
      ? '<svg viewBox="0 0 16 16"><rect x="3" y="2.5" width="4" height="11" rx="1"/><rect x="9" y="2.5" width="4" height="11" rx="1"/></svg>'
      : '<svg viewBox="0 0 16 16"><path d="M4 2.4 13 8 4 13.6z"/></svg>';
  };

  TacticBoard.prototype.toggle = function () {
    this.playing = !this.playing;
    if (this.playing) {
      this.base = performance.now() - this.p * this.play.dur;
      this.syncButton();
      if (!this.raf) { this.tick(performance.now()); }
    } else {
      this.syncButton();
      if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    }
  };

  TacticBoard.prototype.replay = function () {
    this.base = performance.now();
    this.playing = true;
    this.syncButton();
    if (!this.raf) { this.tick(performance.now()); }
  };

  TacticBoard.prototype.render = function (p) {
    this.p = p;
    var play = this.play;
    var px = 0, py = 0;

    for (var i = 0; i < play.players.length; i++) {
      var pl = play.players[i];
      var pos = sample(pl.keys, p);
      var el = this.playerEls[i];
      var inner = el.firstElementChild;
      if (pl.gk) {
        inner.setAttribute('cx', pos[0].toFixed(1));
        inner.setAttribute('cy', pos[1].toFixed(1));
      } else {
        var shape = inner.nextElementSibling;
        shape.setAttribute('cx', pos[0].toFixed(1));
        shape.setAttribute('cy', pos[1].toFixed(1));
        var label = shape.nextElementSibling;
        if (label) {
          label.setAttribute('x', pos[0].toFixed(1));
          label.setAttribute('y', pos[1].toFixed(1));
        }
      }
      if (pl.tg === 'h') { px = pos[0]; py = pos[1]; }
    }

    var puck = sample(play.puck, p);
    this.puckEl.setAttribute('x', (puck[0] - 4).toFixed(1));
    this.puckEl.setAttribute('y', (puck[1] - 3).toFixed(1));

    /* highlight whoever is on the puck */
    if (this.playerEls) {
      var best = -1, bestD = 900;
      for (var k = 0; k < play.players.length; k++) {
        if (play.players[k].gk) { continue; }
        var pp = sample(play.players[k].keys, p);
        var d = (pp[0] - puck[0]) * (pp[0] - puck[0]) + (pp[1] - puck[1]) * (pp[1] - puck[1]);
        if (d < bestD) { bestD = d; best = k; }
      }
      for (var m = 0; m < this.playerEls.length; m++) {
        this.playerEls[m].classList.toggle('is-puck', m === best && bestD < 500);
      }
    }

    /* progress + step highlight */
    if (this.fillEl) { this.fillEl.style.width = (p * 100).toFixed(1) + '%'; }
    if (this.labelEl) { this.labelEl.textContent = ('0' + Math.round(p * 100)).slice(-2) + '%'; }

    var steps = play.steps || [];
    var active = -1;
    for (var s = 0; s < steps.length; s++) {
      if (p >= steps[s].t) { active = s; }
    }
    if (this.stepEls) {
      for (var q = 0; q < this.stepEls.length; q++) {
        this.stepEls[q].classList.toggle('is-live', q === active);
      }
    }
    if (this.captionEl) {
      if (active >= 0 && steps[active]) {
        this.captionEl.hidden = false;
        this.captionEl.textContent = t(steps[active]);
      } else {
        this.captionEl.hidden = true;
      }
    }
  };

  /* ------------------------------------------------------------- mount */
  function mountAll() {
    var els = document.querySelectorAll('[data-board]');
    Array.prototype.forEach.call(els, function (el) {
      var b = new TacticBoard(el);
      registry.push(b);
    });

    /* only animate boards that are on screen */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var board = null;
          for (var i = 0; i < registry.length; i++) {
            if (registry[i].el === en.target) { board = registry[i]; }
          }
          if (!board) { return; }
          board.visible = en.isIntersecting;
          if (board.visible && board.playing && !board.raf && OPTS.freeze === null) {
            board.tick(performance.now());
          }
          if (!board.visible && board.raf) {
            cancelAnimationFrame(board.raf);
            board.raf = null;
          }
        });
      }, { rootMargin: '120px' });
      registry.forEach(function (b) { io.observe(b.el); });
    } else {
      registry.forEach(function (b) { b.visible = true; });
    }
  }

  /* ----------------------------------------------------------- tab groups */
  function byId(id) { return document.getElementById(id); }

  function wireTabs() {
    var groups = document.querySelectorAll('[data-tabs]');
    Array.prototype.forEach.call(groups, function (group) {
      var playbook = group.closest('.playbook');
      if (!playbook) { return; }
      var boardEl = playbook.querySelector('.board');
      if (!boardEl) { return; }
      var board = null;
      for (var i = 0; i < registry.length; i++) {
        if (registry[i].el === boardEl) { board = registry[i]; }
      }
      if (!board) { return; }

      var kind = group.getAttribute('data-tabs');
      board.stepsEl = byId(kind + 'Steps');
      board.buildSteps();

      function activate(btn) {
        var tabs = group.querySelectorAll('.tab');
        Array.prototype.forEach.call(tabs, function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');

        var id = btn.getAttribute('data-play');
        board.load(id);
        board.stepsEl = byId(kind + 'Steps');
        board.buildSteps();
        board.render(0);

        var play = PLAYS[id];
        var nameEl = byId(kind + 'Name');
        var subEl = byId(kind + 'Sub');
        if (nameEl) { nameEl.textContent = t(play.name); }
        if (subEl) { subEl.textContent = t(play.sub); }
      }

      group.addEventListener('click', function (e) {
        var btn = e.target.closest('.tab');
        if (btn) { activate(btn); }
      });

      /* first paint */
      var first = group.querySelector('.tab.is-active');
      if (first) {
        var play = PLAYS[first.getAttribute('data-play')];
        var nameEl = byId(kind + 'Name');
        var subEl = byId(kind + 'Sub');
        if (nameEl) { nameEl.textContent = t(play.name); }
        if (subEl) { subEl.textContent = t(play.sub); }
      }
    });
  }

  /* -------------------------------------------------------- tactic cards */
  var PP_CARDS = [
    {
      id: 'pp131', shape: '1 · 3 · 1',
      en: 'The default at the top level. The point can swing the puck either way, the bumper works the middle seam, and the net-front body never leaves the crease.',
      ko: '최상위 무대의 기본형. 포인트가 양쪽으로 스윙하고, 범퍼가 중앙 시암을 담당하며, 골대 앞 선수가 크리스를 떠나지 않습니다.',
      up: { en: 'Best one-timer geometry and a permanent screen', ko: '최상의 원타이머 각도와 상시 스크린' },
      down: { en: 'A pressured point turns into a 2-on-1 the other way', ko: '포인트가 압박당하면 역으로 2대1을 허용' }
    },
    {
      id: 'ppUmbrella', shape: '1 · 2 · 2',
      en: 'Three shooters on an arc at the top of the zone, two bodies low. Built for heavy shots from the circles and tips at the net.',
      ko: '존 상단에 세 명의 슈터를 호로 배치하고 아래에 두 명. 서클에서의 강한 슛과 골대 앞 팁을 노립니다.',
      up: { en: 'Clean shooting lanes from the circles', ko: '서클에서 깨끗한 슈팅 레인' },
      down: { en: 'Long passes, so the kill can pressure the points', ko: '패스가 길어 포인트 압박에 취약' }
    },
    {
      id: 'ppOverload', shape: '4 · 1',
      en: 'Four skaters on the strong side to create a 3-on-2 down low, with one shooter waiting on the weak side. The power play becomes a cycle game.',
      ko: '한쪽에 4명을 몰아 낮은 지역에서 3대2를 만들고, 반대쪽에 슈터 한 명을 대기시킵니다.',
      up: { en: 'Numbers on the puck, wins wall battles', ko: '퍽 주변 수적 우위, 월 배틀 우세' },
      down: { en: 'The cross-ice pass to the weak side is long', ko: '위크사이드로의 크로스 패스가 길다' }
    },
    {
      id: 'ppSpread', shape: '2 · 1 · 2',
      en: 'Two points and two low half-walls stretch the kill horizontally, so the slot opens for a middle drive or a shot from the top.',
      ko: '포인트 2명과 낮은 하프월 2명이 킬을 좌우로 벌려, 슬롯이 열리며 중앙 침투나 상단 슛이 가능해집니다.',
      up: { en: 'Maximum width, hard to pressure both points', ko: '최대 폭, 양 포인트 압박이 어렵다' },
      down: { en: 'Fewer bodies at the net front', ko: '골대 앞 인원이 적다' }
    }
  ];

  var PK_CARDS = [
    {
      id: 'pkDiamond', shape: '1 · 2 · 1',
      en: 'The classic kill. The top man takes the point shot away, the flanks protect the seams, and the low man owns the back door.',
      ko: '고전적인 킬. 상단이 포인트 슛을 차단하고, 측면이 시암을, 하단이 백도어를 책임집니다.',
      up: { en: 'Covers both seams and the point', ko: '양 시암과 포인트를 모두 커버' },
      down: { en: 'Vulnerable to quick low-to-high passes', ko: '로우-투-하이 속공 패스에 취약' }
    },
    {
      id: 'pkBox', shape: '2 · 2',
      en: 'Four skaters in a square around the slot. The point shot is conceded on purpose; the job is to keep the house clean and let the goaltender see it.',
      ko: '슬롯 주위 사각형. 포인트 슛은 의도적으로 허용하고, 하우스를 지키며 골텐더의 시야를 확보합니다.',
      up: { en: 'Protects the highest-danger area', ko: '최고 위험 지역을 보호' },
      down: { en: 'Concedes the point and screened shots', ko: '포인트와 가려진 슛을 허용' }
    },
    {
      id: 'pkWedge', shape: '1 + 3',
      en: 'A chaser attacks the puck while three form a wedge behind him. Pressure without giving up the middle — the hybrid most modern kills drift toward.',
      ko: '체이서가 퍽을 공격하고 뒤에 3명이 웨지를 이룹니다. 중앙을 내주지 않으면서 압박하는 현대적 하이브리드.',
      up: { en: 'Forces turnovers and short-handed chances', ko: '턴오버와 쇼트핸디드 기회 창출' },
      down: { en: 'Beaten first man means a 3-on-4 in front', ko: '첫 압박이 뚫리면 골대 앞 3대4' }
    },
    {
      id: 'pk13', shape: '1 · 3',
      en: 'One chaser with three across the blue line. Aimed at the entry rather than the setup: deny the clean zone entry and make the power play start over.',
      ko: '체이서 1명과 블루라인 가로 3명. 세팅보다 진입을 막아 파워플레이를 처음부터 다시 하게 만듭니다.',
      up: { en: 'Kills entries, wastes power-play time', ko: '진입 차단, 파워플레이 시간 소모' },
      down: { en: 'Once the zone is gained, the box is stretched', ko: '존 진입을 허용하면 박스가 늘어난다' }
    }
  ];

  function renderCards(target, list, isPP) {
    var el = byId(target);
    if (!el) { return; }
    el.innerHTML = list.map(function (c) {
      var play = PLAYS[c.id];
      return '<article class="tactic-card">' +
        '<h3>' + t(play.name) + '</h3>' +
        '<p class="tactic-shape">' + c.shape + '</p>' +
        '<p>' + t({ en: c.en, ko: c.ko }) + '</p>' +
        '<div class="tc-row">' +
          '<span><b>' + (isPP ? (LANG === 'ko' ? '강점' : 'Edge') : (LANG === 'ko' ? '강점' : 'Edge')) + '</b>' + t(c.up) + '</span>' +
          '<span><b>' + (LANG === 'ko' ? '리스크' : 'Risk') + '</b>' + t(c.down) + '</span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* -------------------------------------------------------------- boot */
  function boot() {
    LANG = window.HOCKEY_LANG === 'ko' ? 'ko' : 'en';
    mountAll();
    wireTabs();
    renderCards('ppCards', PP_CARDS, true);
    renderCards('pkCards', PK_CARDS, false);
  }

  document.addEventListener('hockey:lang', function (e) {
    LANG = e.detail && e.detail.lang === 'ko' ? 'ko' : 'en';
    /* refresh text that JS owns */
    registry.forEach(function (b) {
      if (b.stepsEl) { b.buildSteps(); b.render(b.p); }
    });
    var groups = document.querySelectorAll('[data-tabs]');
    Array.prototype.forEach.call(groups, function (group) {
      var kind = group.getAttribute('data-tabs');
      var active = group.querySelector('.tab.is-active');
      if (!active) { return; }
      var play = PLAYS[active.getAttribute('data-play')];
      var nameEl = byId(kind + 'Name');
      var subEl = byId(kind + 'Sub');
      if (nameEl) { nameEl.textContent = t(play.name); }
      if (subEl) { subEl.textContent = t(play.sub); }
    });
    renderCards('ppCards', PP_CARDS, true);
    renderCards('pkCards', PK_CARDS, false);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.HockeyTactics = { plays: PLAYS, boards: registry };
})();
